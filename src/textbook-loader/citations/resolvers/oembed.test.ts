import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ResolverContext } from './types';
import { oembedResolver } from './oembed';

const oembed = readFileSync(
  new URL('./web-fixtures/oembed-3blue1brown.json', import.meta.url),
  'utf8',
);

const VIDEO = 'https://www.youtube.com/watch?v=aircAruvnKk';

function ctx(response: Response | Error) {
  return {
    fetch: () => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)),
    userAgent: 'AI-Safety-Atlas/0.1 (https://github.com/markov/atlas; test)',
    throttle: () => Promise.resolve(),
  } satisfies ResolverContext;
}

function ok(body: string, contentType = 'application/json') {
  return new Response(body, { status: 200, headers: { 'content-type': contentType } });
}

describe('oembed.claims', () => {
  it('claims canonical YouTube watch URLs, including unavailable ids', () => {
    expect(oembedResolver.claims(VIDEO)).toBe(true);
    // youtu.be and mobile forms are canonicalized away before we see them, so
    // only the one canonical shape is ours.
    expect(oembedResolver.claims('https://youtu.be/aircAruvnKk')).toBe(false);
    expect(oembedResolver.claims('https://arxiv.org/abs/1911.01547')).toBe(false);
  });
});

describe('oembed.resolve', () => {
  it('maps a real recorded oEmbed response to a motion_picture entry', async () => {
    const result = await oembedResolver.resolve(VIDEO, ctx(ok(oembed)));
    expect(result?.source).toBe('oembed');
    expect(result?.fields).toEqual({
      type: 'motion_picture',
      title: 'But what is a neural network? | Deep learning chapter 1',
      author: [{ literal: '3Blue1Brown' }],
      'container-title': 'YouTube',
      URL: VIDEO,
    });
  });

  it('returns null for a deleted or private video (404)', async () => {
    const result = await oembedResolver.resolve(VIDEO, ctx(new Response('', { status: 404 })));
    expect(result).toBeNull();
  });

  it('returns null on a garbage body rather than throwing', async () => {
    const result = await oembedResolver.resolve(VIDEO, ctx(ok('<html>nope</html>')));
    expect(result).toBeNull();
  });

  it('returns null when fetch rejects (YouTube unreachable)', async () => {
    const result = await oembedResolver.resolve(VIDEO, ctx(new Error('ETIMEDOUT')));
    expect(result).toBeNull();
  });

  // The brief is explicit: oEmbed carries no publication date, and none may be
  // invented. A channel-creation year or upload guess would look authoritative
  // in every rendered citation.
  it('does not invent a publication date oEmbed does not supply', async () => {
    const result = await oembedResolver.resolve(VIDEO, ctx(ok(oembed)));
    expect(result?.fields.issued).toBeUndefined();
    expect(result?.note).toContain('does not provide a publication date');
  });
});
