import { describe, it, expect } from 'vitest';
import {
  entryFromAnchor,
  mergeEntry,
  serializeStore,
  parseStore,
  upsertEntries,
  toCslJson,
  inferCslType,
  type Store,
  type StoreEntry,
} from './store';
import { splitAuthorYear } from './author-year';

const anchorEntry = (key: string, anchor: string): StoreEntry =>
  entryFromAnchor(key, anchor, splitAuthorYear(anchor));

describe('entryFromAnchor — a usable entry with no network (task:0025 AC-4)', () => {
  it('builds a CSL item from anchor text alone', () => {
    const e = anchorEntry('https://arxiv.org/abs/1911.01547', 'Chollet, 2019');
    expect(e.item).toMatchObject({
      id: 'https://arxiv.org/abs/1911.01547',
      type: 'article',
      URL: 'https://arxiv.org/abs/1911.01547',
      author: [{ literal: 'Chollet' }],
      issued: { 'date-parts': [[2019]] },
    });
    expect(e.resolvedBy).toBe('anchor');
  });

  // CSL has `literal` precisely so an unsplittable name stays honest. Guessing
  // family/given from "Giattino et al." would render confidently wrong in every
  // citation style.
  it('uses a literal name rather than inventing family/given', () => {
    const e = anchorEntry(
      'https://ourworldindata.org/artificial-intelligence',
      'Giattino et al., 2023',
    );
    expect(e.item.author).toEqual([{ literal: 'Giattino et al.' }]);
  });

  it('marks an unparseable anchor as unresolved instead of dropping it', () => {
    const e = anchorEntry('https://example.org/guide', 'available here');
    expect(e.item.author).toBeUndefined();
    expect(e.item.note).toMatch(/no author-year/i);
    expect(e.item.title).toBe('available here');
  });
});

describe('inferCslType', () => {
  it('distinguishes preprints, journals, blogs, video and pages', () => {
    expect(inferCslType('https://arxiv.org/abs/1911.01547')).toBe('article');
    expect(inferCslType('https://doi.org/10.1038/x')).toBe('article-journal');
    expect(inferCslType('https://www.youtube.com/watch?v=x')).toBe('motion_picture');
    expect(inferCslType('https://www.alignmentforum.org/posts/x')).toBe('post-weblog');
    expect(inferCslType('https://www.lesswrong.com/posts/x')).toBe('post-weblog');
    expect(inferCslType('https://epoch.ai/blog/x')).toBe('webpage');
    expect(inferCslType('not a url')).toBe('document');
  });
});

describe('round trip (task:0025 AC-4)', () => {
  it('survives serialize → parse unchanged', () => {
    const store: Store = {
      'https://arxiv.org/abs/1911.01547': anchorEntry(
        'https://arxiv.org/abs/1911.01547',
        'Chollet, 2019',
      ),
      'https://epoch.ai/blog/x': anchorEntry('https://epoch.ai/blog/x', 'Epoch, 2024'),
    };
    expect(parseStore(serializeStore(store))).toEqual(store);
  });

  it('is stable — serializing twice gives identical bytes', () => {
    const store: Store = { 'https://a.org/x': anchorEntry('https://a.org/x', 'A, 2020') };
    expect(serializeStore(store)).toBe(serializeStore(store));
  });

  it('sorts keys so diffs stay reviewable regardless of insertion order', () => {
    const a: Store = {
      'https://z.org/x': anchorEntry('https://z.org/x', 'Z, 2020'),
      'https://a.org/x': anchorEntry('https://a.org/x', 'A, 2020'),
    };
    const b: Store = {
      'https://a.org/x': anchorEntry('https://a.org/x', 'A, 2020'),
      'https://z.org/x': anchorEntry('https://z.org/x', 'Z, 2020'),
    };
    expect(serializeStore(a)).toBe(serializeStore(b));
  });

  it('reads an empty or comment-only file as an empty store', () => {
    expect(parseStore('')).toEqual({});
    expect(parseStore('# just a comment\n')).toEqual({});
  });

  it('writes a header a human can act on', () => {
    expect(serializeStore({})).toMatch(/atlas citations extract/);
  });
});

describe('mergeEntry — re-extraction must not destroy resolved metadata', () => {
  // The property that makes `extract` safe to run constantly while `resolve`
  // is slow and expensive (task:0027).
  it('keeps resolved metadata when re-extracted from an anchor', () => {
    const resolved: StoreEntry = {
      item: {
        id: 'https://arxiv.org/abs/1911.01547',
        type: 'article',
        title: 'On the Measure of Intelligence',
        author: [{ family: 'Chollet', given: 'François' }],
      },
      resolvedBy: 'arxiv',
      anchors: ['Chollet, 2019'],
    };
    const merged = mergeEntry(
      resolved,
      anchorEntry('https://arxiv.org/abs/1911.01547', 'Chollet 2019'),
    );
    expect(merged.item.title).toBe('On the Measure of Intelligence');
    expect(merged.resolvedBy).toBe('arxiv');
    // …but the newly-observed anchor spelling is still recorded.
    expect(merged.anchors).toEqual(['Chollet 2019', 'Chollet, 2019']);
  });

  it('does replace an unresolved entry with a fresh extraction', () => {
    const old = anchorEntry('https://a.org/x', 'A, 2020');
    const merged = mergeEntry(old, anchorEntry('https://a.org/x', 'A et al., 2020'));
    expect(merged.resolvedBy).toBe('anchor');
    expect(merged.anchors).toEqual(['A et al., 2020', 'A, 2020']);
  });
});

describe('upsertEntries and toCslJson', () => {
  it('accumulates anchors across repeated citation of one source', () => {
    let store: Store = {};
    store = upsertEntries(store, [
      ['https://a.org/x', anchorEntry('https://a.org/x', 'Smith, 2020')],
    ]);
    store = upsertEntries(store, [
      ['https://a.org/x', anchorEntry('https://a.org/x', 'Smith et al., 2020')],
    ]);
    expect(Object.keys(store)).toHaveLength(1);
    expect(store['https://a.org/x'].anchors).toEqual(['Smith et al., 2020', 'Smith, 2020']);
  });

  it('emits CSL-JSON as a sorted array of items', () => {
    const store = upsertEntries({}, [
      ['https://z.org/x', anchorEntry('https://z.org/x', 'Z, 2020')],
      ['https://a.org/x', anchorEntry('https://a.org/x', 'A, 2020')],
    ]);
    const json = toCslJson(store);
    expect(json.map((i) => i.id)).toEqual(['https://a.org/x', 'https://z.org/x']);
    // Every CSL item must carry an id and a type.
    for (const item of json) {
      expect(item.id).toBeTruthy();
      expect(item.type).toBeTruthy();
    }
  });
});
