/**
 * The resolver contract — bank B8 of `task:0021`, per `task:0027`.
 *
 * A resolver turns a canonical URL into CSL fields, or declines. Five exist:
 * the local research-database corpus, arXiv, Crossref, oEmbed and Open Graph.
 * They are independent of one another; this file is the only thing they share,
 * which is what lets them be written in parallel.
 *
 * Three rules the interface enforces by shape rather than by convention:
 *
 * 1. **Declining is normal, not an error.** `claims()` is how a resolver says a
 *    URL is not its business. Returning null from `resolve()` says it tried and
 *    found nothing. Neither is a failure, and neither should log alarm.
 *
 * 2. **A resolver never throws for an unreachable service.** `task:0021` D4 is
 *    warn-never-block, and `task:0027` AC-6 requires the bibliography to come
 *    out identical when the research-database service is down. A resolver that
 *    throws on a network error would make an accelerator into a dependency.
 *    Catch, return null, and record the reason in `ResolveResult.note`.
 *
 * 3. **Partial metadata is worth returning.** An entry with a title and no
 *    author beats no entry. Return what was found.
 */
import type { CslItem } from '../store';

export type ResolveResult = {
  /** CSL fields discovered. Partial by design — merged over the existing item. */
  fields: Partial<CslItem>;
  /** Resolver name, stored as the entry's `resolvedBy`. */
  source: string;
  /** Optional human-readable note, e.g. why only partial data was found. */
  note?: string;
};

export type Resolver = {
  /** Stable identifier, e.g. 'arxiv'. Written into the store as `resolvedBy`. */
  name: string;

  /**
   * Whether this resolver handles the URL at all. Pure and offline: it must
   * decide from the URL alone, so the runner can skip resolvers without paying
   * a request to find out.
   */
  claims(canonicalUrl: string): boolean;

  /**
   * Attempt resolution. Returns null when nothing was found, the service was
   * unreachable, or the response was unusable. **Must not throw.**
   */
  resolve(canonicalUrl: string, ctx: ResolverContext): Promise<ResolveResult | null>;
};

export type ResolverContext = {
  /**
   * Fetch, injected rather than imported so tests run against fixtures with no
   * network. `task:0027` AC-1 requires the suite to make no live request.
   */
  fetch: typeof globalThis.fetch;
  /**
   * Identifies this project to the services it queries. `task:0027` AC-5 — an
   * anonymous scraper hammering Crossref is how a project gets blocked, and
   * these are other people's free infrastructure.
   */
  userAgent: string;
  /** Called before each outbound request so the runner can rate-limit. */
  throttle(): Promise<void>;
};

/** The order resolvers are tried. Local and free first, networked after. */
export const RESOLVER_ORDER = [
  'research-db',
  'arxiv',
  'crossref',
  'scholar-meta',
  'oembed',
  'opengraph',
] as const;

/**
 * First non-null result, trying only resolvers that claim the URL.
 *
 * Order matters and is fixed by `RESOLVER_ORDER`: the local corpus answers
 * roughly a quarter of this project's URLs with no network call at all, so
 * asking it first is free. A resolver that throws despite rule 2 is caught here
 * and treated as a decline — one misbehaving resolver must not abort the run.
 */
export async function resolveWith(
  resolvers: Resolver[],
  canonicalUrl: string,
  ctx: ResolverContext,
): Promise<ResolveResult | null> {
  const byName = new Map(resolvers.map((r) => [r.name, r]));
  const ordered = [
    ...RESOLVER_ORDER.map((n) => byName.get(n)).filter((r): r is Resolver => !!r),
    ...resolvers.filter((r) => !RESOLVER_ORDER.includes(r.name as never)),
  ];

  for (const resolver of ordered) {
    if (!resolver.claims(canonicalUrl)) continue;
    try {
      const result = await resolver.resolve(canonicalUrl, ctx);
      if (result) return result;
    } catch {
      // Rule 2 says resolvers do not throw; this is the backstop for when one
      // does anyway. Swallowed deliberately — a single bad resolver must not
      // take down a run over 948 URLs.
      continue;
    }
  }
  return null;
}
