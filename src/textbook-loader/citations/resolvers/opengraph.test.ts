import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ResolverContext } from './types';
import { opengraphResolver, MAX_OG_BYTES } from './opengraph';

const alignmentForum = readFileSync(
  new URL('./web-fixtures/og-alignment-forum.html', import.meta.url),
  'utf8',
);
const noMeta = readFileSync(
  new URL('./web-fixtures/og-no-meta-cifar.html', import.meta.url),
  'utf8',
);
const full = readFileSync(new URL('./web-fixtures/og-full.html', import.meta.url), 'utf8');

type Served = { bytes: number; requests: string[] };

function ctx(
  response: Response | Error,
  served: Served = { bytes: 0, requests: [] },
): ResolverContext {
  return {
    fetch: (input: RequestInfo | URL) => {
      served.requests.push(String(input));
      if (response instanceof Error) return Promise.reject(response);
      return Promise.resolve(response);
    },
    userAgent: 'AI-Safety-Atlas/0.1 (https://github.com/markov/atlas; test)',
    throttle: () => Promise.resolve(),
  };
}

function ok(body: string, contentType = 'text/html; charset=utf-8') {
  return new Response(body, { status: 200, headers: { 'content-type': contentType } });
}

/** A streamed body, tracking how many bytes a consumer actually pulled. */ describe('opengraph.claims', () => {
  it('claims any http(s) URL — it is the last resort', () => {
    expect(opengraphResolver.claims('https://www.cs.toronto.edu/~kriz/cifar.html')).toBe(true);
    expect(opengraphResolver.claims('http://example.com')).toBe(true);
    expect(opengraphResolver.claims('ftp://example.com/file')).toBe(false);
    expect(opengraphResolver.claims('not a url')).toBe(false);
  });
});

describe('opengraph.resolve', () => {
  it('maps og tags from a real recorded Alignment Forum page', async () => {
    // Real page, and deliberately partial: it has og:title and og:description
    // but NO og:site_name and NO article:published_time. That gap is the
    // normal case, and none of it may be filled by guessing.
    const result = await opengraphResolver.resolve(
      'https://www.alignmentforum.org/posts/B6CxEApaatATzown6/the-lesswrong-2022-review',
      ctx(ok(alignmentForum)),
    );
    expect(result?.source).toBe('opengraph');
    expect(result?.fields).toEqual({
      type: 'post-weblog',
      title: 'The LessWrong 2022 Review — AI Alignment Forum',
      abstract: expect.stringContaining('LessWrong review time'),
    });
    expect(result?.fields.issued).toBeUndefined();
    expect(result?.fields['container-title']).toBeUndefined();
  });

  it('maps container title and publication date when the page provides them', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.substack.com/p/why-ai-alignment-is-hard',
      ctx(ok(full)),
    );
    expect(result?.fields).toEqual({
      type: 'post-weblog',
      title: 'Why AI alignment is hard',
      'container-title': 'Example Substack',
      abstract: 'A short essay on specification gaming & inner misalignment.',
      issued: { 'date-parts': [[2023, 4, 1]] },
    });
  });

  it('falls back to <title> and says so in the note', async () => {
    // Real page (CIFAR-10, University of Toronto) with zero og: tags.
    const result = await opengraphResolver.resolve(
      'https://www.cs.toronto.edu/~kriz/cifar.html',
      ctx(ok(noMeta)),
    );
    expect(result?.fields.title).toBe('CIFAR-10 and CIFAR-100 datasets');
    expect(result?.note).toContain('<title>');
  });

  it('returns null for a page with neither og:title nor <title>', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.com/empty',
      ctx(ok('<html><head></head><body></body></html>')),
    );
    expect(result).toBeNull();
  });

  // Found against real pages: defcon.org titles carry &reg;, and an undecoded
  // entity in a citation title looks like a bug to every reader.
  it('decodes named and numeric HTML entities in titles', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.com/entities',
      ctx(ok('<html><head><title>DEF CON&reg; &#8212; Hacking</title></head><body></body></html>')),
    );
    expect(result?.fields.title).toBe('DEF CON® — Hacking');
  });

  it('returns null on 404', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.com/gone',
      ctx(new Response('', { status: 404 })),
    );
    expect(result).toBeNull();
  });

  it('returns null for a non-HTML content type', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.com/paper.pdf',
      ctx(ok('%PDF-1.4', 'application/pdf')),
    );
    expect(result).toBeNull();
  });

  it('returns null when fetch rejects (host unreachable)', async () => {
    const result = await opengraphResolver.resolve(
      'https://example.com/',
      ctx(new Error('ENETUNREACH')),
    );
    expect(result).toBeNull();
  });

  it('follows an http→https redirect and resolves the target', async () => {
    let calls = 0;
    const c: ResolverContext = {
      fetch: () => {
        calls += 1;
        return calls === 1
          ? Promise.resolve(
              new Response(null, {
                status: 301,
                headers: { location: 'https://example.com/moved' },
              }),
            )
          : Promise.resolve(ok(alignmentForum));
      },
      userAgent: 'test',
      throttle: () => Promise.resolve(),
    };
    const result = await opengraphResolver.resolve('http://example.com/moved', c);
    expect(result?.fields.title).toBe('The LessWrong 2022 Review — AI Alignment Forum');
  });

  it('refuses to follow a redirect to a non-http scheme', async () => {
    const result = await opengraphResolver.resolve(
      'http://example.com/file',
      ctx(
        new Response(null, {
          status: 302,
          headers: { location: 'ftp://example.com/file' },
        }),
      ),
    );
    expect(result).toBeNull();
  });

  it('gives up after too many redirect hops instead of looping forever', async () => {
    let calls = 0;
    const c: ResolverContext = {
      fetch: () => {
        calls += 1;
        return Promise.resolve(
          new Response(null, {
            status: 302,
            headers: { location: `https://example.com/hop${calls}` },
          }),
        );
      },
      userAgent: 'test',
      throttle: () => Promise.resolve(),
    };
    const result = await opengraphResolver.resolve('https://example.com/hop0', c);
    expect(result).toBeNull();
    expect(calls).toBeLessThanOrEqual(7); // MAX_REDIRECTS + 1 hops, plus slack
  });

  // Encodes the memory-safety requirement: the stream must be abandoned at the
  // cap, not fully buffered. A 1 MiB page with its og:title in the first kilobyte.
  it('stops reading an oversized body at the cap', async () => {
    const served: Served = { bytes: 0, requests: [] };
    const head = '<html><head><meta property="og:title" content="Found in the head"></head><body>';
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (served.bytes >= 1024 * 1024) {
          controller.close();
          return;
        }
        const size = Math.min(64 * 1024, 1024 * 1024 - served.bytes);
        served.bytes += size;
        const chunk = served.bytes <= 64 * 1024 ? head.padEnd(size, ' ') : 'x'.repeat(size);
        controller.enqueue(new TextEncoder().encode(chunk));
      },
    });
    const response = new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    const result = await opengraphResolver.resolve(
      'https://example.com/huge',
      ctx(response, served),
    );
    expect(result?.fields.title).toBe('Found in the head');
    // 1 MiB offered, at most cap + one chunk consumed. This is the guard
    // against one oversized page stalling (or OOMing) a 948-URL run.
    expect(served.bytes).toBeGreaterThan(MAX_OG_BYTES);
    expect(served.bytes).toBeLessThanOrEqual(MAX_OG_BYTES + 64 * 1024);
  });
});
