/**
 * `atlas docs check` — verify the governed living documents against
 * docs/standards/documentation.md.
 *
 * Runs with no software-engineering skill installed, so a fresh clone can check
 * conformance. See cli/doc-rules.ts for what is checked and why this exists
 * separately from `engineering document validate`.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { DOC_RULES, type DocRule, type SectionRule, type PatternRule } from '../doc-rules.js';

export type Check = { ok: boolean; label: string; detail: string; must?: string };
export type DocResult = { path: string; role: string; checks: Check[]; ok: boolean };

/** Fenced code blocks are stripped before counting: a big snippet should not
 *  satisfy a word floor that exists to catch thin prose. */
function countWords(body: string): number {
  const prose = body.replace(/```[\s\S]*?```/g, ' ');
  return (prose.match(/\S+/g) ?? []).length;
}

type Heading = { level: number; text: string; start: number };

function headings(lines: string[]): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) return;
    const m = /^(#{2,6})\s+(.*)$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), start: i });
  });
  return out;
}

/**
 * Body of the first heading matching any of `needles`, or null if absent.
 *
 * Alternatives are accepted because a role defines a *requirement*, not a
 * heading. `PRINCIPLES.md` satisfies the standard role's issuer/scope/exception
 * requirement under "How this standard works"; `DESIGN.md` does it under
 * "Scope". Forcing one wording would make documents worse to read in order to
 * please a checker — which is the failure this command exists to prevent.
 */
export function sectionBody(text: string, needle: string | string[]): string | null {
  const needles = (Array.isArray(needle) ? needle : [needle]).map((n) => n.toLowerCase());
  const lines = text.split('\n');
  const hs = headings(lines);
  const idx = hs.findIndex((h) => needles.some((n) => h.text.toLowerCase().includes(n)));
  if (idx === -1) return null;
  const here = hs[idx];
  const next = hs.slice(idx + 1).find((h) => h.level <= here.level);
  return lines.slice(here.start + 1, next ? next.start : lines.length).join('\n');
}

/** The top-level keys of a `---` frontmatter block. Deliberately not a YAML
 *  parser: we only need to know which role key is declared. */
export function frontmatterKeys(text: string): string[] {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => /^([A-Za-z_][\w-]*):/.exec(l)?.[1])
    .filter((k): k is string => Boolean(k));
}

function checkSection(text: string, rule: SectionRule): Check {
  const label = Array.isArray(rule.heading) ? rule.heading[0] : rule.heading;
  const body = sectionBody(text, rule.heading);
  if (body === null) {
    return { ok: false, label, detail: 'section missing', must: rule.must };
  }
  const words = countWords(body);
  if (rule.minWords && words < rule.minWords) {
    return {
      ok: false,
      label,
      detail: `${words} words, needs ${rule.minWords}`,
      must: rule.must,
    };
  }
  return { ok: true, label, detail: `${words} words` };
}

function checkPattern(text: string, rule: PatternRule): Check {
  const n = (text.match(rule.pattern) ?? []).length;
  return n >= rule.minCount
    ? { ok: true, label: rule.label, detail: `${n} found` }
    : {
        ok: false,
        label: rule.label,
        detail: `${n} found, needs ${rule.minCount}`,
        must: rule.must,
      };
}

/** Pure: everything decidable about one document, given its text. */
export function checkDocument(text: string, rule: DocRule): DocResult {
  const checks: Check[] = [];
  const keys = frontmatterKeys(text);
  checks.push(
    keys.includes(rule.role)
      ? { ok: true, label: `role: ${rule.role}`, detail: 'declared in frontmatter' }
      : {
          ok: false,
          label: `role: ${rule.role}`,
          detail: keys.length ? `frontmatter declares ${keys.join(', ')}` : 'no frontmatter',
          must: `declare a top-level \`${rule.role}:\` block so the document states its own role`,
        },
  );
  for (const s of rule.sections) checks.push(checkSection(text, s));
  for (const p of rule.patterns ?? []) checks.push(checkPattern(text, p));
  return { path: rule.path, role: rule.role, checks, ok: checks.every((c) => c.ok) };
}

/** Expand a rule path that may end in `*.md` into concrete repo-relative paths. */
function resolvePaths(root: string, rulePath: string): string[] {
  if (!rulePath.includes('*')) return [rulePath];
  const dir = dirname(rulePath);
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith('.md') && f !== 'INDEX.md')
    .map((f) => join(dir, f));
}

export function runDocsCheck(root: string): { results: DocResult[]; ok: boolean } {
  const results: DocResult[] = [];
  for (const rule of DOC_RULES) {
    const paths = resolvePaths(root, rule.path);
    if (paths.length === 0) {
      results.push({
        path: rule.path,
        role: rule.role,
        ok: false,
        checks: [
          {
            ok: false,
            label: 'file',
            detail: 'not found',
            must: `this document is required by docs/standards/documentation.md`,
          },
        ],
      });
      continue;
    }
    for (const p of paths) {
      const abs = join(root, p);
      if (!existsSync(abs)) {
        results.push({
          path: p,
          role: rule.role,
          ok: false,
          checks: [{ ok: false, label: 'file', detail: 'not found' }],
        });
        continue;
      }
      results.push({ ...checkDocument(readFileSync(abs, 'utf8'), rule), path: p });
    }
  }
  return { results, ok: results.every((r) => r.ok) };
}

export function formatResults(results: DocResult[]): string {
  const out: string[] = [];
  for (const r of results) {
    out.push(`${r.ok ? '✓' : '✗'} ${r.path}  [${r.role}]`);
    for (const c of r.checks) {
      out.push(`    ${c.ok ? '✓' : '✗'} ${c.label.padEnd(34)} ${c.detail}`);
      if (!c.ok && c.must) out.push(`        must ${c.must}`);
    }
  }
  const bad = results.filter((r) => !r.ok).length;
  out.push('');
  out.push(
    bad === 0
      ? `All ${results.length} governed documents conform.`
      : `${bad} of ${results.length} documents do not conform.`,
  );
  out.push(
    'Structure only. Whether each section passes its discriminating test is a human review bar —',
  );
  out.push('see docs/standards/documentation.md.');
  return out.join('\n');
}

export function docsCheck(root: string): number {
  const { results, ok } = runDocsCheck(root);
  console.log(formatResults(results));
  return ok ? 0 : 1;
}
