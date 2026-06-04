import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');

function findChapterPaths(): string[] {
  const chaptersDir = join(DIST_DIR, 'chapters');
  if (!existsSync(chaptersDir)) return [];
  const paths: string[] = [];
  for (const version of readdirSync(chaptersDir)) {
    if (!/^v\d+$/.test(version)) continue;
    const versionDir = join(chaptersDir, version);
    if (!statSync(versionDir).isDirectory()) continue;
    for (const chapter of readdirSync(versionDir)) {
      const chapterDir = join(versionDir, chapter);
      if (!statSync(chapterDir).isDirectory()) continue;
      // Chapter index page
      if (existsSync(join(chapterDir, 'index.html'))) {
        paths.push(`/chapters/${version}/${chapter}`);
      }
      for (const section of readdirSync(chapterDir)) {
        const sectionPath = join(chapterDir, section);
        if (!statSync(sectionPath).isDirectory()) continue;
        if (existsSync(join(sectionPath, 'index.html'))) {
          paths.push(`/chapters/${version}/${chapter}/${section}`);
        }
      }
    }
  }
  return paths.sort();
}

// Chapter and section slugs are public URLs. Search engines index them,
// readers bookmark them, partner-school syllabi link to them, and the
// browser-side reader navigates via them. If a slug changes silently —
// for example because someone edited a Google Doc heading and didn't
// realize the URL would change — every inbound link from the outside
// world breaks with a 404. We don't get notified about that until
// readers complain.
//
// This test snapshots the sorted list of all built /chapters/v*/...
// pages. On any PR that changes URLs (intentionally OR accidentally),
// the snapshot diff makes the change visible at review time. Intentional
// URL changes regenerate the snapshot and the PR mentions the redirects
// shipped alongside; accidental changes get reverted.
describe('URL stability — built chapter and section paths', () => {
  it('the full set of /chapters/v*/<chapter>/[<section>] paths matches the snapshot', () => {
    if (!existsSync(DIST_DIR)) {
      throw new Error(
        `dist/ not found at ${DIST_DIR}. Run \`pnpm build\` before \`pnpm test:smoke\`.`,
      );
    }
    const paths = findChapterPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toMatchSnapshot();
  });
});
