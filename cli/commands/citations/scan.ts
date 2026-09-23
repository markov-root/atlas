/**
 * `atlas citations scan` - the TypeScript half of the citation pipeline, and
 * the only thing that crosses into Python.
 *
 * `task:0029` D1 puts the language boundary here. Extraction stays in
 * TypeScript because it walks the AST that 1,123 lines of loader code produce,
 * and that AST is not callable from outside this process. Everything after it -
 * resolvers, the CSL store, BibTeX, the reports - is ordinary scraping and
 * bibliography work with no tie to this language, and lives in `python/`.
 *
 * This command writes `data/citations/citations.json`: every citation instance
 * with its location, and nothing else. It is a handoff file, deliberately
 * inspectable, so a contributor can read exactly what passes between the two
 * halves instead of inferring it.
 *
 * One field here is not in `CitationInstance` and is the reason this file exists
 * rather than a straight JSON dump: `authorYear`. `author-year.ts` holds the
 * single definition of what a citation anchor looks like, shared with the audio
 * renderer so the two cannot drift (`task:0025` AC-6). The Python side needs the
 * parsed author and year for its report, and reimplementing the pattern there
 * would fork that definition - the precise failure AC-6 exists to prevent. So
 * the parse is performed once, here, and its result travels in the file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Chapter } from '../../../src/textbook-loader/index.js';
import { splitAuthorYear } from '../../../src/textbook-loader/citations/author-year.js';
import {
  extractSectionCitations,
  type CitationInstance,
} from '../../../src/textbook-loader/citations/extract.js';
import { loadChaptersFromCache } from './load.js';

/** Where the handoff file lives, relative to the repo root. */
export const SCAN_PATH = join('data', 'citations', 'citations.json');

/** A citation instance plus the author-year parse, which only TypeScript can make. */
export type ScannedCitation = CitationInstance & {
  /** Parsed anchor text, or null when it does not split into author and year. */
  authorYear: { author: string; year: string } | null;
};

export type ScannedSection = {
  number: number;
  title: string;
  slug: string;
  citations: ScannedCitation[];
};

export type ScannedChapter = {
  number: number;
  title: string;
  slug: string;
  sections: ScannedSection[];
};

export type ScanFile = {
  /** Bumped when the shape changes, so the Python side can refuse an old file. */
  schemaVersion: 1;
  chapters: ScannedChapter[];
};

/** Build the handoff structure. Pure: chapters in, plain data out. */
export function buildScan(chapters: Chapter[]): ScanFile {
  return {
    schemaVersion: 1,
    chapters: chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      slug: chapter.slug || `chapter-${chapter.number}`,
      sections: chapter.sections.map((section) => ({
        number: section.number,
        title: section.title,
        slug: section.slug ?? '',
        citations: extractSectionCitations(section).map((c) => ({
          ...c,
          authorYear: splitAuthorYear(c.anchorText),
        })),
      })),
    })),
  };
}

/** Run the command: load the cached chapters, write the handoff file. */
export async function citationsScan(root: string, outPath?: string): Promise<number> {
  const chapters = await loadChaptersFromCache();
  const scan = buildScan(chapters);

  const dest = outPath ?? join(root, SCAN_PATH);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(scan, null, 2) + '\n', 'utf8');

  const total = scan.chapters.reduce(
    (n, c) => n + c.sections.reduce((m, s) => m + s.citations.length, 0),
    0,
  );
  console.log(`${total} citation instances across ${scan.chapters.length} chapters → ${dest}`);
  return 0;
}
