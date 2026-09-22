import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ResolverContext } from './types';
import { crossrefResolver } from './crossref';

const work = JSON.parse(
  readFileSync(new URL('./web-fixtures/crossref-alphafold.json', import.meta.url), 'utf8'),
);

/**
 * A context whose fetch answers every URL with the given response, or throws
 * when the resolver should see an unreachable service.
 */
function ctx(response: Response | Error, seen: { throttle: number } = { throttle: 0 }) {
  return {
    fetch: () => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)),
    userAgent: 'AI-Safety-Atlas/0.1 (https://github.com/markov/atlas; test)',
    throttle: () => {
      seen.throttle += 1;
      return Promise.resolve();
    },
  } satisfies ResolverContext;
}

function ok(body: string, contentType = 'application/json') {
  return new Response(body, { status: 200, headers: { 'content-type': contentType } });
}

describe('crossref.claims', () => {
  it('claims canonical DOI URLs and nothing else', () => {
    expect(crossrefResolver.claims('https://doi.org/10.1038/s41586-021-03819-2')).toBe(true);
    expect(crossrefResolver.claims('https://arxiv.org/abs/1911.01547')).toBe(false);
    expect(crossrefResolver.claims('https://www.youtube.com/watch?v=aircAruvnKk')).toBe(false);
    expect(crossrefResolver.claims('https://www.lesswrong.com/posts/x')).toBe(false);
  });
});

describe('crossref.resolve', () => {
  it('maps a real recorded Crossref response to CSL fields', async () => {
    const result = await crossrefResolver.resolve(
      'https://doi.org/10.1038/s41586-021-03819-2',
      ctx(ok(JSON.stringify(work))),
    );
    expect(result?.source).toBe('crossref');
    // Spot-check the author list rather than restating all 15 names — the
    // pass-through mapping is per-element, one wrong element means the mapping
    // is wrong everywhere.
    expect(result?.fields).toMatchObject({
      title: 'Highly accurate protein structure prediction with AlphaFold',
      DOI: '10.1038/s41586-021-03819-2',
      URL: 'https://doi.org/10.1038/s41586-021-03819-2',
      'container-title': 'Nature',
      type: 'article-journal',
      issued: { 'date-parts': [[2021, 7, 15]] },
    });
    expect(result?.fields.author?.slice(0, 4)).toEqual([
      { family: 'Jumper', given: 'John' },
      { family: 'Evans', given: 'Richard' },
      { family: 'Pritzel', given: 'Alexander' },
      { family: 'Green', given: 'Tim' },
    ]);
    expect(result?.fields.author).toHaveLength(34);
  });

  it('returns null on 404, a normal outcome for a bad DOI', async () => {
    const result = await crossrefResolver.resolve(
      'https://doi.org/10.9999/nope',
      ctx(new Response('Not found', { status: 404 })),
    );
    expect(result).toBeNull();
  });

  it('returns null on a malformed body rather than throwing', async () => {
    const result = await crossrefResolver.resolve(
      'https://doi.org/10.1038/s41586-021-03819-2',
      ctx(ok('<html>gateway timeout page</html>')),
    );
    expect(result).toBeNull();
  });

  // task:0021 D4 warn-never-block: an unreachable service is a decline, not a
  // crash. Nobody may "simplify" this into a rethrow — the bibliography build
  // must survive Crossref being down.
  it('returns null when fetch rejects (service unreachable)', async () => {
    const result = await crossrefResolver.resolve(
      'https://doi.org/10.1038/s41586-021-03819-2',
      ctx(new Error('ENOTFOUND')),
    );
    expect(result).toBeNull();
  });

  it('throttles and identifies itself on every request', async () => {
    const seen = { throttle: 0 };
    await crossrefResolver.resolve(
      'https://doi.org/10.1038/s41586-021-03819-2',
      ctx(ok(JSON.stringify(work)), seen),
    );
    expect(seen.throttle).toBe(1);
  });
});
