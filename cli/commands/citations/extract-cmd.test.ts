import { describe, it, expect } from 'vitest';
import { extractEntries, nextStore, STORE_PATH } from './extract-cmd';
import { parseStore, serializeStore, type Store, type StoreEntry } from '../../../src/textbook-loader/citations/store';
import type { Chapter, Section } from '../../../src/textbook-loader/index';
import type { Node } from '../../../src/textbook-loader/transformer';

const link = (href: string, content: string): Node => ({
  name: 'Link',
  attributes: { href, content },
  children: [],
});

const para = (...children: Node[]): Node => ({ name: 'Paragraph', attributes: {}, children });

function section(number: number, title: string, nodes: Node[]): Section {
  return {
    chapterNumber: 1,
    number,
    title,
    slug: title.toLowerCase(),
    description: '',
    toc: [],
    nodes,
    footnotes: [],
    readingTimeInSeconds: 0,
    prevSection: null,
    nextSection: null,
  } as Section;
}

function chapter(number: number, title: string, sections: Section[]): Chapter {
  return { number, title, slug: title.toLowerCase(), sections } as Chapter;
}

const ch = chapter(1, 'Capabilities', [
  section(1, 'Intro', [para(link('https://arxiv.org/abs/1804.07461', 'Wang et al., 2018'))]),
  section(2, 'Benchmarks', [
    para(link('https://arxiv.org/abs/1804.07461', 'Wang et al, 2018')),
    para(link('https://example.org/guide', 'available here')),
  ]),
]);

describe('extractEntries', () => {
  it('builds one entry per canonical URL from anchor text alone', () => {
    const entries = extractEntries([ch]);
    const store = nextStore({}, entries);
    // 'available here' is a content link, not a citation — no entry for it.
    expect(Object.keys(store)).toEqual(['https://arxiv.org/abs/1804.07461']);
    expect(store['https://arxiv.org/abs/1804.07461'].item.author).toEqual([
      { literal: 'Wang et al' },
    ]);
    expect(store['https://arxiv.org/abs/1804.07461'].resolvedBy).toBe('anchor');
  });

  it('records both anchor spellings when one source is cited two ways', () => {
    const store = nextStore({}, extractEntries([ch]));
    // The report flags inconsistent spelling from this list, so dropping a
    // spelling here would silently weaken it.
    expect(store['https://arxiv.org/abs/1804.07461'].anchors).toEqual([
      'Wang et al, 2018',
      'Wang et al., 2018',
    ]);
  });

  it('gives content links no entry — they are prose, not citations', () => {
    const store = nextStore({}, extractEntries([ch]));
    expect(store['https://example.org/guide']).toBeUndefined();
  });
});

describe('nextStore idempotence (task:0026 AC-1)', () => {
  it('re-extracting from the serialized store leaves the file byte-identical', () => {
    // This is the second run, minus the filesystem: feed the parsed output of
    // run one back through the same extraction and compare bytes. Any drift —
    // anchor duplication, key reordering, YAML quoting changes — shows here.
    const text1 = serializeStore(nextStore({}, extractEntries([ch])));
    const reextracted = nextStore(parseStore(text1), extractEntries([ch]));
    expect(serializeStore(reextracted)).toBe(text1);
  });

  it('never clobbers resolved metadata on re-extraction', () => {
    // resolve (task:0027) is expensive; extract runs often and cheaply. If
    // extraction overwrote resolver output, every re-run would throw that
    // work away — which is why mergeEntry, not a fresh write, owns this path.
    const first: Store = nextStore({}, extractEntries([ch]));
    const key = 'https://arxiv.org/abs/1804.07461';
    const resolved: StoreEntry = {
      ...first[key],
      item: { ...first[key].item, title: 'On the Measure of Intelligence', abstract: 'Found it.' },
      resolvedBy: 'arxiv',
    };
    const merged = nextStore({ [key]: resolved }, extractEntries([ch]));
    expect(merged[key].item.title).toBe('On the Measure of Intelligence');
    expect(merged[key].item.abstract).toBe('Found it.');
    expect(merged[key].resolvedBy).toBe('arxiv');
    expect(merged[key].anchors).toEqual(['Wang et al, 2018', 'Wang et al., 2018']);
  });
});

describe('store location', () => {
  it('lives under data/citations/, not anywhere derived from cwd', () => {
    // The store is committed; a path that moved with the invoking directory
    // would fork the bibliography.
    expect(STORE_PATH).toBe('data/citations/sources.yaml');
  });
});