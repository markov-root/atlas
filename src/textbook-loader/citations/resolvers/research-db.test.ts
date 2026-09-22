/**
 * Tests for the research-database resolver.
 *
 * AC-1 (task:0027): no live network and no live corpus access. Every request
 * goes to a stub `fetch` injected through `ResolverContext`, whose bodies are
 * the real service responses recorded verbatim into `fixtures/` — including
 * the `www.` fallback shapes, so the recorded behaviour and the tested
 * behaviour cannot drift apart.
 *
 * `research-db-miss.json` and `research-db-www-fallback.json` were recorded
 * from the same request: the first is the 404 the live service returns for
 * `https://anthropic.com/research/alignment-faking` (the non-`www` spelling
 * our canonicalization produces), the second the record found by the `www.`
 * retry. Both spellings hit the exact-match URL index; this pairing is the
 * measured case (27 of 987 cited URLs) the fallback exists to recover.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ResolverContext } from './types.js';
import { researchDbResolver } from './research-db.js';

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

/** A Response whose body is a recorded fixture, served from the test. */
function fixtureResponse(name: string, status = 200): Response {
  return new Response(fixture(name), { status, headers: { 'content-type': 'application/json' } });
}

function ctxWith(
  fetchImpl: (input: string, init?: RequestInit) => Promise<Response>,
): ResolverContext {
  return {
    fetch: fetchImpl as unknown as typeof globalThis.fetch,
    userAgent: 'atlas-citations/test',
    throttle: async () => {},
  };
}

const ANTHROPIC_URL = 'https://anthropic.com/research/alignment-faking';
const ARXIV_URL = 'https://arxiv.org/abs/2408.08926';

describe('researchDbResolver.claims', () => {
  // Broad by design: the corpus holds more than lab blogs, so claims() must
  // not pre-filter by domain. Its only job is to keep non-URLs out.
  it('claims any http(s) URL regardless of domain', () => {
    expect(researchDbResolver.claims('https://arxiv.org/abs/2408.08926')).toBe(true);
    expect(researchDbResolver.claims('https://ibm.com/history/deep-blue')).toBe(true);
  });

  it('declines URLs that are not http(s)', () => {
    expect(researchDbResolver.claims('mailto:author@example.org')).toBe(false);
    expect(researchDbResolver.claims('ftp://files.example.org/paper.pdf')).toBe(false);
    expect(researchDbResolver.claims('not a url')).toBe(false);
  });
});

describe('researchDbResolver.resolve', () => {
  it('maps a hit into CSL fields with the canonical URL kept as identity', async () => {
    const ctx = ctxWith(() => Promise.resolve(fixtureResponse('research-db-hit.json')));
    const result = await researchDbResolver.resolve(ARXIV_URL, ctx);

    expect(result).not.toBeNull();
    expect(result?.source).toBe('research-db');
    expect(result?.fields.title).toBe(
      'Cybench: A Framework for Evaluating Cybersecurity Capabilities and Risks of Language Models',
    );
    // Captured bylines stay literal: splitting "Andy K. Zhang" into
    // family="Zhang", given="Andy K." would be a guess, not a fact.
    expect(result?.fields.author?.length).toBe(27);
    expect(result?.fields.author?.slice(0, 2)).toEqual([
      { literal: 'Andy K. Zhang' },
      { literal: 'Neil Perry' },
    ]);
    expect(result?.fields.issued).toEqual({ 'date-parts': [[2024, 8, 15]] });
    expect(result?.fields.type).toBe('article');
    expect(
      result?.fields.abstract?.startsWith('Language Model (LM) agents for cybersecurity'),
    ).toBe(true);
    // The corpus spelling must not become the entry key — identity is the
    // canonical URL the store already holds (task:0021 D1).
    expect(result?.fields.URL).toBeUndefined();
  });

  it('widens admission scope with include_unreviewed=true on every request', async () => {
    const requested: string[] = [];
    const ctx = ctxWith((url) => {
      requested.push(String(url));
      return Promise.resolve(fixtureResponse('research-db-hit-unreviewed.json'));
    });
    const result = await researchDbResolver.resolve('https://arxiv.org/abs/2312.06942', ctx);

    // The corpus defaults to `admitted`; without the flag, records like this
    // one (an unreviewed arXiv capture) resolve to nothing and the miss is
    // silent. This test failed against the live service before the flag was
    // added — do not "simplify" it away.
    expect(result?.fields.title).toBe(
      'AI Control: Improving Safety Despite Intentional Subversion',
    );
    expect(requested.every((u) => u.includes('include_unreviewed=true'))).toBe(true);
  });

  it('derives the CSL type from source_type, and leaves unmapped types alone', async () => {
    const substack = fixture('research-db-hit-unreviewed.json').replace(
      '"source_type":"arxiv"',
      '"source_type":"substack"',
    );
    const ctx = ctxWith(() => Promise.resolve(new Response(substack, { status: 200 })));
    const result = await researchDbResolver.resolve('https://example.substack.com/p/x', ctx);
    expect(result?.fields.type).toBe('post-weblog');

    // An unmapped source_type (this fixture's real value is "arxiv") sets no
    // type: the store's inferCslType already chose one from the URL, and an
    // org label is not evidence to overwrite it with.
    const unmapped = fixture('research-db-hit-unreviewed.json').replace(
      '"source_type":"arxiv"',
      '"source_type":"govai"',
    );
    const ctx2 = ctxWith(() => Promise.resolve(new Response(unmapped, { status: 200 })));
    const result2 = await researchDbResolver.resolve('https://arxiv.org/abs/2312.06942', ctx2);
    expect(result2?.fields.type).toBeUndefined();
  });

  it('marks a record with no publication date with a note instead of inventing one', async () => {
    // Real recorded shape: a deepmind model card whose publication_date is null.
    const body = fixture('research-db-hit.json').replace(
      '"publication_date":"2024-08-15T17:23:10Z"',
      '"publication_date":null',
    );
    const ctx = ctxWith(() => Promise.resolve(new Response(body, { status: 200 })));
    const result = await researchDbResolver.resolve(ARXIV_URL, ctx);

    expect(result?.fields.issued).toBeUndefined();
    expect(result?.note).toBe('Research-database record found, but no publication date.');
  });

  it('drops author entries with no label and keeps the labelled ones', async () => {
    // The www-fallback fixture's second author is a resolved organisation:
    // `{kind: "organisation", label: null, resolved: true}`. A label-less
    // author is not a name; stringifying "null" here was a real failure mode
    // of the naive mapping.
    const ctx = ctxWith(() => Promise.resolve(fixtureResponse('research-db-www-fallback.json')));
    const result = await researchDbResolver.resolve(ANTHROPIC_URL, ctx);

    expect(result?.fields.author).toEqual([{ literal: 'Anthropic' }]);
    expect(result?.fields.title).toBe('Alignment faking in large language models');
    expect(result?.fields.issued).toEqual({ 'date-parts': [[2024, 12, 18]] });
  });

  it('retries a miss once with www. inserted and reports the record the retry finds', async () => {
    const requested: string[] = [];
    const ctx = ctxWith((url) => {
      requested.push(String(url));
      return Promise.resolve(
        requested.length === 1
          ? fixtureResponse('research-db-miss.json', 404)
          : fixtureResponse('research-db-www-fallback.json'),
      );
    });
    const result = await researchDbResolver.resolve(ANTHROPIC_URL, ctx);

    // The corpus stores scraped URLs verbatim; ~39% carry www. that our
    // canonical form drops. Without the retry those records are unreachable
    // (measured: 27 of 987 cited URLs), so the second request is load-bearing.
    expect(requested).toHaveLength(2);
    expect(requested[0]).toContain(encodeURIComponent(ANTHROPIC_URL));
    expect(requested[1]).toContain(
      encodeURIComponent('https://www.anthropic.com/research/alignment-faking'),
    );
    expect(result?.fields.title).toBe('Alignment faking in large language models');
  });

  it('returns null for a miss after both spellings, making exactly two requests', async () => {
    const requested: string[] = [];
    const ctx = ctxWith((url) => {
      requested.push(String(url));
      return Promise.resolve(fixtureResponse('research-db-miss.json', 404));
    });
    const result = await researchDbResolver.resolve('https://example.org/never-held', ctx);

    expect(result).toBeNull();
    expect(requested).toHaveLength(2);
  });

  it('returns null for a malformed body rather than throwing', async () => {
    // Recorded shape: a proxy error page where JSON was expected.
    const html = '<html><body><h1>502 Bad Gateway</h1></body></html>';
    const ctx = ctxWith(() => Promise.resolve(new Response(html, { status: 200 })));
    await expect(researchDbResolver.resolve(ARXIV_URL, ctx)).resolves.toBeNull();
  });

  it('returns null when the service is unreachable (AC-6), without throwing', async () => {
    const ctx = ctxWith(() => Promise.reject(new TypeError('fetch failed: ECONNREFUSED')));
    // The whole run of 948 URLs passes through this resolver; an exception
    // here would abort it. This assertion is the heart of AC-6.
    await expect(researchDbResolver.resolve(ARXIV_URL, ctx)).resolves.toBeNull();
  });

  it('returns null on a server error status', async () => {
    const ctx = ctxWith(() => Promise.resolve(new Response('overloaded', { status: 503 })));
    await expect(researchDbResolver.resolve(ARXIV_URL, ctx)).resolves.toBeNull();
  });

  it('identifies itself in the User-Agent header (AC-5)', async () => {
    const headers: Array<Record<string, string>> = [];
    const ctx = ctxWith((_url, init) => {
      headers.push((init?.headers ?? {}) as Record<string, string>);
      return Promise.resolve(fixtureResponse('research-db-hit.json'));
    });
    await researchDbResolver.resolve(ARXIV_URL, ctx);
    expect(headers[0]['User-Agent']).toBe('atlas-citations/test');
  });
});
