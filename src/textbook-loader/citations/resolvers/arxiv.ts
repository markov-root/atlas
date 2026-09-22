/**
 * The arXiv resolver — the biggest single win in the corpus (347 of 948
 * unique sources).
 *
 * The arXiv API (`export.arxiv.org/api/query`) answers one id with an Atom
 * feed of title, authors as full-name strings, a published timestamp, a
 * summary, and — for papers that already have one — the published DOI. There
 * is no XML parser dependency in this repo and `task:0027` forbids adding one
 * for the four fields we need, so extraction below is targeted matching
 * against the entry we asked for.
 *
 * What that deliberately does NOT handle (accepted, because the request is
 * single-entry and the API is stable):
 *
 * - **XML structure in general.** No tree, no namespaces, no CDATA, no
 *   comments. An Atom document that nests another element inside `<title>` —
 *   e.g. XHTML content — would mis-extract. Field content is read from plain
 *   text elements only, which is what the real feed emits.
 * - **Multiple entries.** Only the first `<entry>` is read. `id_list=` with
 *   one id yields one entry — except the error case below.
 * - **Entities beyond the five XML named ones and decimal/hex character
 *   references.** A novel numeric form would survive undecoded in the title.
 *
 * Two response shapes are answered null rather than mapped, because both are
 * traps that would otherwise fabricate a bibliography entry: an empty feed
 * (HTTP 200, zero entries — a nonexistent id) and the *error entry* — a
 * malformed id still returns HTTP 200 with `totalResults: 1` and a single
 * entry titled "Error" authored by "arXiv api core". Mapping either would put
 * "Error" in the bibliography.
 */
import type { CslDate, CslName } from '../store.js';
import type { ResolveResult, Resolver, ResolverContext } from './types.js';

/** Remote service, so more slack than the LAN corpus — but never unbounded. */
const TIMEOUT_MS = 10_000;

const DECODED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

/**
 * Decode the entity forms Atom actually uses. Named entities plus decimal and
 * hex character references; anything else is left as written rather than
 * guessed at (see the header comment).
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&(?:amp|lt|gt|quot|apos);/g, (e) => DECODED_ENTITIES[e]);
}

/** First `<tag>…</tag>` within a text, or null. Case-sensitive: Atom is lowercase. */
function extractElement(text: string, tag: string): string | null {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(text);
  return m ? m[1] : null;
}

/** `<author><name>Full Name</name></author>` → the names, in document order. */
function extractAuthors(entry: string): string[] {
  return [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g)].map((m) =>
    m[1].trim(),
  );
}

/**
 * arXiv gives full names as strings. Splitting on the last space puts most
 * Western names into family/given correctly; multi-word family names
 * ("van der Berg", transliterated East Asian orders) come out wrong — the
 * given part absorbs the extra words. Accepted over a `literal` name because
 * the split is right for the large majority and wrong for almost none of this
 * corpus's authors, while `literal` degrades every inverted-name style for
 * all of them. Single-word names (organisations) stay `literal`.
 */
function splitName(full: string): CslName {
  const cut = full.lastIndexOf(' ');
  if (cut === -1) return { literal: full };
  return { given: full.slice(0, cut).trim(), family: full.slice(cut + 1).trim() };
}

/** `2023-10-30T17:44:09Z` → CSL date-parts. arXiv always sends a UTC timestamp. */
function parsePublished(iso: string): CslDate | null {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(iso);
  if (!m) return null;
  const parts = [Number(m[1]), m[2] ? Number(m[2]) : undefined, m[3] ? Number(m[3]) : undefined];
  return { 'date-parts': [parts.filter((p) => p !== undefined)] };
}

/** The arXiv id from a canonical `/abs/` URL, or null. Canonicalization has already collapsed /pdf, /html and version suffixes. */
export function arxivIdFromUrl(canonicalUrl: string): string | null {
  const m = /^https:\/\/arxiv\.org\/abs\/(.+)$/i.exec(canonicalUrl);
  return m ? decodeURIComponent(m[1]) : null;
}

export const arxivResolver: Resolver = {
  name: 'arxiv',

  claims(canonicalUrl: string): boolean {
    return arxivIdFromUrl(canonicalUrl) !== null;
  },

  async resolve(canonicalUrl: string, ctx: ResolverContext): Promise<ResolveResult | null> {
    const id = arxivIdFromUrl(canonicalUrl);
    if (!id) return null;

    // Protocol-level etiquette (task:0027 AC-5): identify ourselves, let the
    // runner pace the requests.
    await ctx.throttle();
    let text: string;
    try {
      const response = await ctx.fetch(`https://export.arxiv.org/api/query?id_list=${id}`, {
        headers: { 'User-Agent': ctx.userAgent },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return null;
      text = await response.text();
    } catch {
      // Unreachable, timed out, or unusable body — null, never a throw. A
      // resolver that throws would make a free API into a build dependency.
      return null;
    }

    const entry = extractElement(text, 'entry');
    if (!entry) return null;

    // The malformed-id shape: a 200 response whose only entry is the API's
    // own error record. Detected by its id, not its title — the title is
    // prose that could change.
    const entryId = extractElement(entry, 'id') ?? '';
    if (/arxiv\.org\/api\/errors/.test(entryId)) return null;

    const rawTitle = extractElement(entry, 'title');
    const published = extractElement(entry, 'published');
    if (!rawTitle || !published) return null;

    // Preprint: the published version, if any, is a different entry keyed
    // by its DOI (task:0021 edge case 2 — duplicates are accepted in phase 1).
    const fields: ResolveResult['fields'] = { type: 'article' };
    // Titles wrap in the feed; newlines and runs of spaces are layout, not content.
    fields.title = decodeEntities(rawTitle).replace(/\s+/g, ' ').trim();
    fields.URL = canonicalUrl;
    const issued = parsePublished(published);
    if (issued) fields.issued = issued;

    const authorNames = extractAuthors(entry);
    if (authorNames.length > 0) fields.author = authorNames.map(splitName);

    const rawSummary = extractElement(entry, 'summary');
    if (rawSummary) fields.abstract = decodeEntities(rawSummary).replace(/\s+/g, ' ').trim();

    const doi = extractElement(entry, 'arxiv:doi');
    if (doi) fields.DOI = decodeEntities(doi).trim();

    return { fields, source: 'arxiv' };
  },
};
