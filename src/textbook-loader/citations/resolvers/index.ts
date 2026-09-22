/**
 * The resolver set, assembled in the order `RESOLVER_ORDER` defines.
 *
 * Kept separate from `types.ts` so the contract has no dependency on the
 * implementations — which is what let the five be written independently.
 */
import type { Resolver, ResolverContext } from './types';
import { researchDbResolver } from './research-db';
import { arxivResolver } from './arxiv';
import { crossrefResolver } from './crossref';
import { oembedResolver } from './oembed';
import { opengraphResolver } from './opengraph';
import { scholarMetaResolver } from './scholar-meta';

export { resolveWith, RESOLVER_ORDER } from './types';
export type { Resolver, ResolverContext, ResolveResult } from './types';

/**
 * All resolvers. Order here is cosmetic — `resolveWith` sorts by
 * `RESOLVER_ORDER`, so the local corpus is always tried before any network call.
 */
export const ALL_RESOLVERS: Resolver[] = [
  researchDbResolver,
  arxivResolver,
  crossrefResolver,
  scholarMetaResolver,
  oembedResolver,
  opengraphResolver,
];

/**
 * A context that paces outbound requests.
 *
 * `task:0027` AC-5. These are other people's free services: arXiv asks for
 * several seconds between requests, and Crossref's polite pool depends on a
 * contactable user agent. A 948-URL run that ignored both is how a project gets
 * its IP blocked — which would hurt every later run, not just the rude one.
 *
 * The delay is enforced between request *starts*, so a slow response does not
 * also pay the full delay afterwards.
 */
export function makeThrottledContext(
  minIntervalMs: number,
  userAgent: string,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch,
): ResolverContext {
  let last = 0;
  return {
    fetch: fetchImpl,
    userAgent,
    async throttle() {
      const now = Date.now();
      const wait = last + minIntervalMs - now;
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
    },
  };
}
