import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * End-to-end smoke test for the contributor build path.
 *
 * Runs `pnpm build` in the current working directory with the SKIP_*
 * env vars set (matches what a contributor without .env would get from
 * the BuildMode auto-detection) and asserts that dist/ contains real
 * chapter HTML with prose.
 *
 * Gated out of the default `pnpm test` run by vitest.config.ts because
 * it takes ~30s. Run via `pnpm test:smoke`.
 */
describe("contributor build smoke test", () => {
  it("pnpm build succeeds without .env and produces chapter HTML", () => {
    execFileSync("pnpm", ["build"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Defensive — content.config.ts already sets these for contributor
        // mode, but if BuildMode wiring regresses we don't want the test to
        // accidentally try to hit Google Docs / ElevenLabs / R2.
        SKIP_PDF: "1",
        SKIP_AUDIO: "1",
        SKIP_AUDIO_DOWNLOAD: "1",
        GOOGLE_CREDENTIALS_BASE64: "",
        ALGOLIA_WRITE_KEY: "",
      },
      stdio: "pipe",
      timeout: 120_000,
    });

    const dist = join(process.cwd(), "dist");
    expect(statSync(dist).isDirectory()).toBe(true);

    // Find a versioned chapter page (e.g. dist/chapters/v1/.../section/index.html).
    // The actual chapter slugs change with content, so we walk to find one.
    const candidates = walkChapterIndexPages(join(dist, "chapters"));
    expect(candidates.length).toBeGreaterThan(5);

    // At least one page should have substantial prose. Pick the largest
    // page to use as our spot-check sample (skips redirect stubs).
    const sized = candidates.map((p) => ({ path: p, words: countWords(readFileSync(p, "utf-8")) }));
    sized.sort((a, b) => b.words - a.words);
    expect(sized[0].words).toBeGreaterThan(1_000);

    // No chapter HTML should reference /assets/uc/ via a direct <img src>
    // — figures must degrade to caption-only when assets are missing.
    for (const { path } of sized) {
      const html = readFileSync(path, "utf-8");
      expect(html.includes('src="/assets/uc/')).toBe(false);
    }

    // The committed public Algolia keys should be present in the prose pages
    // (DocSearchProvider is part of the chapter layout). Use the largest
    // page so we know we're checking a real chapter, not a redirect stub.
    const sampleHtml = readFileSync(sized[0].path, "utf-8");
    expect(sampleHtml).toMatch(/W6WTQ7JBP1/);
    expect(sampleHtml).toMatch(/636da71890a5466401dc666df2be6fb3/);
  }, 180_000);
});

function walkChapterIndexPages(root: string): string[] {
  const results: string[] = [];
  const queue = [root];
  while (queue.length) {
    const dir = queue.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        queue.push(full);
      } else if (name === "index.html") {
        results.push(full);
      }
    }
  }
  return results;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
  return text.split(/\s+/).filter(Boolean).length;
}
