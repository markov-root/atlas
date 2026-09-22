/**
 * `atlas citations export` — the whole-book bibliography as BibTeX and
 * CSL-JSON, read from the committed store. Bank B7 of `task:0021`, and the
 * owner's stated phase-1 goal: "the full bibliography across the book
 * exportable into a sensible file."
 *
 * Everything is a pure serializer over the store; the wrapper only reads one
 * file and writes two. No network, no credentials — the store already holds
 * whatever resolution has given us, and an anchor-only bibliography is still a
 * usable one (`task:0025`).
 *
 * AC-4 requires the BibTeX to import into a reference manager without error.
 * Two properties make that true and are tested, not asserted:
 * every entry key is unique *and stable across runs* — a key may never depend
 * on what else is in the store, so collisions are broken with a hash of the
 * entry's own canonical URL, not a counter that shifts when an entry is added —
 * and the characters BibTeX treats specially are escaped in every field value.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  parseStore,
  toCslJson,
  type CslItem,
  type CslName,
  type Store,
} from '../../../src/textbook-loader/citations/store.js';
import { STORE_PATH } from './extract-cmd.js';

/** Escape the characters BibTeX assigns structural meaning to inside a value. */
function bibtexEscape(s: string): string {
  // Backslash first, or the escapes written for later characters get doubled.
  return s.replace(/\\/g, '\\\\').replace(/([{}%&#_$])/g, '\\$1');
}

/** Lowercase alphanumerics only — safe in every BibTeX key parser. */
function slug(s: string, max = 20): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, max);
}

/** Short deterministic digest of a URL, used only to break key collisions. */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * The key an entry would have if the store contained nothing else.
 *
 * Deliberately content-derived (`name+year+title-word`), because keys are
 * visible in a reference manager and in every \cite command an author writes.
 * The title word is dropped when it repeats the name — unresolved entries
 * carry the anchor text as their title, which would otherwise give
 * "Chollet, 2019" the absurd key `chollet2019chollet`.
 */
export function baseBibtexKey(item: CslItem): string {
  const author: CslName | undefined = item.author?.[0];
  const rawName = (author?.family ?? author?.literal ?? 'anonymous').trim();
  const name = slug(rawName) || 'anonymous';
  const year = item.issued?.['date-parts']?.[0]?.[0] ?? '';
  const titleWord = slug(String(item.title ?? '').split(/\s+/)[0] ?? '');
  const suffix = titleWord && titleWord !== name ? titleWord : '';
  return `${name}${year}${suffix}` || 'source';
}

/**
 * One stable key per store entry. Collisions — two Anthropic 2024 pages, say —
 * are broken with a digest of the entry's own canonical URL, which never
 * changes, so adding an unrelated entry cannot renumber anyone.
 */
export function assignBibtexKeys(store: Store): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const url of Object.keys(store).sort()) {
    const base = baseBibtexKey(store[url].item);
    let key = base;
    if (used.has(key)) key = `${base}-${shortHash(url)}`;
    // The hash itself could collide with an existing key; degenerate but cheap
    // to defend against, and the digest is deterministic so retrying it is too.
    while (used.has(key)) key = `${base}-${shortHash(key)}x`;
    used.add(key);
    out.set(url, key);
  }
  return out;
}

/** CSL type → BibTeX entry type. */
const BIBTEX_TYPES: Record<string, string> = {
  'article-journal': 'article',
  'paper-conference': 'inproceedings',
  report: 'techreport',
  // Preprints, pages, blog posts, video and the last-resort type all land on
  // @misc: standard BibTeX has no better home for them, and Zotero/BibLaTeX
  // map howpublished back to a URL without complaint.
  article: 'misc',
  webpage: 'misc',
  'post-weblog': 'misc',
  motion_picture: 'misc',
  document: 'misc',
};

/** CSL name → BibTeX author value, one name per call. */
function bibtexName(n: CslName): string {
  // Every name is braced whole. A literal CSL name must be, so BibTeX cannot
  // parse "Giattino et al." as First Last — one undivided name by construction
  // (`task:0025`: guessing structure would be confidently wrong in every
  // style). A structured name is braced too: `{Family, Given}` is the
  // brace-protected form every reference manager parses identically.
  if (n.literal !== undefined) return `{${bibtexEscape(n.literal)}}`;
  if (n.family !== undefined) {
    const name =
      n.given !== undefined
        ? `${bibtexEscape(n.family)}, ${bibtexEscape(n.given)}`
        : bibtexEscape(n.family);
    return `{${name}}`;
  }
  return '{}';
}

/** The `key = {value}` lines of one entry, in a fixed order. */
function bibtexFields(key: string, item: CslItem): string[] {
  const fields: string[] = [];
  const add = (name: string, value: string | number | undefined): void => {
    if (value !== undefined && value !== '') fields.push(`${name} = {${bibtexEscape(String(value))}}`);
  };

  if (item.author?.length) {
    fields.push(`author = ${item.author.map(bibtexName).join(' and ')}`);
  }
  add('title', item.title);
  add('year', item.issued?.['date-parts']?.[0]?.[0]);

  const type = BIBTEX_TYPES[item.type] ?? 'misc';
  const container = item['container-title'];
  if (type === 'article' && container) add('journal', container);
  else if (type === 'inproceedings' && container) add('booktitle', container);
  else if (type === 'techreport' && container) add('institution', container);
  // @misc has no journal/booktitle slot; howpublished is where a reference
  // manager expects the address of a web source to arrive.
  else if (type === 'misc' && item.URL) fields.push(`howpublished = {${bibtexEscape(item.URL)}}`);

  add('doi', item.DOI);
  if (type !== 'misc') add('url', item.URL);
  add('note', item.note);

  return fields;
}

/** One `@type{key, ...}` block. */
export function bibtexEntry(key: string, item: CslItem): string {
  const type = BIBTEX_TYPES[item.type] ?? 'misc';
  const fields = bibtexFields(key, item);
  // Every field ends with a comma: BibTeX separates fields with commas, and
  // omitting the last one is legal but a missing *interior* one is a parse
  // error — emitting all of them uniformly is the only way to stay correct
  // as fields are added and reordered.
  return [`@${type}{${key},`, ...fields.map((f) => `  ${f},`), '}'].join('\n');
}

/**
 * The whole store as one .bib file. Entries are keyed and ordered by their
 * assigned BibTeX keys so the output is stable regardless of store insertion
 * order, and regenerating gives a reviewable diff.
 */
export function serializeBibtex(store: Store): string {
  const keys = assignBibtexKeys(store);
  const urls = [...keys.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const blocks = urls.map(([url, key]) => bibtexEntry(key, store[url].item));
  return (
    '% Bibliography for the AI Safety Atlas.\n' +
    '% Generated by `atlas citations export` from data/citations/sources.yaml.\n' +
    '% Do not hand-edit: changes here are lost on the next export. Fix the store.\n\n' +
    blocks.join('\n\n') +
    '\n'
  );
}

/** The CSL-JSON half of the export — a straight compile of the store. */
export function serializeCslJson(store: Store): string {
  return JSON.stringify(toCslJson(store), null, 2) + '\n';
}

/**
 * Run the command: write both files, print one line naming them.
 *
 * The store must exist before this is meaningful — exporting an empty
 * bibliography and calling it success would be the exact warn-into-a-log
 * failure AC-3 exists to prevent, so a missing store is a hard stop with a
 * pointer to the command that creates it.
 */
export async function citationsExport(root: string, outDir?: string): Promise<number> {
  const storePath = join(root, STORE_PATH);
  if (!existsSync(storePath)) {
    console.error(`no citation store at ${STORE_PATH} — run \`atlas citations extract\` first`);
    return 1;
  }
  const store = parseStore(readFileSync(storePath, 'utf8'));

  const dest = outDir ?? join(root, 'data', 'citations');
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, 'bibliography.bib'), serializeBibtex(store), 'utf8');
  writeFileSync(join(dest, 'bibliography.json'), serializeCslJson(store), 'utf8');

  console.log(`${Object.keys(store).length} sources exported to ${dest}/bibliography.{bib,json}`);
  return 0;
}