/**
 * Build-time access to the citation store, for rendering references on the site.
 *
 * Phase 2 of `task:0021`. Phase 1 produced `data/citations/sources.yaml` - 948
 * sources keyed by canonical URL, in CSL - and everything here is a read of that
 * file plus the citation instances `extract.ts` finds in a section's AST.
 *
 * Three properties this module is built around:
 *
 * 1. **It never blocks a build.** `task:0021` D4 is warn-never-block. A missing
 *    store, an unparseable one, or a citation with no matching entry all degrade
 *    to "render less", never to a thrown error. A bibliography is an
 *    enhancement; a chapter that will not build is a regression.
 *
 * 2. **It needs no credentials.** The store is committed precisely so a
 *    contributor build renders the same references a maintainer build does. This
 *    reads one committed file and the already-parsed AST - no network, no
 *    Google Docs, no `BuildMode` gate.
 *
 * 3. **Unresolved entries are shown, not hidden.** 131 of 948 sources have only
 *    their anchor text. Dropping them would silently shrink the bibliography and
 *    make the gap invisible; they render with whatever is known and their URL,
 *    which is the same honesty `atlas citations urls` settled on.
 *
 * The store is read once per build and cached at module scope. It is 1.4 MB, and
 * a section page would otherwise re-parse it for every one of 383 pages.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Chapter, Section } from '../textbook-loader/index';
import { extractSectionCitations } from '../textbook-loader/citations/extract';

/** Where the committed store lives, relative to the repo root. */
const STORE_PATH = join('data', 'citations', 'sources.yaml');

/** A CSL name: structured, or `literal` where a split would be a guess. */
type CslName = { family?: string; given?: string; literal?: string };

type CslItem = {
  id: string;
  type?: string;
  title?: string;
  author?: CslName[];
  issued?: { 'date-parts'?: number[][] };
  URL?: string;
  DOI?: string;
  'container-title'?: string;
  note?: string;
  [key: string]: unknown;
};

type StoreEntry = { item: CslItem; resolvedBy: string; anchors: string[] };
type Store = Record<string, StoreEntry>;

/**
 * One reference, ready to render. Deliberately pre-formatted strings rather than
 * a CSL item: the component's job is layout, not bibliographic style.
 */
export type Reference = {
  /** Canonical URL - stable, unique, and usable as a DOM id suffix. */
  key: string;
  /** "Hoffmann, J., Borgeaud, S. & Mensch, A.", or empty when unknown. */
  authors: string;
  /** Four-digit year, or empty. */
  year: string;
  /** The work's title. Falls back to the anchor text for unresolved entries. */
  title: string;
  /** Journal, site or channel name. Empty when unknown. */
  container: string;
  /** Where to link. Always present - it is the entry's identity. */
  url: string;
  doi: string;
  /** False when only the anchor text is known, so the UI can say so. */
  resolved: boolean;
  /** Anchor spellings seen in the prose, for the title attribute. */
  anchors: string[];
  /**
   * Pre-rendered text per style id, from `atlas citations render` (`task:0030`).
   *
   * Empty when `rendered.json` is absent or stale - the component then falls
   * back to the structured fields above, which is what `task:0030` AC-4
   * requires: a contributor who has not run the command still gets a site.
   */
  styled: Record<string, string>;
  /** Publication or site, for the source facet. Never empty - see `sourceOf`. */
  source: string;
  /** "Paper", "Blog post", "Video" - the type facet, in a reader's words. */
  kind: string;
  /** Chapters and sections citing this source, for the grouped view. */
  cited: CitedIn[];
};

/** Where a source is cited, for grouping the site-wide list. */
export type CitedIn = {
  chapterSlug: string;
  chapterNumber: number;
  chapterTitle: string;
  sectionNumber: string;
  sectionTitle: string;
};

/**
 * CSL item types as a reader would name them.
 *
 * The facet has to be readable, and "post-weblog" and "motion_picture" are
 * schema words. Anything unmapped falls back to "Other" rather than showing the
 * raw type: a filter option nobody understands is worse than one bucket.
 */
const KIND_LABELS: Record<string, string> = {
  article: 'Paper',
  'article-journal': 'Journal article',
  'paper-conference': 'Conference paper',
  'post-weblog': 'Blog post',
  webpage: 'Web page',
  report: 'Report',
  motion_picture: 'Video',
  book: 'Book',
  chapter: 'Book chapter',
};

/**
 * The source to file an entry under.
 *
 * `container-title` where the source states one - `task:0032` D5 - and the
 * registrable domain otherwise. A domain is a *true* statement about where a
 * work lives, needs no mapping table anyone has to maintain, and reads perfectly
 * well in a filter list. The alternative, a hand-written domain-to-publisher
 * table for several hundred long-tail sites, is guesswork dressed as data and
 * would rot the first time a site renamed itself.
 */
export function sourceOf(container: string, url: string): string {
  if (container) return container;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

/** A style the reader can switch to, as declared by the render command. */
export type StyleOption = { id: string; label: string; numeric: boolean };

type RenderedFile = {
  schemaVersion: number;
  defaultStyle: string;
  styles: StyleOption[];
  entries: Record<string, Record<string, string>>;
};

/** Where `atlas citations render` writes its output, relative to the repo root. */
const RENDERED_PATH = join('data', 'citations', 'rendered.json');

/** The shape this reader understands. Python bumps it on a change. */
const RENDERED_SCHEMA = 1;

let renderedCache: RenderedFile | null | undefined;

/**
 * The pre-rendered references, or null when unavailable.
 *
 * Warns once and returns null for a missing, unparseable or wrong-version file.
 * `task:0021` D4 is warn-never-block, and a bibliography that renders in one
 * plain style beats a build that fails.
 */
export function loadRendered(root: string = process.cwd()): RenderedFile | null {
  if (renderedCache !== undefined) return renderedCache;
  try {
    const parsed = JSON.parse(readFileSync(join(root, RENDERED_PATH), 'utf8')) as RenderedFile;
    if (parsed?.schemaVersion !== RENDERED_SCHEMA) {
      console.warn(
        `[atlas] ${RENDERED_PATH} is schema ${parsed?.schemaVersion}, expected ${RENDERED_SCHEMA} - ` +
          'falling back to plain formatting. Run `./bin/atlas citations render`.',
      );
      renderedCache = null;
    } else {
      renderedCache = parsed;
    }
  } catch {
    console.warn(
      `[atlas] no ${RENDERED_PATH} - references will render in one plain style. ` +
        'Run `./bin/atlas citations render` for the full set.',
    );
    renderedCache = null;
  }
  return renderedCache;
}

/**
 * The house style: author, year, and the work's title as the link.
 *
 * Always offered and always the default. It is the plainest of the options and
 * the one that reads best on a web page - the title is the link text, so a
 * reader scanning the list clicks the thing they recognise. The CSL styles are
 * for copying a reference *out* of the Atlas into something with a house style
 * of its own; they are not an improvement on this for reading.
 *
 * It also needs no pre-rendered file, which is what makes `task:0030` AC-4 true
 * for free: a contributor who has not run `atlas citations render` still gets
 * this, and only loses the alternatives.
 */
export const BASIC_STYLE: StyleOption = { id: 'basic', label: 'Basic', numeric: false };

/** Every style on offer, house style first. */
export function availableStyles(root?: string): StyleOption[] {
  return [BASIC_STYLE, ...(loadRendered(root)?.styles ?? [])];
}

/** The style shown before the reader picks one. */
export function defaultStyle(): string {
  return BASIC_STYLE.id;
}

let cached: Store | null = null;

/**
 * The parsed store, or an empty one.
 *
 * A missing or unparseable store warns once and yields nothing, per D4. The
 * warning names the command that fixes it, because a warning that does not tell
 * you what to do is noise.
 */
export function loadStore(root: string = process.cwd()): Store {
  if (cached) return cached;
  try {
    const parsed = parse(readFileSync(join(root, STORE_PATH), 'utf8'));
    cached = parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    console.warn(
      `[atlas] no citation store at ${STORE_PATH} - references will not render. ` +
        'Run `./bin/atlas citations extract` to build it.',
    );
    cached = {};
  }
  return cached;
}

/** Test seam: reset the module-scope cache. */
export function resetStoreCache(): void {
  cached = null;
  renderedCache = undefined;
}

/**
 * The longest a real personal name part can plausibly be.
 *
 * Anything past this is a parse failure wearing a name's clothes. The store held
 * three entries whose `given` field was tens of thousands of characters of raw
 * Atom XML, because the TypeScript arXiv resolver's regex had swallowed the
 * whole author block (`audit:0011` F11) - and the page rendered it as several
 * hundred initials.
 */
const MAX_NAME_PART = 80;

/**
 * True for a value that cannot be a name.
 *
 * The resolvers are where clean data is supposed to come from, and they are
 * fixed. This is the second line: `sources.yaml` is committed and hand-editable,
 * so a bad value can arrive without any resolver being involved, and no data
 * defect should be able to disfigure a page.
 */
function implausibleName(value: string): boolean {
  return value.length > MAX_NAME_PART || value.includes('<');
}

/** "Jordan Hoffmann" → "Hoffmann, J."; a literal name is left exactly as written. */
export function formatName(name: CslName): string {
  if (name.literal) return implausibleName(name.literal) ? '' : name.literal;
  // A corrupt `given` must not take the family name down with it: "Pokorny" is
  // still useful, and dropping the whole entry would hide the source entirely.
  const family = name.family && !implausibleName(name.family) ? name.family : '';
  const given = name.given && !implausibleName(name.given) ? name.given : '';
  if (!family) return given;
  if (!given) return family;
  // Initials rather than full given names: a reference list is scanned, not
  // read, and the family name is what a reader matches against the citation.
  const initials = given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(' ');
  return `${family}, ${initials}`;
}

/**
 * Author list in reading order, truncated past six.
 *
 * Six is where a reference list stops being scannable - an arXiv paper with 40
 * authors would otherwise push every other entry off the screen. The convention
 * is the one most styles use: the first author, then "et al."
 */
export function formatAuthors(authors: CslName[] | undefined): string {
  if (!authors?.length) return '';
  const names = authors.map(formatName).filter(Boolean);
  if (!names.length) return '';
  if (names.length > 6) return `${names[0]} et al.`;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** The publication year, as a string, or empty. */
export function formatYear(item: CslItem): string {
  const year = item.issued?.['date-parts']?.[0]?.[0];
  return year ? String(year) : '';
}

/**
 * A URL as readable link text: no scheme, no trailing slash, shortened in the
 * middle when long.
 *
 * Used as the link text for entries that have no real title. The middle is what
 * gets dropped because both ends carry the information - the host says who
 * published it and the last path segment usually says what it is.
 */
export function displayUrl(url: string, max = 70): string {
  const bare = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (bare.length <= max) return bare;
  const tail = bare.slice(-Math.floor(max / 2));
  return `${bare.slice(0, max - tail.length - 1)}…${tail}`;
}

/**
 * Strip inline markup and collapse whitespace.
 *
 * Crossref embeds presentational tags in titles - its record for "Human-level
 * play in the game of `<i>`Diplomacy`</i>`" carries them verbatim - and CSL
 * fields are plain text, so a template escapes them and shows them to the
 * reader. The resolver now cleans this at the source; this is the same guard at
 * the render layer, for entries already in the committed store and for the hand
 * edits the store invites. `audit:0011` F11.
 */
function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trailing sentence punctuation, so the template's own period does not double up. */
function trimTerminal(text: string): string {
  return stripMarkup(text).replace(/\s*\.\s*$/, '');
}

/**
 * Drop a container name the title already ends with.
 *
 * Open Graph titles routinely carry the site name - "Reducing Risks of
 * Astronomical Suffering - Center on Long-Term Risk" - and `og:site_name` then
 * supplies it again, so the rendered reference said it twice. The title is the
 * one we keep, because it is what the reader will recognise and because trimming
 * the title instead would mean guessing which separator the site chose.
 */
function dropRedundantContainer(title: string, container: string): string {
  if (!container) return '';
  const t = title.toLowerCase().trim();
  const c = container.toLowerCase().trim();
  if (t === c) return '';
  // Match only at the end, after a separator, so a container that happens to be
  // a word inside the title survives.
  return /[—–|·:-]\s*$/.test(t.slice(0, t.length - c.length)) && t.endsWith(c) ? '' : container;
}

/** A store entry as a renderable reference. */
export function toReference(
  key: string,
  entry: StoreEntry,
  styled: Record<string, string> = {},
): Reference {
  const resolved = entry.resolvedBy !== 'anchor';
  const item = entry.item ?? { id: key };
  const url = item.URL ?? key;

  // An unresolved entry's title IS its anchor text - "Cotra, 2023" - and the
  // author and year are already rendered from that same anchor. Using it as the
  // link text produced "Cotra (2023). Cotra 2023.", which says one thing twice
  // and tells a reader nothing they cannot see in the prose. The URL is the only
  // new information such an entry carries, so it becomes the link text.
  const title = resolved && item.title ? trimTerminal(item.title) : displayUrl(url);

  const container = dropRedundantContainer(title, trimTerminal(item['container-title'] ?? ''));

  return {
    key,
    authors: formatAuthors(item.author),
    year: formatYear(item),
    title,
    container,
    url,
    doi: item.DOI ?? '',
    resolved,
    anchors: entry.anchors ?? [],
    styled,
    // The *stated* container, not the display one: `dropRedundantContainer`
    // blanks a container the title already ends with, which is right for reading
    // and wrong for filtering - "LessWrong" must stay a facet even when the
    // title already says it.
    source: sourceOf(trimTerminal(item['container-title'] ?? ''), url),
    kind: KIND_LABELS[item.type ?? ''] ?? 'Other',
    cited: [],
  };
}

/**
 * Sort key: author, then year, then title - the standard reference ordering.
 *
 * Entries with no author sort by title, which puts them among the others rather
 * than in a block at one end. A reader looking up "Anthropic, 2024" should find
 * it under A whether or not a resolver gave it a structured author.
 */
function sortKey(ref: Reference): string {
  return `${(ref.authors || ref.title).toLowerCase()} ${ref.year} ${ref.title.toLowerCase()}`;
}

function dedupeAndSort(refs: Reference[]): Reference[] {
  const byKey = new Map<string, Reference>();
  for (const ref of refs) if (!byKey.has(ref.key)) byKey.set(ref.key, ref);
  return [...byKey.values()].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

/**
 * Canonical URLs cited in a section, in prose order.
 *
 * Only `citation`-kind instances: a prose link ("available here") is not a
 * reference, and an asset is not a document. This is the same filter
 * `atlas citations extract` applies, and for the same reason.
 */
function citedKeys(section: Section): string[] {
  try {
    return extractSectionCitations(section)
      .filter((c) => c.kind === 'citation' && c.key)
      .map((c) => c.key as string);
  } catch {
    // Extraction walks the AST, and a malformed node must cost this section its
    // reference list, not the whole build (D4).
    return [];
  }
}

function referencesForKeys(keys: string[], store: Store, root?: string): Reference[] {
  const styled = loadRendered(root)?.entries ?? {};
  const refs: Reference[] = [];
  for (const key of keys) {
    const entry = store[key];
    // A cited URL with no store entry means the store is older than the prose.
    // Render it from what the citation itself carries rather than dropping it -
    // a silently shorter bibliography is the failure D4 exists to prevent.
    refs.push(
      entry
        ? toReference(key, entry, styled[key] ?? {})
        : toReference(
            key,
            { item: { id: key, title: key }, resolvedBy: 'anchor', anchors: [] },
            styled[key] ?? {},
          ),
    );
  }
  return dedupeAndSort(refs);
}

/** References cited in one section, deduplicated and alphabetised. */
export function sectionReferences(section: Section, root?: string): Reference[] {
  return referencesForKeys(citedKeys(section), loadStore(root), root);
}

/**
 * References cited anywhere in one chapter, each tagged with its sections.
 *
 * The locations are what let the chapter page group by section - the one
 * grouping that means anything at that scale, since every entry is from this
 * chapter by construction.
 */
export function chapterReferences(chapter: Chapter, root?: string): Reference[] {
  const keys = chapter.sections.flatMap(citedKeys);
  const refs = referencesForKeys(keys, loadStore(root), root);
  return withLocations(refs, [chapter]);
}

/** Attach the chapters and sections citing each reference. */
function withLocations(refs: Reference[], chapters: Chapter[]): Reference[] {
  const locations = new Map<string, CitedIn[]>();
  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      const at: CitedIn = {
        chapterSlug: chapter.slug,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sectionNumber: `${chapter.number}.${section.number}`,
        sectionTitle: section.title,
      };
      // Deduplicated per section: a source cited five times in one section is
      // one location, not five.
      for (const key of new Set(citedKeys(section))) {
        locations.set(key, [...(locations.get(key) ?? []), at]);
      }
    }
  }
  return refs.map((ref) => ({ ...ref, cited: locations.get(ref.key) ?? [] }));
}

/** Every source in the store, for the site-wide `/bibliography` page. */
export function allReferences(root?: string): Reference[] {
  const store = loadStore(root);
  const styled = loadRendered(root)?.entries ?? {};
  return dedupeAndSort(
    Object.keys(store).map((key) => toReference(key, store[key], styled[key] ?? {})),
  );
}

/**
 * Every source, each tagged with the chapters and sections citing it.
 *
 * `task:0030` AC-7's grouped view. A reader met these citations inside a
 * chapter, so being able to see them back in that shape - rather than as one
 * alphabetical run of 945 - is the difference between a list and a bibliography
 * they can navigate.
 *
 * A source cited in three chapters carries three locations, and the grouped view
 * shows it under all three. That is correct: it genuinely is a source for each,
 * and hiding it from two of them to avoid repetition would answer "what does
 * chapter 4 rest on" wrongly.
 *
 * Costs one AST walk per section, which the chapter and section pages already
 * pay individually; this is the same work done once for the site-wide page.
 */
export function allReferencesWithLocations(chapters: Chapter[], root?: string): Reference[] {
  return withLocations(allReferences(root), chapters);
}

/** How much of the store carries real metadata - shown on `/bibliography`. */
export function storeCoverage(root?: string): { total: number; resolved: number } {
  const store = loadStore(root);
  const keys = Object.keys(store);
  return {
    total: keys.length,
    resolved: keys.filter((k) => store[k].resolvedBy !== 'anchor').length,
  };
}
