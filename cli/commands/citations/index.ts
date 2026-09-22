/**
 * `atlas citations` — dispatch for the citation commands.
 *
 * `task:0021` D6 fixes the plural noun. Verbs are deliberately separate rather
 * than modes of one command: `urls` and `extract` are pure and offline, while
 * `resolve` (task:0027) is networked and slow. Behind one verb, the fast safe
 * command would inherit the slow one's caveats.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadChaptersFromCache } from './load.js';
import { formatUrlFiles } from './urls.js';
import { readStore } from './extract-cmd.js';

export async function citationsUrls(root: string, outDir?: string): Promise<number> {
  const chapters = await loadChaptersFromCache();
  // Titles come from the store, so this output improves as `resolve` fills it
  // in. A missing store is not an error: the files still build, showing URLs.
  let store = {};
  try {
    store = readStore(root);
  } catch {
    console.warn('[atlas] no citation store yet — run `atlas citations extract`; showing URLs only');
  }

  const report = formatUrlFiles(chapters, store);
  const dest = outDir ?? join(root, 'data', 'citations', 'chapters');
  mkdirSync(dest, { recursive: true });
  for (const f of report.files) writeFileSync(join(dest, f.filename), f.markdown, 'utf8');

  console.log(
    `${report.totalCitations} citations · ${report.uniqueSources} unique sources · ` +
      `${report.resolvedTitles} with a resolved title · ` +
      `${report.unrecognised} links not recognised as citations`,
  );
  console.log(`wrote ${report.files.length} files to ${dest}`);
  return 0;
}
