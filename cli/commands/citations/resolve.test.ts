import { describe, it, expect } from 'vitest';
import { unresolvedKeys, applyResolution } from './resolve';
import {
  entryFromAnchor,
  type Store,
  type StoreEntry,
} from '../../../src/textbook-loader/citations/store';
import { splitAuthorYear } from '../../../src/textbook-loader/citations/author-year';
import {
  resolveWith,
  makeThrottledContext,
  type Resolver,
  type ResolverContext,
} from '../../../src/textbook-loader/citations/resolvers/index';

const anchor = (key: string, text: string): StoreEntry =>
  entryFromAnchor(key, text, splitAuthorYear(text));

const ctx: ResolverContext = {
  fetch: (() => {
    throw new Error('no network in tests');
  }) as unknown as typeof globalThis.fetch,
  userAgent: 'test',
  throttle: async () => {},
};

describe('unresolvedKeys — incremental resolution (task:0027 AC-2)', () => {
  it('selects only entries still holding anchor text', () => {
    const store: Store = {
      'https://a.org/x': anchor('https://a.org/x', 'A, 2020'),
      'https://b.org/y': { ...anchor('https://b.org/y', 'B, 2021'), resolvedBy: 'arxiv' },
    };
    expect(unresolvedKeys(store)).toEqual(['https://a.org/x']);
  });

  it('is empty once everything is resolved, so a second run does no work', () => {
    const store: Store = {
      'https://a.org/x': { ...anchor('https://a.org/x', 'A, 2020'), resolvedBy: 'crossref' },
    };
    expect(unresolvedKeys(store)).toEqual([]);
  });
});

describe('applyResolution', () => {
  it('lets resolved metadata win over anchor-derived guesses', () => {
    const e = anchor('https://arxiv.org/abs/1911.01547', 'Chollet, 2019');
    expect(e.item.title).toBe('Chollet, 2019');
    const out = applyResolution(
      e,
      { title: 'On the Measure of Intelligence', author: [{ family: 'Chollet', given: 'F.' }] },
      'arxiv',
    );
    expect(out.item.title).toBe('On the Measure of Intelligence');
    expect(out.resolvedBy).toBe('arxiv');
  });

  it('keeps fields the resolver did not return, so partial results still help', () => {
    const e = anchor('https://a.org/x', 'Smith, 2020');
    const out = applyResolution(e, { title: 'A Real Title' }, 'opengraph');
    // The resolver found no date; the anchor's year survives.
    expect(out.item.issued).toEqual({ 'date-parts': [[2020]] });
  });

  it('drops the unresolved note once an entry is resolved', () => {
    const e = anchor('https://a.org/x', 'Smith, 2020');
    expect(e.item.note).toMatch(/unresolved/i);
    expect(applyResolution(e, { title: 'T' }, 'opengraph').item.note).toBeUndefined();
  });

  it('never lets a resolver change an entry id — identity is the URL', () => {
    const e = anchor('https://a.org/x', 'Smith, 2020');
    const out = applyResolution(e, { id: 'https://evil.org/other', title: 'T' }, 'opengraph');
    expect(out.item.id).toBe('https://a.org/x');
  });

  it('preserves the observed anchor spellings', () => {
    const e = anchor('https://a.org/x', 'Smith, 2020');
    expect(applyResolution(e, { title: 'T' }, 'arxiv').anchors).toEqual(['Smith, 2020']);
  });
});

describe('resolveWith — ordering and failure isolation', () => {
  const stub = (name: string, claims: boolean, result: unknown): Resolver => ({
    name,
    claims: () => claims,
    resolve: async () => result as never,
  });

  it('prefers the local corpus over networked resolvers', async () => {
    const out = await resolveWith(
      [
        stub('arxiv', true, { fields: { title: 'from arxiv' }, source: 'arxiv' }),
        stub('research-db', true, { fields: { title: 'from corpus' }, source: 'research-db' }),
      ],
      'https://arxiv.org/abs/1',
      ctx,
    );
    expect(out?.source).toBe('research-db');
  });

  it('falls through when a resolver declines', async () => {
    const out = await resolveWith(
      [stub('research-db', true, null), stub('arxiv', true, { fields: {}, source: 'arxiv' })],
      'https://arxiv.org/abs/1',
      ctx,
    );
    expect(out?.source).toBe('arxiv');
  });

  it('skips resolvers that do not claim the URL, without calling them', async () => {
    let called = false;
    const nosy: Resolver = {
      name: 'crossref',
      claims: () => false,
      resolve: async () => {
        called = true;
        return null;
      },
    };
    await resolveWith([nosy], 'https://arxiv.org/abs/1', ctx);
    expect(called).toBe(false);
  });

  // One misbehaving resolver must not abort a run over ~950 URLs. The contract
  // says resolvers do not throw; this proves the backstop for when one does.
  it('treats a throwing resolver as a decline and carries on', async () => {
    const bad: Resolver = {
      name: 'research-db',
      claims: () => true,
      resolve: async () => {
        throw new Error('boom');
      },
    };
    const out = await resolveWith(
      [bad, stub('arxiv', true, { fields: { title: 'ok' }, source: 'arxiv' })],
      'https://arxiv.org/abs/1',
      ctx,
    );
    expect(out?.source).toBe('arxiv');
  });

  it('returns null when nothing resolves', async () => {
    expect(
      await resolveWith([stub('arxiv', true, null)], 'https://arxiv.org/abs/1', ctx),
    ).toBeNull();
  });
});

describe('makeThrottledContext (task:0027 AC-5)', () => {
  it('paces successive requests', async () => {
    const t = makeThrottledContext(40, 'ua');
    const start = Date.now();
    await t.throttle();
    await t.throttle();
    expect(Date.now() - start).toBeGreaterThanOrEqual(35);
  });

  it('carries the identifying user agent', () => {
    expect(makeThrottledContext(0, 'AISafetyAtlas/1.0').userAgent).toBe('AISafetyAtlas/1.0');
  });
});
