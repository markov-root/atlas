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
  // Derived output, so it lives beside the other regenerated artifacts under
  // data/citations/ and is gitignored. Only sources.yaml is committed: it is
  // the source of truth and accumulates resolver metadata that costs real time
  // and other people's rate limits to rebuild. This file is ~6 seconds of work.
  const dest = outPath ?? join(root, 'data', 'citations', 'cited-sources.md');
  writeFileSync(dest, report.markdown, 'utf8');
  console.log(
    `${report.totalCitations} citations · ${report.uniqueSources} unique sources · ` +
      `${report.unrecognised} links not recognised as citations`,
  );
  console.log(`wrote ${dest}`);
  return 0;
}
