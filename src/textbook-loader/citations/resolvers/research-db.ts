/**
 * The research-database resolver — the local, free, try-first accelerator.
 *
 * The homelab corpus (4,7+K articles of frontier-AI and AI-safety source
 * material) answers by exact URL with CSL-grade metadata and no third-party
 * etiquette to observe, so it is tried before any networked resolver. It is
 * still only an accelerator, never a dependency: coverage is a minority of the
 * corpus (measured 2026-09-21, 78 of 987 cited URLs), and `task:0021` D4
 * requires the bibliography to build identically with the service down —
 * hence AC-6 below.
 *
 * Three traps this file exists to handle, all discovered against the live
 * service:
 *
 * 1. **Admission scope.** Records default to `admitted` and many relevant ones
 *    are `unreviewed`, so every request widens with `include_unreviewed=true`.
 *    Without it, resolution quietly misses records the corpus holds.
 * 2. **URL spelling.** The corpus stores scraped URLs verbatim (modulo scheme/
 *    host case), and matching is exact string equality (`records_for_url`).
 *    ~39% of stored URLs carry `www.` while our canonical form drops it, which
 *    silently loses 27 of the 987 cited URLs — so a miss retries once with
 *    `www.` inserted. Trailing-slash differences are handled server-side;
 *    nothing else is aliased, and inventing more variants than that would be
 *    guessing at corpus state.
 * 3. **Authorship shape.** `authors[]` entries are `{kind, label, resolved}`
 *    bylines, not family/given — and a *resolved organisation* author has no
 *    `label` at all. Labels map to CSL `literal` names and nulls are dropped;
 *    guessing a split here would produce confidently wrong output in every
 *    rendered style (see `task:0027`).
 *
 * AC-6 is structural: an unreachable service, a non-200 response, or an
 * unusable body all return null — never a throw, never a hang — so a resolver
 * that accelerates 8% of sources cannot become a single point of failure for
 * the other 92%.
 */
import type { CslDate, CslName, CslType } from '../store.js';
import { literalName } from '../store.js';
import type { ResolveResult, Resolver, ResolverContext } from './types.js';

/** Same variable the `research` CLI honours, so one setting controls both. */
function apiBase(): string {
  return process.env.RESEARCH_API || 'http://localhost:8551';
}

/** Generous for a LAN service, short enough that a stalled one never wedges a run. */
const TIMEOUT_MS = 5_000;

/** The shape of `GET /api/records/citation` on success. Only the fields we map. */
type CitationPayload = {
  success?: boolean;
  title?: string | null;
  publication_date?: string | null;
  abstract?: string | null;
  source_type?: string | null;
  authors?: Array<{ label?: string | null } | null>;
};

/**
 * `source_type` is a provenance-first label, not a CSL type. The corpus's
 * types are organisations (anthropic, deepmind, epoch…) plus a few formats.
 * Only the mappings that are actually distinctive are made here; everything
 * else renders as a webpage, which is what an org landing page is.
 */
const SOURCE_TYPE_TO_CSL: Record<string, CslType> = {
  arxiv: 'article',
  substack: 'post-weblog',
  alignmentforum: 'post-weblog',
  lesswrong: 'post-weblog',
  youtube: 'motion_picture',
};

/** `2024-08-15T17:23:10Z` (or a bare date) → CSL date-parts, or null. */
function parseDate(iso: string | null | undefined): CslDate | null {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(iso ?? '');
  if (!m) return null;
  const parts = [Number(m[1]), m[2] ? Number(m[2]) : undefined, m[3] ? Number(m[3]) : undefined];
  return { 'date-parts': [parts.filter((p) => p !== undefined)] };
}

/** Captured bylines → CSL literal names. A resolved-organisation author (null label) is not a name. */
function mapAuthors(authors: CitationPayload['authors']): CslName[] {
  return (authors ?? [])
    .filter((a): a is { label: string } => typeof a?.label === 'string' && a.label.trim() !== '')
    .map((a) => literalName(a.label));
}

/**
 * One request, one verdict. Returns null for every "tried, found nothing"
 * outcome: network error, non-200, non-JSON body, `success` false, or a record
 * too empty to improve the entry. It does not throw, which is what makes the
 * two-variant loop below safe.
 */
async function attempt(refUrl: string, ctx: ResolverContext): Promise<ResolveResult | null> {
  const url =
    `${apiBase()}/api/records/citation?ref=${encodeURIComponent(refUrl)}` +
    '&include_unreviewed=true';
  let payload: CitationPayload;
  try {
    const response = await ctx.fetch(url, {
      headers: { 'User-Agent': ctx.userAgent },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    payload = (await response.json()) as CitationPayload;
  } catch {
    // Unreachable, timed out, or garbage body. This is the AC-6 path: null,
    // not an exception — rule 2 of the resolver contract.
    return null;
  }
  if (!payload.success) return null;

  const fields: ResolveResult['fields'] = {};
  if (typeof payload.title === 'string' && payload.title.trim()) {
    fields.title = payload.title;
  }
  const authors = mapAuthors(payload.authors);
  if (authors.length > 0) fields.author = authors;
  const issued = parseDate(payload.publication_date);
  if (issued) fields.issued = issued;
  if (typeof payload.abstract === 'string' && payload.abstract.trim()) {
    fields.abstract = payload.abstract;
  }
  if (payload.source_type && SOURCE_TYPE_TO_CSL[payload.source_type]) {
    fields.type = SOURCE_TYPE_TO_CSL[payload.source_type];
  }
  if (Object.keys(fields).length === 0) return null;

  const missing: string[] = [];
  if (authors.length === 0) missing.push('no author labels');
  if (!issued) missing.push('no publication date');
  // Deliberately factual, in the store's note voice: what is absent, not a
  // warranty about what is present. The corpus leaves attribution
  // `legacy_unknown` until reviewed; the labels it returns are the captured
  // byline, which is more than the anchor text knew but not more than that.
  return {
    fields,
    source: 'research-db',
    note:
      missing.length > 0
        ? `Research-database record found, but ${missing.join(' and ')}.`
        : undefined,
  };
}

/** Canonical URLs are https and have `www.` stripped; claims() covers all of them. */
function withoutWww(url: string): boolean {
  try {
    return !new URL(url).hostname.startsWith('www.');
  } catch {
    return false;
  }
}

function withWww(url: string): string | null {
  try {
    const u = new URL(url);
    u.hostname = `www.${u.hostname}`;
    return u.toString();
  } catch {
    return null;
  }
}

export const researchDbResolver: Resolver = {
  name: 'research-db',

  // Broadly true by design: the corpus spans many domains, so almost any URL
  // is worth one local request before the networked resolvers are paid for.
  claims(canonicalUrl: string): boolean {
    return /^https?:\/\//.test(canonicalUrl);
  },

  async resolve(canonicalUrl: string, ctx: ResolverContext): Promise<ResolveResult | null> {
    const result = await attempt(canonicalUrl, ctx);
    if (result) return result;

    if (withoutWww(canonicalUrl)) {
      const www = withWww(canonicalUrl);
      if (www) return attempt(www, ctx);
    }
    return null;
  },
};
