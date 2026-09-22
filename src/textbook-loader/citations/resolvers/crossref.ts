/**
 * Crossref resolver — DOI-bearing sources, 35 unique URLs.
 *
 * Crossref speaks CSL natively (`api.crossref.org/works/<doi>` returns the
 * same field names a CSL-JSON item uses), so this is deliberately a thin
 * pass-through of the fields we populate, not a hand-rolled mapping. Where
 * Crossref and CSL differ, they differ in shape, not meaning: titles and
 * container titles are arrays (CSL-JSON keeps the first), and `issued`
 * arrives exactly in CSL `date-parts` form.
 */
import type { CslDate, CslItem, CslName, CslType } from '../store';
import type { Resolver } from './types';

const API = 'https://api.crossref.org/works/';

/**
 * Generous but bounded: Crossref is usually fast, and a hung request must not
 * stall a run over 948 URLs (same reasoning as the Open Graph timeout).
 */
const TIMEOUT_MS = 30_000;

/**
 * Crossref `type` values the corpus's 35 DOIs can plausibly hit, onto the CSL
 * types this project emits. Unknown values fall back to `document` rather
 * than to a guessed near-miss.
 */
const TYPE_MAP: Record<string, CslType> = {
  'journal-article': 'article-journal',
  'proceedings-article': 'paper-conference',
  // Crossref uses posted-content for preprints and working papers alike; CSL
  // 'article' is this project's preprint type (see store.ts).
  'posted-content': 'article',
  report: 'report',
};

/** First element of a Crossref string-array field (`title`, `container-title`). */
function first(value: unknown): string | undefined {
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
}

type CrossrefAuthor = { given?: unknown; family?: unknown; name?: unknown };

/**
 * Crossref gives real given/family splits — unlike the anchor text, which is
 * why this resolver is allowed to produce structured names. Organization
 * authors arrive as `name` and stay literal: inventing a split for "DeepMind"
 * is exactly what store.ts's `literal` exists to avoid.
 */
function mapAuthors(value: unknown): CslName[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const names: CslName[] = [];
  for (const a of value as CrossrefAuthor[]) {
    if (typeof a?.family === 'string') {
      names.push(
        typeof a.given === 'string' ? { family: a.family, given: a.given } : { family: a.family },
      );
    } else if (typeof a?.name === 'string') {
      names.push({ literal: a.name });
    }
  }
  return names.length > 0 ? names : undefined;
}

/** Crossref hands `issued` over already in CSL `date-parts` shape. */
function mapIssued(value: unknown): CslDate | undefined {
  const parts = (value as CslDate | undefined)?.['date-parts'];
  if (Array.isArray(parts) && parts.length > 0 && Array.isArray(parts[0])) {
    return { 'date-parts': parts as number[][] };
  }
  return undefined;
}

export const crossrefResolver: Resolver = {
  name: 'crossref',

  claims(canonicalUrl) {
    return canonicalUrl.startsWith('https://doi.org/');
  },

  async resolve(canonicalUrl, ctx) {
    try {
      const doi = decodeURIComponent(new URL(canonicalUrl).pathname.slice(1));
      // Before every request, per the contract: the runner owns rate limiting.
      await ctx.throttle();
      const res = await ctx.fetch(API + encodeURIComponent(doi), {
        // ctx.userAgent carries the mailto that puts us in Crossref's polite
        // pool; sending it is the whole price of the free API (task:0027 AC-5).
        headers: { 'User-Agent': ctx.userAgent },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return null;

      const message = ((await res.json()) as { message?: unknown }).message;
      if (typeof message !== 'object' || message === null) return null;
      const work = message as Record<string, unknown>;

      const title = first(work.title);
      if (!title) return null;

      const fields: Partial<CslItem> = {
        title,
        DOI: typeof work.DOI === 'string' ? work.DOI : undefined,
        // Crossref's URL points at doi.org, which is the canonical URL itself.
        URL: typeof work.URL === 'string' ? work.URL : undefined,
        'container-title': first(work['container-title']),
        type: typeof work.type === 'string' ? (TYPE_MAP[work.type] ?? 'document') : undefined,
        author: mapAuthors(work.author),
        issued: mapIssued(work.issued),
      };

      // Drop undefined fields so a merge never writes an empty YAML key.
      for (const key of Object.keys(fields)) {
        if (fields[key] === undefined) delete fields[key];
      }
      return { fields, source: 'crossref' };
    } catch {
      // Unreachable, timed out, or a body that would not parse — all decline.
      return null;
    }
  },
};
