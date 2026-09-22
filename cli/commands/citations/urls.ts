/**
 * `atlas citations urls` — cited sources as copy-pasteable Markdown, one file
 * per chapter.
 *
 * The crude slice of `task:0026`, shipped ahead of any rendering because the
 * edition-2 authors can paste it into a Google Doc and work from it today.
 *
 * Three properties came from the authors actually trying to use it, and each
 * one is the difference between a list and a usable list:
 *
 *   - **One file per chapter.** A single 3,000-line document is not something
 *     anyone pastes into a Doc and reviews.
 *   - **Deduplicated within a section.** A source cited three times in one
 *     section is one entry there. The repetition is real in the prose and
 *     meaningless in a reference list.
 *   - **Titles, not URLs, as the link text.** "Sutton, 2019" next to a bare URL
 *     tells a reader nothing they did not already know; the resolved title is
 *     the thing that identifies the work.
 *
 * Titles come from the CSL store, so this file gets better as
 * `atlas citations resolve` fills it in. Entries not yet resolved fall back to
 * the raw URL rather than being hidden, so what is missing stays visible.
 */
import type { Chapter } from '../../../src/textbook-loader/index.js';
import {
  extractSectionCitations,
  type CitationInstance,
} from '../../../src/textbook-loader/citations/extract.js';
import type { Store } from '../../../src/textbook-loader/citations/store.js';

export type ChapterFile = { filename: string; markdown: string; citations: number; unique: number };

export type UrlReport = {
  files: ChapterFile[];
  totalCitations: number;
  uniqueSources: number;
  unrecognised: number;
  resolvedTitles: number;
};

/** Zero-padded chapter number, so files sort correctly in a directory listing. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * The display form of one citation.
 *
 * `Author, Year ([Title](url))` — the title is the link text, matching what a
 * reader needs to recognise the work. Where the store has no title yet, the
 * URL is shown bare so the gap is obvious rather than papered over.
 */
function bullet(c: CitationInstance, store: Store): string {
  const label = c.anchorText.trim() || '(no link text)';
  const where = c.origin === 'footnote' ? ` [fn ${c.footnoteNumber}]` : '';
  if (!c.key) return `- ${label}${where} (no URL)`;

  const entry = store[c.key];
  const title = entry?.resolvedBy !== 'anchor' ? entry?.item?.title : undefined;
  return title
    ? `- ${label}${where} ([${escapeMd(String(title))}](${c.key}))`
    : `- ${label}${where} (${c.key})`;
}

/** Markdown link text cannot contain unescaped brackets. */
function escapeMd(s: string): string {
  return s.replace(/([[\]])/g, '\\$1');
}

/**
 * Deduplicate within one section by canonical URL.
 *
 * The first occurrence wins, so the order follows the prose. Citations with no
 * URL (an unlinked footnote citation) are keyed by their text instead, since
 * they have nothing else to be distinguished by.
 */
function dedupe(citations: CitationInstance[]): CitationInstance[] {
  const seen = new Set<string>();
  const out: CitationInstance[] = [];
  for (const c of citations) {
    const key = c.key ?? `text:${c.anchorText.trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** One chapter's file. Pure: chapter and store in, markdown out. */
export function formatChapterMarkdown(
  chapter: Chapter,
  store: Store,
): { markdown: string; citations: CitationInstance[]; unrecognised: CitationInstance[] } {
  const lines: string[] = [];
  const kept: CitationInstance[] = [];
  const unrecognised: CitationInstance[] = [];

  lines.push(`# Chapter ${chapter.number} — ${chapter.title}: cited sources`);
  lines.push('');

  const body: string[] = [];
  for (const section of chapter.sections) {
    const found = extractSectionCitations(section);
    unrecognised.push(...found.filter((c) => c.kind === 'content-link'));
    const cites = dedupe(found.filter((c) => c.kind === 'citation' || c.kind === 'unlinked'));
    kept.push(...cites);

    body.push(`## ${chapter.number}.${section.number} ${section.title}`);
    body.push('');
    if (cites.length === 0) {
      body.push('_No citations in this section._');
    } else {
      for (const c of cites) body.push(bullet(c, store));
    }
    body.push('');
  }

  const uniqueInChapter = new Set(kept.map((c) => c.key).filter(Boolean)).size;
  const withTitles = kept.filter(
    (c) => c.key && store[c.key] && store[c.key].resolvedBy !== 'anchor',
  ).length;

  lines.push(
    `_${kept.length} citations · ${uniqueInChapter} unique sources · ${withTitles} with a resolved title._`,
  );
  lines.push('');
  lines.push(
    'Read straight out of the Google Doc, so it cannot drift from the prose. Duplicates within a',
  );
  lines.push(
    'section are collapsed. An entry showing a bare URL has not had its title looked up yet.',
  );
  lines.push('');
  lines.push(...body);

  if (unrecognised.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`## Links not recognised as citations (${unrecognised.length})`);
    lines.push('');
    lines.push('Hyperlinks whose text is prose rather than an author and year. Anything here that');
    lines.push(
      'should be a citation needs its link text changed in the Doc to "Author, Year" form.',
    );
    lines.push('');
    for (const c of dedupe(unrecognised)) {
      lines.push(
        `- ${chapter.number}.${c.sectionNumber} — "${c.anchorText.trim()}" (${c.key ?? c.rawUrl})`,
      );
    }
    lines.push('');
  }

  return { markdown: lines.join('\n'), citations: kept, unrecognised };
}

/**
 * All chapter files plus a whole-book index.
 *
 * The index answers "what does the Atlas cite", which the per-chapter files
 * cannot — and it is the question a bibliography exists for.
 */
export function formatUrlFiles(chapters: Chapter[], store: Store): UrlReport {
  const files: ChapterFile[] = [];
  const all: CitationInstance[] = [];
  let unrecognised = 0;

  for (const chapter of chapters) {
    const { markdown, citations, unrecognised: un } = formatChapterMarkdown(chapter, store);
    all.push(...citations);
    unrecognised += un.length;
    const slug = chapter.slug || `chapter-${chapter.number}`;
    files.push({
      filename: `chapter-${pad(chapter.number)}-${slug}.md`,
      markdown,
      citations: citations.length,
      unique: new Set(citations.map((c) => c.key).filter(Boolean)).size,
    });
  }

  const byKey = new Map<string, string[]>();
  for (const c of all) {
    if (!c.key) continue;
    const labels = byKey.get(c.key) ?? [];
    const label = c.anchorText.trim();
    if (label && !labels.includes(label)) labels.push(label);
    byKey.set(c.key, labels);
  }
  const keys = [...byKey.keys()].sort();

  const index: string[] = [];
  index.push('# AI Safety Atlas — all cited sources');
  index.push('');
  index.push(`_${keys.length} unique sources across ${chapters.length} chapters._`);
  index.push('');
  index.push(
    'One file per chapter sits beside this one. Where a source is cited under more than one',
  );
  index.push(
    'spelling, every spelling is shown — that is how inconsistent citation text gets found.',
  );
  index.push('');
  let resolvedTitles = 0;
  for (const key of keys) {
    const entry = store[key];
    const title = entry?.resolvedBy !== 'anchor' ? entry?.item?.title : undefined;
    if (title) resolvedTitles++;
    const spellings = byKey.get(key)!.join(' / ') || '(no link text)';
    index.push(
      title ? `- ${spellings} ([${escapeMd(String(title))}](${key}))` : `- ${spellings} (${key})`,
    );
  }
  index.push('');
  files.push({
    filename: 'all-sources.md',
    markdown: index.join('\n'),
    citations: all.length,
    unique: keys.length,
  });

  return {
    files,
    totalCitations: all.length,
    uniqueSources: keys.length,
    unrecognised,
    resolvedTitles,
  };
}
