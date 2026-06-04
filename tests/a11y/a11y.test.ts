import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { chromium, type Browser, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

// Boots `astro preview` against the existing dist/ and runs axe-core against
// a fixed set of representative pages. Baseline-aware: existing violations
// listed in baseline.json are ignored; new rule IDs fail the build.
//
// Re-baseline by copying the printed "Current violations" block over the
// "violations" key in baseline.json, after auditing that each new entry is
// intentional/known.

const DIST_DIR = join(process.cwd(), 'dist');
const PREVIEW_PORT = 4327;
const PREVIEW_HOST = '127.0.0.1';
const BASE_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const BASELINE_PATH = join(process.cwd(), 'tests', 'a11y', 'baseline.json');

interface Baseline {
  global: string[];
  violations: Record<string, string[]>;
}

function readBaseline(): Baseline {
  if (!existsSync(BASELINE_PATH)) return { global: [], violations: {} };
  const raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
  return { global: raw.global ?? [], violations: raw.violations ?? {} };
}

function findFirstChapterSectionUrl(): string | null {
  // Only canonical /chapters/v<N>/<chapter-slug>/<section-slug>/ pages are
  // tested. Numeric-only entries like /chapters/01/ are legacy redirect
  // surfaces and not the production reader URL.
  const chaptersDir = join(DIST_DIR, 'chapters');
  if (!existsSync(chaptersDir)) return null;
  const versions = readdirSync(chaptersDir)
    .filter((d) => /^v\d+$/.test(d))
    .sort();
  for (const version of versions) {
    const versionDir = join(chaptersDir, version);
    if (!statSync(versionDir).isDirectory()) continue;
    for (const chapter of readdirSync(versionDir)) {
      const chapterDir = join(versionDir, chapter);
      if (!statSync(chapterDir).isDirectory()) continue;
      for (const section of readdirSync(chapterDir)) {
        const sectionPath = join(chapterDir, section);
        if (statSync(sectionPath).isDirectory()) {
          const idx = join(sectionPath, 'index.html');
          if (existsSync(idx)) {
            return `/chapters/${version}/${chapter}/${section}`;
          }
        }
      }
    }
  }
  return null;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch {
      // not yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`);
}

// Evaluated at module-load time so it's available when it.each builds the
// table (beforeAll runs too late for that).
const CHAPTER_URL = existsSync(DIST_DIR) ? findFirstChapterSectionUrl() : null;

const PAGE_URLS: { path: string; label: string }[] = [
  { path: '/', label: 'home' },
  { path: '/teach', label: 'teach' },
  { path: '/read', label: 'read' },
  { path: '/get-certified', label: 'get-certified' },
  { path: '/privacy-policy', label: 'privacy-policy' },
  ...(CHAPTER_URL ? [{ path: CHAPTER_URL, label: 'chapter-section' }] : []),
];

// Every page in this site must not introduce new axe-core violations
// beyond the captured baseline. If this fails on a PR, a UI change has
// degraded the experience for readers using assistive tech (screen
// readers, keyboard-only navigation, high-contrast modes). The
// baseline.json captures the known existing issues that we've decided
// to live with for now; only NEW rule IDs trigger failure, so that
// contributors get a clear, focused signal about what their change
// broke without being blamed for pre-existing issues.
describe('axe-core accessibility scan', () => {
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;

  beforeAll(async () => {
    if (!existsSync(DIST_DIR)) {
      throw new Error(
        `dist/ not found at ${DIST_DIR}. Run \`pnpm build\` before \`pnpm test:a11y\`.`,
      );
    }

    server = spawn(
      'pnpm',
      ['exec', 'astro', 'preview', '--port', String(PREVIEW_PORT), '--host', PREVIEW_HOST],
      { stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
    );

    await waitForServer(BASE_URL + '/', 30_000);
    browser = await chromium.launch({ headless: true });
  }, 60_000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) {
      server.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 200));
      if (!server.killed) server.kill('SIGKILL');
    }
  });

  it.each(PAGE_URLS.map((u) => [u.path, u.label]))(
    '%s (%s) has no NEW axe violations beyond the baseline',
    async (path, label) => {
      if (!browser) throw new Error('browser not initialised');
      // axe-core/playwright needs a fresh BrowserContext per page.
      const context = await browser.newContext();
      const page: Page = await context.newPage();
      try {
        await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 15_000 });

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();

        const currentRuleIds = [...new Set(results.violations.map((v) => v.id))].sort();
        const { global: globalBase, violations } = readBaseline();
        const labelBase = violations[label] ?? [];
        const newViolations = currentRuleIds.filter(
          (id) => !globalBase.includes(id) && !labelBase.includes(id),
        );

        if (newViolations.length > 0) {
          const detail = newViolations
            .map((id) => {
              const v = results.violations.find((x) => x.id === id)!;
              const sample = v.nodes[0]?.html?.slice(0, 200) ?? '';
              return `  - ${id}: ${v.description}\n    Sample: ${sample}`;
            })
            .join('\n');
          console.error(
            `\nNew accessibility violations on ${label} (${path}):\n${detail}\n` +
              `\nAll current rule IDs for this page: ${JSON.stringify(currentRuleIds)}\n` +
              `If these are expected, add the new IDs to baseline.json under "violations.${label}" (or "global" if they appear on every page).`,
          );
        }

        expect(newViolations, `New a11y violations on ${label} (${path})`).toEqual([]);
      } finally {
        await page.close();
        await context.close();
      }
    },
    30_000,
  );
});
