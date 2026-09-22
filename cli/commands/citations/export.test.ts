import { describe, it, expect } from 'vitest';
import {
  assignBibtexKeys,
  bibtexEntry,
  baseBibtexKey,
  serializeBibtex,
  serializeCslJson,
} from './export';
import { entryFromAnchor, type CslItem, type Store } from '../../../src/textbook-loader/citations/store';

const anchor = (url: string, text: string): Store =>
  ({
    [url]: entryFromAnchor(url, text, {
      author: text.split(',')[0],
      year: text.match(/\d{4}/)?.[0] ?? '2020',
    }),
  }) as Store;

const item = (over: Partial<CslItem>): CslItem => ({
  id: 'https://example.org/x',
  type: 'webpage',
  URL: 'https://example.org/x',
  ...over,
});

describe('baseBibtexKey — stable, readable, deterministic', () => {
  it('derives name, year and a title word from the entry', () => {
    const e = entryFromAnchor('https://example.org/perry', 'Perry, 2020', {
      author: 'Perry',
      year: '2020',
    });
    // Title here is the anchor text "Perry, 2020" — the word repeats the name,
    // and repeating it in the key helps nobody.
    expect(baseBibtexKey(e.item)).toBe('perry2020');
  });

  it('does not depend on what else is in the store', () => {
    // A counter-based disambiguator renumbers existing entries when a new one
    // lands between them, silently breaking every \cite an author has written.
    const a = anchor('https://example.org/a', 'Smith, 2020');
    const keysBefore = assignBibtexKeys(a);
    const withMore: Store = {
      ...a,
      'https://example.org/b': entryFromAnchor('https://example.org/b', 'Smith, 2020', {
        author: 'Smith',
        year: '2020',
      }),
    };
    const keysAfter = assignBibtexKeys(withMore);
    for (const [url, key] of keysBefore) expect(keysAfter.get(url)).toBe(key);
  });

  it('is the same on every call — no clock, no iteration order', () => {
    const e = entryFromAnchor('https://example.org/perry', 'Perry, 2020', {
      author: 'Perry',
      year: '2020',
    });
    expect(baseBibtexKey(e.item)).toBe(baseBibtexKey({ ...e.item, title: 'Perry, 2020' }));
  });
});

describe('assignBibtexKeys — collisions never collide', () => {
  it('gives two same-name-same-year sources distinct stable keys', () => {
    // Two different Anthropic 2024 pages is the real corpus case: same author
    // literal, same year, same anchor-derived title.
    const a = anchor('https://example.org/aaa', 'Anthropic, 2024');
    const b: Store = {
      ...a,
      'https://example.org/bbb': entryFromAnchor('https://example.org/bbb', 'Anthropic, 2024', {
        author: 'Anthropic',
        year: '2024',
      }),
    };
    const keys = assignBibtexKeys(b);
    expect(new Set(keys.values()).size).toBe(keys.size);
    // The suffix comes from the URL, so re-running re-derives it, and adding a
    // third entry cannot renumber these two.
    expect(keys.get('https://example.org/aaa')).toMatch(/^anthropic2024/);
  });

  it('keeps every key free of characters that need escaping', () => {
    const messy: Store = {
      'https://example.org/a%b#c_d$e': entryFromAnchor('https://example.org/a%b#c_d$e', 'A&B, 2020', {
        author: 'A&B',
        year: '2020',
      }),
    };
    for (const key of assignBibtexKeys(messy).values()) {
      expect(key).toMatch(/^[a-z0-9]+$/);
    }
  });
});

describe('serializeBibtex — imports without error (task:0026 AC-4)', () => {
  it('escapes the characters BibTeX treats structurally', () => {
    const store: Store = {
      'https://example.org/x': {
        ...entryFromAnchor('https://example.org/x', 'X, 2020', { author: 'X', year: '2020' }),
        item: item({ title: '100% of R&D & C# pay_$ {lots} \\ so_what' }),
      },
    };
    const bib = serializeBibtex(store);
    expect(bib).toContain('100\\% of R\\&D \\& C\\# pay\\_\\$ \\{lots\\} \\\\ so\\_what');
  });

  it('emits a CSL literal author braced whole, unparseable as First Last', () => {
    // Without the braces a reference manager splits "Giattino et al." into a
    // family "al." and a given "Giattino et" — confidently wrong in every style.
    //
    // It needs TWO brace pairs: the outer one delimits the field value, the
    // inner one protects the name. This assertion previously expected a single
    // pair, which is the form that actually gets split — the intent above was
    // right and the expectation encoded the bug.
    const store: Store = {
      'https://example.org/x': {
        ...entryFromAnchor('https://example.org/x', 'X, 2020', { author: 'X', year: '2020' }),
        item: item({ author: [{ literal: 'Giattino et al.' }] }),
      },
    };
    expect(serializeBibtex(store)).toContain('author = {{Giattino et al.}}');
  });

  it('maps CSL types onto the BibTeX types that carry their fields', () => {
    const store: Store = {
      'https://arxiv.org/abs/1911.01547': entryFromAnchor(
        'https://arxiv.org/abs/1911.01547',
        'Chollet, 2019',
        { author: 'Chollet', year: '2019' },
      ),
      'https://doi.org/10.1038/x': {
        resolvedBy: 'test',
        anchors: ['Nature, 2020'],
        item: item({
          id: 'https://doi.org/10.1038/x',
          type: 'article-journal',
          title: 'A journal paper',
          author: [{ literal: 'Nature' }],
          issued: { 'date-parts': [[2020]] },
          URL: 'https://doi.org/10.1038/x',
          'container-title': 'Nature',
        }),
      },
      'https://www.youtube.com/watch?v=x': {
        resolvedBy: 'test',
        anchors: ['Video, 2020'],
        item: item({
          id: 'https://www.youtube.com/watch?v=x',
          type: 'motion_picture',
          title: 'A talk',
          author: [{ literal: 'Video' }],
          issued: { 'date-parts': [[2020]] },
        }),
      },
    };
    const bib = serializeBibtex(store);
    expect(bib).toContain('@misc{chollet2019');
    // arXiv preprint: no journal to name, so the URL is howpublished.
    expect(bib).toContain('howpublished = {https://arxiv.org/abs/1911.01547}');
    expect(bib).toContain('@article{nature2020');
    expect(bib).toContain('journal = {Nature}');
    expect(bib).toContain('@misc{video2020');
  });

  it('carries the unresolved note through, so the .bib stays honest', () => {
    const bib = serializeBibtex(anchor('https://example.org/x', 'Chollet, 2019'));
    expect(bib).toContain('note = {Unresolved:');
  });

  it('is byte-stable across runs regardless of store insertion order', () => {
    const a = anchor('https://example.org/a', 'Alpha, 2020');
    const b: Store = {
      ...a,
      'https://example.org/b': entryFromAnchor('https://example.org/b', 'Beta, 2021', {
        author: 'Beta',
        year: '2021',
      }),
    };
    const reversed = {
      'https://example.org/b': b['https://example.org/b'],
      'https://example.org/a': b['https://example.org/a'],
    };
    expect(serializeBibtex(b)).toBe(serializeBibtex(reversed));
  });

  it('ends every field line with a comma, as BibTeX field separation requires', () => {
    // Caught for real: the first corpus export emitted `author = {...}` with
    // no trailing comma, which strict BibTeX parsers reject as a syntax error.
    const bib = serializeBibtex(anchor('https://example.org/x', 'Chollet, 2019'));
    const fieldLines = bib.split('\n').filter((l) => /^\s+\w+\s*=/.test(l));
    expect(fieldLines.length).toBeGreaterThan(0);
    for (const line of fieldLines) expect(line.endsWith(',')).toBe(true);
  });

  it('round-trips into itself: keys stay unique in the emitted file', () => {
    const two: Store = {
      ...anchor('https://example.org/a', 'Smith, 2020'),
      'https://example.org/b': entryFromAnchor('https://example.org/b', 'Smith, 2020', {
        author: 'Smith',
        year: '2020',
      }),
    };
    const keys = [...serializeBibtex(two).matchAll(/^@\w+\{([^,]+),$/gm)].map((m) => m[1]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('BibTeX author field structure', () => {
  const entry = (authors: unknown[]) =>
    serializeBibtex({
      'https://a.org/x': {
        item: { id: 'https://a.org/x', type: 'article', title: 'T', author: authors as never },
        resolvedBy: 'arxiv',
        anchors: [],
      },
    });

  // Regression: names were emitted as `{A} and {B}`, which closes the field
  // value at the first brace. Every author after the first was lost, and
  // strict parsers rejected the entry outright.
  it('wraps the whole field in one brace pair, not each name', () => {
    const bib = entry([
      { family: 'Hoffmann', given: 'Jordan' },
      { family: 'Borgeaud', given: 'Sebastian' },
    ]);
    expect(bib).toContain('author = {Hoffmann, Jordan and Borgeaud, Sebastian},');
    expect(bib).not.toContain('} and {');
  });

  // A braced structured name is treated by BibTeX as one unbreakable literal,
  // so "Hoffmann, Jordan" would render instead of "J. Hoffmann".
  it('leaves a structured name bare so BibTeX can split family from given', () => {
    expect(entry([{ family: 'Hoffmann', given: 'Jordan' }])).toContain(
      'author = {Hoffmann, Jordan},',
    );
  });

  // The opposite case: a literal name MUST be braced so BibTeX does not try to
  // read "Giattino et al." as First Last.
  it('braces a literal name so BibTeX does not split it', () => {
    expect(entry([{ literal: 'Giattino et al.' }])).toContain('author = {{Giattino et al.}},');
  });

  it('mixes both forms correctly in one field', () => {
    expect(entry([{ literal: 'OpenAI' }, { family: 'Smith', given: 'Jo' }])).toContain(
      'author = {{OpenAI} and Smith, Jo},',
    );
  });
});

describe('bibtexEntry', () => {
  it('formats structured names as Family, Given', () => {
    const out = bibtexEntry('k', item({ author: [{ family: 'Chollet', given: 'François' }] }));
    expect(out).toContain('author = {Chollet, François}');
  });
  it('omits empty fields rather than emitting empty braces', () => {
    const out = bibtexEntry('k', item({ title: undefined, issued: undefined }));
    expect(out).not.toContain('title');
    expect(out).not.toContain('year');
  });
});

describe('serializeCslJson', () => {
  it('emits the store items as the CSL-JSON array the spec defines', () => {
    const out = JSON.parse(serializeCslJson(anchor('https://example.org/x', 'Chollet, 2019')));
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].id).toBe('https://example.org/x');
    expect(out[0].author).toEqual([{ literal: 'Chollet' }]);
  });
});