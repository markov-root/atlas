/**
 * Tests for the arXiv resolver.
 *
 * AC-1 (task:0027): no live network. Every request goes to a stub `fetch`
 * injected through `ResolverContext`, whose bodies are real API responses
 * recorded verbatim into `fixtures/` — including the two 200-shaped failure
 * modes (empty feed, error entry) that would otherwise fabricate an entry.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ResolverContext } from './types.js';
import { arxivResolver, arxivIdFromUrl } from './arxiv.js';

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

function ctxWith(fetchImpl: (input: string, init?: RequestInit) => Promise<Response>): {
  ctx: ResolverContext;
  throttleCount: () => number;
} {
  let throttled = 0;
  return {
    ctx: {
      fetch: fetchImpl as unknown as typeof globalThis.fetch,
      userAgent: 'atlas-citations/test',
      throttle: async () => {
        throttled += 1;
      },
    },
    throttleCount: () => throttled,
  };
}

const MM_VID_URL = 'https://arxiv.org/abs/2310.19773';
const DOI_PAPER_URL = 'https://arxiv.org/abs/2004.13678';

describe('arxivIdFromUrl', () => {
  it('extracts the id from a canonical abs URL', () => {
    expect(arxivIdFromUrl('https://arxiv.org/abs/2310.19773')).toBe('2310.19773');
    // Legacy pre-2007 ids are still abs URLs; the API accepts them.
    expect(arxivIdFromUrl('https://arxiv.org/abs/cs/0301012')).toBe('cs/0301012');
    expect(arxivIdFromUrl('https://arxiv.org/abs/0712.3329')).toBe('0712.3329');
  });

  it('declines every non-abs URL form — canonicalization owns those variants', () => {
    // /pdf, /html and version suffixes are collapsed before a resolver ever
    // sees the URL (canonical-url.ts), so a resolver that re-handled them
    // would be silently dead code kept alive by tests that never fire.
    expect(arxivIdFromUrl('https://arxiv.org/pdf/2310.19773')).toBeNull();
    expect(arxivIdFromUrl('https://arxiv.org/html/2310.19773v1')).toBeNull();
    expect(arxivIdFromUrl('https://arxiv.org/list/cs.AI/recent')).toBeNull();
    expect(arxivIdFromUrl('https://example.org/abs/2310.19773')).toBeNull();
  });
});

describe('arxivResolver.claims', () => {
  it('claims exactly the canonical arXiv abs URLs', () => {
    expect(arxivResolver.claims('https://arxiv.org/abs/2310.19773')).toBe(true);
    expect(arxivResolver.claims('https://arxiv.org/abs/cs/0301012')).toBe(true);
    expect(arxivResolver.claims('https://arxiv.org/pdf/2310.19773')).toBe(false);
    expect(arxivResolver.claims('https://doi.org/10.1103/PhysRevB.102.205308')).toBe(false);
  });
});

describe('arxivResolver.resolve', () => {
  it('maps an Atom entry into CSL fields', async () => {
    const { ctx, throttleCount } = ctxWith(() =>
      Promise.resolve(new Response(fixture('arxiv-entry.xml'))),
    );
    const result = await arxivResolver.resolve(MM_VID_URL, ctx);

    expect(result).not.toBeNull();
    expect(result?.source).toBe('arxiv');
    expect(result?.fields.type).toBe('article');
    expect(result?.fields.title).toBe('MM-VID: Advancing Video Understanding with GPT-4V(ision)');
    // Last-space split: "Kevin Lin" → given/family, in document order.
    expect(result?.fields.author?.slice(0, 3)).toEqual([
      { given: 'Kevin', family: 'Lin' },
      { given: 'Faisal', family: 'Ahmed' },
      { given: 'Linjie', family: 'Li' },
    ]);
    expect(result?.fields.issued).toEqual({ 'date-parts': [[2023, 10, 30]] });
    expect(result?.fields.abstract?.startsWith('We present MM-VID')).toBe(true);
    expect(result?.fields.URL).toBe(MM_VID_URL);
  });

  it('keeps the summary that wraps across feed lines readable', async () => {
    // Real feed layout: <summary> and <title> content can wrap and indent.
    // Joining it verbatim put hard newlines into the rendered bibliography.
    const wrapped = fixture('arxiv-entry.xml').replace(
      /We present MM-VID, an integrated system that harnesses/,
      'We present MM-VID, an integrated system\n        that harnesses',
    );
    const { ctx } = ctxWith(() => Promise.resolve(new Response(wrapped)));
    const result = await arxivResolver.resolve(MM_VID_URL, ctx);
    expect(result?.fields.abstract).toContain('system that harnesses');
    expect(result?.fields.abstract).not.toMatch(/\n/);
  });

  it('decodes XML entities and keeps single-word author names literal', async () => {
    const { ctx } = ctxWith(() =>
      Promise.resolve(new Response(fixture('arxiv-entry-entities.xml'))),
    );
    const result = await arxivResolver.resolve('https://arxiv.org/abs/0805.3478', ctx);

    expect(result?.fields.title).toBe('Collimator R&D');
    // "arXiv api core" style single-word names have no given/family split;
    // forcing one would invent an empty `given`.
    const authors = (result?.fields.author ?? []) as Array<Record<string, string>>;
    for (const author of authors) expect(author.literal ?? author.family).toBeTruthy();
  });

  it('maps the published DOI when the record carries one', async () => {
    const { ctx } = ctxWith(() => Promise.resolve(new Response(fixture('arxiv-entry-doi.xml'))));
    const result = await arxivResolver.resolve(DOI_PAPER_URL, ctx);

    expect(result?.fields.DOI).toBe('10.1103/PhysRevB.102.205308');
    // No DOI → no field, rather than an empty string: an entry with a
    // half-written DOI is worse than one without it.
    const { ctx: ctx2 } = ctxWith(() => Promise.resolve(new Response(fixture('arxiv-entry.xml'))));
    const result2 = await arxivResolver.resolve(MM_VID_URL, ctx2);
    expect(result2?.fields.DOI).toBeUndefined();
  });

  it('returns null for an empty feed (nonexistent id)', async () => {
    // Recorded: HTTP 200, totalResults 0, no <entry>. The tempting failure is
    // treating "no entry" as an empty result object.
    const { ctx } = ctxWith(() => Promise.resolve(new Response(fixture('arxiv-empty.xml'))));
    await expect(
      arxivResolver.resolve('https://arxiv.org/abs/9999.99999', ctx),
    ).resolves.toBeNull();
  });

  it('returns null for the API error entry instead of citing it', async () => {
    // Recorded: a malformed id still returns HTTP 200 with totalResults 1 —
    // and that one entry is titled "Error", authored by "arXiv api core".
    // Mapping it produced a bibliography entry of "Error (arXiv api core)".
    // Detected by the entry's error id, not its title, so a wording change
    // cannot sneak it through.
    const { ctx } = ctxWith(() => Promise.resolve(new Response(fixture('arxiv-error-entry.xml'))));
    await expect(arxivResolver.resolve('https://arxiv.org/abs/notanid', ctx)).resolves.toBeNull();
  });

  it('returns null for a malformed body rather than throwing', async () => {
    // Recorded shape: an HTML error page where Atom was expected.
    const html = '<html><head><title>upstream error</title></head><body></body></html>';
    const { ctx } = ctxWith(() => Promise.resolve(new Response(html)));
    await expect(arxivResolver.resolve(MM_VID_URL, ctx)).resolves.toBeNull();
  });

  it('returns null when the API is unreachable, without throwing', async () => {
    const { ctx } = ctxWith(() => Promise.reject(new TypeError('fetch failed: DNS failure')));
    // 347 sources route through this resolver; one network hiccup must not
    // abort the run (resolver contract rule 2).
    await expect(arxivResolver.resolve(MM_VID_URL, ctx)).resolves.toBeNull();
  });

  it('returns null on a non-200 status', async () => {
    const { ctx } = ctxWith(() => Promise.resolve(new Response('rate limited', { status: 503 })));
    await expect(arxivResolver.resolve(MM_VID_URL, ctx)).resolves.toBeNull();
  });

  it('throttles before the request and identifies the project (AC-5)', async () => {
    const calls: Array<{ headers?: Record<string, string> }> = [];
    const { ctx, throttleCount } = ctxWith((_url, init) => {
      calls.push({ headers: init?.headers as Record<string, string> });
      return Promise.resolve(new Response(fixture('arxiv-entry.xml')));
    });
    await arxivResolver.resolve(MM_VID_URL, ctx);

    expect(throttleCount()).toBe(1);
    expect(calls[0]?.headers?.['User-Agent']).toBe('atlas-citations/test');
  });
});
