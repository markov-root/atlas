/**
 * Academic publisher pages: Highwire `citation_*` meta tags, then Crossref.
 *
 * Added after the first full resolve run showed the gap. 43 cited sources sit
 * on publisher domains — Nature, IEEE, ACM, Wiley, OUP, SSRN, PNAS, PubMed —
 * and none of them reached Crossref, because `crossrefResolver` only claims
 * `doi.org/*` and the whole corpus contains exactly **one** such URL. Those 43
 * fell through to Open Graph, which gave 18 of them a bare title and left 25
 * with nothing.
 *
 * The fix is to get a DOI out of the page and then ask Crossref, which returns
 * the authoritative record: real author names, journal, volume, pages, date.
 *
 * Two routes, because publishers differ:
 *
 *   1. **Highwire meta tags** (`citation_doi`, `citation_title`,
 *      `citation_author`, …). A de-facto standard — it is what Google Scholar
 *      indexes — so most publishers emit it. Verified present on Nature.
 *   2. **PubMed** emits none of it: the page is JS-rendered and returns a 21 KB
 *      stub to a plain fetch. But the URL carries a PMID, and NCBI's esummary
 *      API maps that to a DOI for free and without a key.
 *
 * Either route ends at a DOI, at which point Crossref does the real work. When
 * no DOI is available the meta tags are mapped directly, which is still far
 * better than a bare title.
 */
import type { CslItem, CslName, CslDate } from '../store';
import type { Resolver, ResolveResult, ResolverContext } from './types';
import { crossrefResolver } from './crossref';

const TIMEOUT_MS = 15000;
const MAX_BYTES = 512 * 1024;

/**
 * Hosts this resolver claims.
 *
 * Deliberately an explicit list rather than "any URL". Claiming everything
 * would double the network load on the 604-source long tail — this resolver
 * and Open Graph would each fetch the same page — to serve a small minority.
 * Adding a publisher is a one-line change here.
 */
const ACADEMIC_HOSTS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'nature.com',
  'ieeexplore.ieee.org',
  'papers.ssrn.com',
  'ssrn.com',
  'sciencedirect.com',
  'onlinelibrary.wiley.com',
  'academic.oup.com',
  'dl.acm.org',
  'pnas.org',
  'tandfonline.com',
  'psycnet.apa.org',
  'link.springer.com',
  'springer.com',
  'jstor.org',
  'biorxiv.org',
  'medrxiv.org',
  'cell.com',
  'science.org',
  'plos.org',
  'journals.plos.org',
  'mdpi.com',
  'frontiersin.org',
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Values of every `<meta name="citation_x" content="...">` on the page.
 *
 * Attribute-anchored on purpose. A substring search for `citation_doi` finds
 * matches **inside** `citation_reference` tags, which carry the DOIs of the
 * paper's own bibliography — Nature emits dozens. Grabbing one of those would
 * silently attribute a cited work's metadata to the citing paper, which is
 * worse than failing.
 */
export function citationMeta(html: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const tag = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(html)) !== null) {
    const el = m[0];
    const name = /\bname\s*=\s*["']([^"']+)["']/i.exec(el)?.[1]?.toLowerCase();
    if (!name || !name.startsWith('citation_')) continue;
    // citation_reference describes a DIFFERENT work — never this one.
    if (name === 'citation_reference') continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(el)?.[1];
    if (content === undefined || content === '') continue;
    const list = out.get(name) ?? [];
    list.push(decodeEntities(content));
    out.set(name, list);
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

/**
 * `citation_author` is "Family, Given" or "Given Family" depending on publisher.
 *
 * A comma is the reliable signal: with one, the part before it is the family
 * name. Without, the last whitespace-separated token is taken as the family
 * name — wrong for "van den Berg" and for mononyms, which is why it is only
 * used when no comma is present and never on a name we could preserve intact.
 */
function parseAuthor(raw: string): CslName {
  const name = raw.trim();
  if (name.includes(',')) {
    const [family, ...rest] = name.split(',');
    const given = rest.join(',').trim();
    return given ? { family: family.trim(), given } : { family: family.trim() };
  }
  const parts = name.split(/\s+/);
  if (parts.length < 2) return { literal: name };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
}

/** `2011/01`, `2011-01-15` and `2011` all reduce to a CSL year. */
function parseDate(raw: string): CslDate | undefined {
  const year = /(\d{4})/.exec(raw)?.[1];
  return year ? { 'date-parts': [[Number(year)]] } : undefined;
}

/** Map Highwire meta straight to CSL, for pages that expose no DOI. */
export function metaToCsl(meta: Map<string, string[]>): Partial<CslItem> {
  const one = (k: string) => meta.get(k)?.[0];
  const fields: Partial<CslItem> = {};
  const title = one('citation_title');
  if (title) fields.title = title;
  const authors = meta.get('citation_author');
  if (authors?.length) fields.author = authors.map(parseAuthor);
  const journal = one('citation_journal_title');
  if (journal) {
    fields['container-title'] = journal;
    fields.type = 'article-journal';
  }
  const date = one('citation_publication_date') ?? one('citation_date') ?? one('citation_year');
  if (date) {
    const issued = parseDate(date);
    if (issued) fields.issued = issued;
  }
  const doi = one('citation_doi');
  if (doi) fields.DOI = doi;
  const volume = one('citation_volume');
  if (volume) fields.volume = volume;
  const first = one('citation_firstpage');
  const last = one('citation_lastpage');
  if (first) fields.page = last ? `${first}-${last}` : first;
  const publisher = one('citation_publisher');
  if (publisher) fields.publisher = publisher;
  return fields;
}

/** PubMed article id from a canonical PubMed URL, or null. */
export function pubmedId(url: string): string | null {
  const host = hostOf(url);
  if (!host || !host.includes('ncbi.nlm.nih.gov')) return null;
  try {
    return /^\/(\d+)\/?$/.exec(new URL(url).pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Read at most MAX_BYTES of a response body, so one huge page cannot stall a run. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return (await res.text()).slice(0, MAX_BYTES);
  const decoder = new TextDecoder();
  let out = '';
  while (out.length < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return out;
}

async function doiFromPubmed(url: string, ctx: ResolverContext): Promise<string | null> {
  const pmid = pubmedId(url);
  if (!pmid) return null;
  await ctx.throttle();
  const res = await ctx.fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}`,
    { headers: { 'User-Agent': ctx.userAgent }, signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { result?: Record<string, unknown> };
  const rec = body.result?.[pmid] as { articleids?: Array<{ idtype?: string; value?: string }> };
  const doi = rec?.articleids?.find((a) => a.idtype === 'doi')?.value;
  return typeof doi === 'string' && doi ? doi : null;
}

export const scholarMetaResolver: Resolver = {
  name: 'scholar-meta',

  claims(canonicalUrl) {
    const host = hostOf(canonicalUrl);
    return !!host && ACADEMIC_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  },

  async resolve(canonicalUrl, ctx): Promise<ResolveResult | null> {
    try {
      let doi: string | null = null;
      let metaFields: Partial<CslItem> = {};

      const pmid = pubmedId(canonicalUrl);
      if (pmid) {
        doi = await doiFromPubmed(canonicalUrl, ctx);
      } else {
        await ctx.throttle();
        const res = await ctx.fetch(canonicalUrl, {
          headers: { 'User-Agent': ctx.userAgent, Accept: 'text/html' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return null;
        const meta = citationMeta(await readCapped(res));
        if (meta.size === 0) return null;
        metaFields = metaToCsl(meta);
        doi = meta.get('citation_doi')?.[0] ?? null;
      }

      // A DOI means Crossref can give the authoritative record — real author
      // names, journal, volume, pages — which is the whole point of this
      // resolver. Its output wins over the page's own meta where they overlap.
      if (doi) {
        const viaCrossref = await crossrefResolver.resolve(`https://doi.org/${doi}`, ctx);
        if (viaCrossref) {
          return {
            fields: { ...metaFields, ...viaCrossref.fields, URL: canonicalUrl, DOI: doi },
            source: 'scholar-meta',
            note: 'Resolved via publisher metadata and Crossref.',
          };
        }
      }

      // No DOI, or Crossref declined. The meta tags alone still beat a bare
      // title, so return them rather than falling through to Open Graph.
      if (!metaFields.title) return null;
      return {
        fields: { ...metaFields, URL: canonicalUrl },
        source: 'scholar-meta',
        note: doi ? 'Publisher metadata; Crossref had no record.' : undefined,
      };
    } catch {
      return null;
    }
  },
};
