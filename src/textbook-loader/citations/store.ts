/**
 * The bibliography store: CSL entries, one per source, as editable YAML.
 *
 * Bank B4 of `task:0021`, and the irreversible part. `task:0021` D1 fixes entry
 * identity as **one global entry per source, keyed by canonical URL**, with
 * per-(edition, language, chapter, section) citation instances pointing at it.
 * A URL does not translate; the prose around it does. Changing this key after
 * entries exist rewrites every reference in every chapter and language.
 *
 * `task:0021` D2 fixes the schema as **CSL** — the Citation Style Language item
 * model that Zotero, Pandoc and Crossref already speak. Using it rather than
 * inventing fields buys style-independent rendering, BibTeX export and Zotero
 * round-trip for free, and means the arXiv and Crossref resolvers in `task:0027`
 * need no mapping layer of their own.
 *
 * Stored as YAML rather than JSON because these files are hand-edited: roughly
 * 600 of the sources have no API that describes them, so a human will fix them
 * in a text editor and review them in a diff. YAML takes comments and produces
 * readable diffs; CSL-JSON is the compiled form.
 */
import { parse, stringify } from 'yaml';

/**
 * A CSL item, narrowed to the fields this project populates.
 *
 * Deliberately open (`[key: string]: unknown`): CSL defines far more than we
 * use, and a resolver that learns to fill `volume` or `page` should not need a
 * change here. Narrowing CSL to a closed set would recreate the bespoke schema
 * D2 exists to avoid.
 */
export type CslItem = {
  /** The canonical URL. Doubles as the CSL `id` — identity is the URL. */
  id: string;
  /** CSL item type: article-journal, paper-conference, webpage, post-weblog… */
  type: CslType;
  title?: string;
  /** CSL name variables. `literal` is used where a name cannot be safely split. */
  author?: CslName[];
  issued?: CslDate;
  URL?: string;
  DOI?: string;
  'container-title'?: string;
  abstract?: string;
  /** Free-text note. Where an entry is unresolved, this says so in the file. */
  note?: string;
  [key: string]: unknown;
};

/**
 * The CSL types this project emits.
 *
 * `webpage` versus `post-weblog` matters for rendering: a lab announcement is a
 * web page, an Alignment Forum or LessWrong entry is a blog post, and citation
 * styles format them differently.
 */
export type CslType =
  | 'article-journal'
  | 'paper-conference'
  | 'article' // preprints, including arXiv
  | 'webpage'
  | 'post-weblog'
  | 'motion_picture' // video
  | 'report'
  | 'document'; // last resort

/**
 * A CSL name. Either structured, or `literal` for a name we will not guess at.
 *
 * `literal` is used deliberately and often. An anchor reading "Giattino et al."
 * or "Oxford Reference" has no recoverable family/given split, and inventing one
 * produces confidently wrong output in every rendered style. CSL supports
 * `literal` precisely for this, so an honest unparsed name is representable.
 */
export type CslName = { family?: string; given?: string; literal?: string };

/** A CSL date, in the `date-parts` form the specification defines. */
export type CslDate = { 'date-parts': number[][]; literal?: string };

/** One stored entry: the CSL item plus what this project knows about it. */
export type StoreEntry = {
  item: CslItem;
  /** Which resolver filled this, or 'anchor' when only the link text is known. */
  resolvedBy: string;
  /** Anchor texts seen for this source, kept for reporting and diagnosis. */
  anchors: string[];
};

export type Store = Record<string, StoreEntry>;

/** A CSL date from a four-digit year, which is all an anchor text ever gives. */
export function yearToCslDate(year: string): CslDate {
  return { 'date-parts': [[Number(year)]] };
}

/** A CSL name that makes no claim about name structure. */
export function literalName(name: string): CslName {
  return { literal: name };
}

/**
 * The CSL item type implied by a canonical URL.
 *
 * A heuristic, and only ever a starting point: a resolver with real metadata
 * should overwrite it. It exists so that an unresolved entry still renders as
 * something more useful than a generic document.
 */
export function inferCslType(url: string): CslType {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'document';
  }
  if (host === 'arxiv.org') return 'article';
  if (host === 'doi.org') return 'article-journal';
  if (host.endsWith('youtube.com') || host === 'youtu.be') return 'motion_picture';
  if (
    host.endsWith('alignmentforum.org') ||
    host.endsWith('lesswrong.com') ||
    host.endsWith('substack.com') ||
    host.endsWith('effectivealtruism.org')
  ) {
    return 'post-weblog';
  }
  return 'webpage';
}

/**
 * A minimal entry built from nothing but a canonical URL and its anchor text.
 *
 * This is what `atlas citations extract` writes before any network call, and it
 * is already a usable bibliography entry: 96.8% of anchors in this corpus carry
 * an author and a year. Resolution improves entries; it is not a precondition
 * for having them.
 */
export function entryFromAnchor(
  key: string,
  anchorText: string,
  parsed: { author: string; year: string } | null,
): StoreEntry {
  const item: CslItem = {
    id: key,
    type: inferCslType(key),
    URL: key,
  };
  if (parsed) {
    item.author = [literalName(parsed.author)];
    item.issued = yearToCslDate(parsed.year);
    item.title = anchorText;
    item.note = 'Unresolved: title and author taken from the citation anchor text.';
  } else {
    item.title = anchorText || key;
    item.note = 'Unresolved: no author-year could be parsed from the anchor text.';
  }
  return { item, resolvedBy: 'anchor', anchors: anchorText ? [anchorText] : [] };
}

/**
 * Merge a newly-extracted entry into an existing one.
 *
 * Extraction must never overwrite resolved metadata — `atlas citations extract`
 * runs often and resolution is expensive, so a re-extraction that clobbered
 * resolver output would throw away the work `task:0027` exists to do. Only the
 * observed anchor list grows.
 */
export function mergeEntry(existing: StoreEntry, incoming: StoreEntry): StoreEntry {
  const anchors = [...new Set([...existing.anchors, ...incoming.anchors])].sort();
  if (existing.resolvedBy !== 'anchor') return { ...existing, anchors };
  return { ...incoming, anchors };
}

const FILE_HEADER = `# Bibliography entries for the AI Safety Atlas.
#
# Generated by \`atlas citations extract\` and filled in by
# \`atlas citations resolve\`. Hand edits are expected and preserved: an entry
# whose \`resolvedBy\` is anything other than "anchor" is never overwritten by
# re-extraction.
#
# Schema is CSL (Citation Style Language) — see task:0021 D2. The key of each
# entry is its canonical URL, which is the entry's identity (task:0021 D1).
`;

/** Serialize a store to CSL-YAML. Keys are sorted so diffs stay reviewable. */
export function serializeStore(store: Store): string {
  const sorted: Store = {};
  for (const key of Object.keys(store).sort()) sorted[key] = store[key];
  return FILE_HEADER + stringify(sorted, { lineWidth: 100 });
}

/** Parse CSL-YAML back into a store. An empty or comment-only file is empty. */
export function parseStore(text: string): Store {
  const parsed = parse(text);
  if (!parsed || typeof parsed !== 'object') return {};
  return parsed as Store;
}

/** Fold extracted citations into a store, preserving anything already resolved. */
export function upsertEntries(store: Store, entries: Array<[string, StoreEntry]>): Store {
  const out: Store = { ...store };
  for (const [key, entry] of entries) {
    out[key] = key in out ? mergeEntry(out[key], entry) : entry;
  }
  return out;
}

/** CSL-JSON: the compiled form, an array of items as the specification defines. */
export function toCslJson(store: Store): CslItem[] {
  return Object.keys(store)
    .sort()
    .map((k) => store[k].item);
}
