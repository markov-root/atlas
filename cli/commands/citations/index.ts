/**
 * `atlas citations` — dispatch for the citation commands.
 *
 * `task:0021` D6 fixes the plural noun. Verbs are deliberately separate rather
 * than modes of one command: `urls` and `extract` are pure and offline, while
 * `resolve` (task:0027) is networked and slow. Behind one verb, the fast safe
 * command would inherit the slow one's caveats.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadChaptersFromCache } from './load.js';
import { formatUrlMarkdown } from './urls.js';

export async function citationsUrls(root: string, outPath?: string): Promise<number> {
  const chapters = await loadChaptersFromCache();
  const report = formatUrlMarkdown(chapters);
  const dest = outPath ?? join(root, 'docs', 'cited-sources.md');
  writeFileSync(dest, report.markdown, 'utf8');
  console.log(
    `${report.totalCitations} citations · ${report.uniqueSources} unique sources · ` +
      `${report.unrecognised} links not recognised as citations`,
  );
  console.log(`wrote ${dest}`);
  return 0;
}
