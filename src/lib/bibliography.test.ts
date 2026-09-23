import { describe, it, expect } from 'vitest';
import {
  BASIC_STYLE,
  availableStyles,
  allReferences,
  chapterReferences,
  displayUrl,
  formatAuthors,
  formatName,
  formatYear,
  loadStore,
  resetStoreCache,
  sectionReferences,
  defaultStyle,
  loadRendered,
  storeCoverage,
  sourceOf,
  allReferencesWithLocations,
  toReference,
} from './bibliography';
import type { Chapter, Section } from '../textbook-loader';
import type { Node } from '../textbook-loader/transformer';

const link = (href: string, content: string): Node => ({
  name: 'Link',
  attributes: { href, content },
  children: [],
});

const para = (...children: Node[]): Node => ({ name: 'Paragraph', attributes: {}, children });

function section(nodes: Node[], number = 1): Section {
  return {
    chapterNumber: 2,
    number,
    slug: `s${number}`,
    title: `Section ${number}`,
    description: '',
    toc: [],
    nodes,
    footnotes: [],
    readingTimeInSeconds: 0,
    prevSection: null,
    nextSection: null,
  } as Section;
}

const entry = (over: Record<string, unknown> = {}, resolvedBy = 'arxiv') => ({
  item: { id: 'https://a.org/x', type: 'article', URL: 'https://a.org/x', ...over },
  resolvedBy,
  anchors: [],
});

describe('formatName', () => {
  it('abbreviates given names, because a reference list is scanned not read', () => {
    expect(formatName({ family: 'Hoffmann', given: 'Jordan' })).toBe('Hoffmann, J.');
  });

  it('handles multiple given names', () => {
    expect(formatName({ family: 'Haldane', given: 'Andrew G.' })).toBe('Haldane, A. G.');
  });

  it('leaves a literal name exactly as written', () => {
    // task:0025 kept these unparsed on purpose; inventing a split here would
    // undo that decision at the last possible moment.
    expect(formatName({ literal: 'Giattino et al.' })).toBe('Giattino et al.');
  });

  it('falls back to the family name alone', () => {
    expect(formatName({ family: 'Chollet' })).toBe('Chollet');
  });
});

// The store held three entries whose `given` was tens of thousands of characters
// of raw Atom XML - the TypeScript arXiv resolver had swallowed the whole author
// block - and the page rendered it as several hundred initials. The resolver is
// fixed; this is the render-layer guard, because sources.yaml is committed and
// hand-editable so bad values can arrive with no resolver involved.
// audit:0011 F11.
describe('formatName rejects values that cannot be names', () => {
  const xmlBlob = 'OpenAI</name>\n  <arxiv:affiliation>Rai</arxiv:affiliation>\n  </author>';

  it('drops a given name containing markup, keeping the family name', () => {
    expect(formatName({ family: 'Pokorny', given: xmlBlob })).toBe('Pokorny');
  });

  it('drops an absurdly long given name, keeping the family name', () => {
    expect(formatName({ family: 'Debnath', given: 'A'.repeat(5000) })).toBe('Debnath');
  });

  it('drops a literal name containing markup entirely', () => {
    expect(formatName({ literal: xmlBlob })).toBe('');
  });

  it('never emits a name longer than a plausible one', () => {
    const out = formatName({ family: 'X'.repeat(500), given: 'Y'.repeat(500) });
    expect(out.length).toBeLessThan(100);
  });

  it('leaves a long but legitimate name alone', () => {
    const real = { family: 'van der Berg-Schmidt', given: 'Maria Jos\u00e9 Antonia' };
    expect(formatName(real)).toBe('van der Berg-Schmidt, M. J. A.');
  });
});

describe('formatAuthors', () => {
  it('joins the final pair with an ampersand', () => {
    expect(formatAuthors([{ family: 'Amodei' }, { family: 'Clark' }])).toBe('Amodei & Clark');
  });

  it('truncates past six, so one 40-author paper cannot swamp the list', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ family: `Author${i}` }));
    expect(formatAuthors(many)).toBe('Author0 et al.');
  });

  it('keeps exactly six in full', () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ family: `A${i}` }));
    expect(formatAuthors(six)).toContain('&');
    expect(formatAuthors(six)).not.toContain('et al.');
  });

  it('is empty for no authors', () => {
    expect(formatAuthors(undefined)).toBe('');
    expect(formatAuthors([])).toBe('');
  });
});

describe('formatYear', () => {
  it('reads the year out of CSL date-parts', () => {
    expect(formatYear({ id: 'x', issued: { 'date-parts': [[2019, 11, 5]] } })).toBe('2019');
  });

  it('is empty when the entry has no date', () => {
    expect(formatYear({ id: 'x' })).toBe('');
  });
});

describe('displayUrl', () => {
  it('drops the scheme and any trailing slash', () => {
    expect(displayUrl('https://epoch.ai/blog/x/')).toBe('epoch.ai/blog/x');
  });

  it('shortens the middle, keeping the host and the last segment', () => {
    const long = `https://example.org/${'a'.repeat(120)}/final-segment`;
    const out = displayUrl(long);
    expect(out.length).toBeLessThanOrEqual(71);
    expect(out.startsWith('example.org/')).toBe(true);
    expect(out.endsWith('final-segment')).toBe(true);
  });
});

describe('toReference', () => {
  it('renders a resolved entry from its metadata', () => {
    const ref = toReference(
      'https://a.org/x',
      entry({
        title: 'On the Measure of Intelligence',
        author: [{ family: 'Chollet', given: 'Francois' }],
        issued: { 'date-parts': [[2019]] },
        'container-title': 'arXiv',
      }),
    );
    expect(ref).toMatchObject({
      authors: 'Chollet, F.',
      year: '2019',
      title: 'On the Measure of Intelligence',
      container: 'arXiv',
      resolved: true,
    });
  });

  // The defect the first render made obvious: an unresolved entry's title IS its
  // anchor text, so using it as link text produced "Cotra (2023). Cotra 2023."
  it('shows the URL, not the anchor text, for an unresolved entry', () => {
    const ref = toReference('https://epoch.ai/blog/trends', {
      item: {
        id: 'https://epoch.ai/blog/trends',
        URL: 'https://epoch.ai/blog/trends',
        title: 'Cotra, 2023',
        author: [{ literal: 'Cotra' }],
        issued: { 'date-parts': [[2023]] },
      },
      resolvedBy: 'anchor',
      anchors: ['Cotra, 2023'],
    });
    expect(ref.resolved).toBe(false);
    expect(ref.authors).toBe('Cotra');
    expect(ref.year).toBe('2023');
    expect(ref.title).toBe('epoch.ai/blog/trends');
    expect(ref.title).not.toBe('Cotra, 2023');
  });

  it('strips a terminal period so the template does not double it', () => {
    // Real corpus case: "…regions of rat brain." rendered as "rat brain.."
    const ref = toReference(
      'https://a.org/x',
      entry({ title: 'Positive reinforcement produced by stimulation of rat brain.' }),
    );
    expect(ref.title.endsWith('.')).toBe(false);
  });

  it('strips a terminal period from the container too', () => {
    const ref = toReference('https://a.org/x', entry({ title: 'T', 'container-title': 'Nature.' }));
    expect(ref.container).toBe('Nature');
  });

  // Open Graph titles routinely carry the site name, and og:site_name then
  // supplies it again - the first render showed "… - Center on Long-Term Risk.
  // Center on Long-Term Risk."
  it('drops a container the title already ends with', () => {
    const ref = toReference(
      'https://a.org/x',
      entry({
        title: 'Reducing Risks of Astronomical Suffering - Center on Long-Term Risk',
        'container-title': 'Center on Long-Term Risk',
      }),
    );
    expect(ref.container).toBe('');
    expect(ref.title).toContain('Center on Long-Term Risk');
  });

  it('drops a container identical to the title', () => {
    const ref = toReference(
      'https://a.org/x',
      entry({ title: 'Chess.com', 'container-title': 'Chess.com' }),
    );
    expect(ref.container).toBe('');
  });

  it('keeps a container that merely appears inside the title', () => {
    const ref = toReference(
      'https://a.org/x',
      entry({ title: 'What Nature teaches us about scale', 'container-title': 'Nature' }),
    );
    expect(ref.container).toBe('Nature');
  });

  it('keeps a container when there is no separator before it', () => {
    const ref = toReference(
      'https://a.org/x',
      entry({ title: 'A study of Nature', 'container-title': 'Nature' }),
    );
    expect(ref.container).toBe('Nature');
  });

  it('keeps the canonical URL as identity even when the item disagrees', () => {
    const ref = toReference('https://a.org/x', entry({ title: 'T' }));
    expect(ref.key).toBe('https://a.org/x');
  });
});

describe('sectionReferences', () => {
  const root = process.cwd();

  it('lists what a section cites, alphabetised', () => {
    resetStoreCache();
    const s = section([
      para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019')),
      para(link('https://arxiv.org/abs/2203.15556', 'Hoffmann et al., 2022')),
    ]);
    const refs = sectionReferences(s, root);
    expect(refs.length).toBe(2);
    const keys = refs.map((r) => r.authors || r.title);
    expect([...keys].sort()).toEqual(keys);
  });

  it('deduplicates a source cited more than once in the section', () => {
    resetStoreCache();
    const s = section([
      para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019')),
      para(link('https://arxiv.org/abs/1911.01547', 'Chollet 2019')),
    ]);
    expect(sectionReferences(s, root).length).toBe(1);
  });

  it('excludes prose links and assets - they are not references', () => {
    resetStoreCache();
    const s = section([
      para(link('https://example.org/guide', 'available here')),
      para(link('https://example.org/fig.png', 'a figure')),
    ]);
    expect(sectionReferences(s, root)).toEqual([]);
  });

  it('renders a cited URL that is not yet in the store, rather than dropping it', () => {
    // A silently shorter bibliography is the failure task:0021 D4 exists to
    // prevent - the store can lag the prose.
    resetStoreCache();
    const s = section([para(link('https://not-in-store.example/paper', 'Nobody, 2099'))]);
    const refs = sectionReferences(s, root);
    expect(refs.length).toBe(1);
    expect(refs[0].url).toBe('https://not-in-store.example/paper');
  });

  it('returns nothing for a section that cites nothing', () => {
    resetStoreCache();
    expect(sectionReferences(section([]), root)).toEqual([]);
  });
});

describe('chapterReferences', () => {
  it('merges every section and deduplicates across them', () => {
    resetStoreCache();
    const chapter = {
      number: 2,
      slug: 'risks',
      title: 'Risks',
      sections: [
        section([para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019'))], 1),
        section([para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019'))], 2),
        section([para(link('https://arxiv.org/abs/2203.15556', 'Hoffmann et al., 2022'))], 3),
      ],
    } as Chapter;
    expect(chapterReferences(chapter, process.cwd()).length).toBe(2);
  });
});

describe('the committed store', () => {
  it('loads, and holds the whole corpus', () => {
    resetStoreCache();
    const store = loadStore(process.cwd());
    expect(Object.keys(store).length).toBeGreaterThan(900);
  });

  it('reports coverage for the /bibliography page', () => {
    resetStoreCache();
    const { total, resolved } = storeCoverage(process.cwd());
    expect(total).toBeGreaterThan(900);
    expect(resolved).toBeGreaterThan(700);
    expect(resolved).toBeLessThanOrEqual(total);
  });

  it('renders every entry without throwing', () => {
    // 948 real entries, including the ragged ones. A single bad entry must not
    // take down a page.
    resetStoreCache();
    const refs = allReferences(process.cwd());
    expect(refs.length).toBeGreaterThan(900);
    expect(refs.every((r) => typeof r.title === 'string' && r.title.length > 0)).toBe(true);
    expect(refs.every((r) => r.url.startsWith('http'))).toBe(true);
  });

  it('never renders markup or an absurd name from the real corpus', () => {
    resetStoreCache();
    const refs = allReferences(process.cwd());
    const bad = refs.filter((r) => r.authors.includes('<') || r.authors.length > 300);
    expect(bad.map((r) => r.key)).toEqual([]);
  });

  it('never renders markup in a title or container', () => {
    resetStoreCache();
    const refs = allReferences(process.cwd());
    const bad = refs.filter((r) => r.title.includes('</') || r.container.includes('</'));
    expect(bad.map((r) => r.key)).toEqual([]);
  });

  it('never renders a title that is just the author and year again', () => {
    resetStoreCache();
    const redundant = allReferences(process.cwd()).filter(
      (r) => r.authors && r.year && r.title === `${r.authors}, ${r.year}`,
    );
    expect(redundant).toEqual([]);
  });
});

describe('a missing store degrades instead of failing', () => {
  it('yields no references rather than throwing (task:0021 D4)', () => {
    resetStoreCache();
    // Pointed at a directory with no data/citations/sources.yaml.
    expect(allReferences('/nonexistent-root-for-test')).toEqual([]);
    resetStoreCache();
  });
});

describe('style options (task:0030)', () => {
  it('always offers the house style, and defaults to it', () => {
    resetStoreCache();
    expect(availableStyles(process.cwd())[0]).toEqual(BASIC_STYLE);
    expect(defaultStyle()).toBe(BASIC_STYLE.id);
  });

  it('offers the pre-rendered CSL styles after it', () => {
    resetStoreCache();
    const ids = availableStyles(process.cwd()).map((s) => s.id);
    expect(ids).toContain('apa');
    expect(ids).toContain('chicago');
    // Numeric styles are offered but flagged, because the prose cites by
    // author-year and a number here corresponds to nothing.
    const numeric = availableStyles(process.cwd()).filter((s) => s.numeric).map((s) => s.id);
    expect(numeric).toEqual(['nature', 'ieee']);
  });

  it('still offers the house style with no rendered file at all', () => {
    // task:0030 AC-4 - a contributor who has not run `atlas citations render`
    // gets a working bibliography, just without the alternatives.
    resetStoreCache();
    expect(availableStyles('/nonexistent-root-for-test')).toEqual([BASIC_STYLE]);
    resetStoreCache();
  });

  it('attaches pre-rendered text to references from the real corpus', () => {
    resetStoreCache();
    const refs = allReferences(process.cwd());
    const withStyles = refs.filter((r) => Object.keys(r.styled).length > 0);
    expect(withStyles.length).toBe(refs.length);
    expect(Object.keys(withStyles[0].styled).sort()).toEqual(
      ['apa', 'chicago', 'ieee', 'mla', 'nature'].sort(),
    );
  });

  it('the rendered file covers every store entry', () => {
    resetStoreCache();
    const rendered = loadRendered(process.cwd());
    expect(rendered).not.toBeNull();
    const missing = allReferences(process.cwd()).filter((r) => !rendered!.entries[r.key]);
    expect(missing.map((r) => r.key)).toEqual([]);
  });
});

describe('the corpus has no impossible URLs (audit:0011 F13)', () => {
  it('every entry key has a dotted hostname', () => {
    resetStoreCache();
    const bad = allReferences(process.cwd()).filter((r) => {
      try {
        return !new URL(r.key).hostname.includes('.');
      } catch {
        return true;
      }
    });
    expect(bad.map((r) => r.key)).toEqual([]);
  });
});

describe('the source facet (task:0030 AC-7, task:0032 D5)', () => {
  it('uses the container a source states', () => {
    expect(sourceOf('arXiv', 'https://arxiv.org/abs/1')).toBe('arXiv');
  });

  it('falls back to the domain rather than inventing a publisher name', () => {
    // A domain is a true statement about where a work lives and needs no
    // mapping table anyone has to maintain. The alternative - a hand-written
    // domain-to-publisher table for a long tail of several hundred sites - is
    // guesswork dressed as data.
    expect(sourceOf('', 'https://www.openai.com/index/x')).toBe('openai.com');
    expect(sourceOf('', 'https://some-blog.example/post')).toBe('some-blog.example');
  });

  it('never returns empty, so no entry falls out of the facet', () => {
    expect(sourceOf('', 'not a url')).toBe('Unknown');
  });

  it('keeps the stated container even when the title already ends with it', () => {
    // `dropRedundantContainer` blanks the *display* container so a reference
    // does not say "LessWrong" twice. The facet must still be able to filter on
    // it - the two are different jobs on the same field.
    const ref = toReference(
      'https://lesswrong.com/posts/x',
      entry(
        {
          title: 'Beware safety-washing - LessWrong',
          'container-title': 'LessWrong',
          URL: 'https://lesswrong.com/posts/x',
        },
        'forum-magnum',
      ),
    );
    expect(ref.container).toBe('');
    expect(ref.source).toBe('LessWrong');
  });
});

describe('the type facet', () => {
  it('names CSL types in a readers words', () => {
    expect(toReference('u', entry({ type: 'post-weblog' })).kind).toBe('Blog post');
    expect(toReference('u', entry({ type: 'motion_picture' })).kind).toBe('Video');
    expect(toReference('u', entry({ type: 'article-journal' })).kind).toBe('Journal article');
  });

  it('buckets an unmapped type rather than showing the schema word', () => {
    // A filter option nobody understands is worse than one bucket.
    expect(toReference('u', entry({ type: 'dataset' })).kind).toBe('Other');
    expect(toReference('u', entry({ type: undefined })).kind).toBe('Other');
  });
});

describe('allReferencesWithLocations (task:0030 AC-7)', () => {
  const cited = (href: string) => para(link(href, 'Author, 2024'));

  function chapterWith(sections: Section[], number = 2, slug = 'ch2'): Chapter {
    return { title: 'A Chapter', number, slug, sections } as Chapter;
  }

  // A real key, because the site-wide list is built from the committed store:
  // a URL with no store entry has nothing to attach a location to.
  const url = Object.keys(loadStore())[0];

  it('tags a source with every chapter and section citing it', () => {
    const chapter = chapterWith([section([cited(url)], 1), section([cited(url)], 3)]);
    const found = allReferencesWithLocations([chapter]).find((r) => r.key === url);
    expect(found?.cited.map((c) => c.sectionNumber)).toEqual(['2.1', '2.3']);
    expect(found?.cited[0].chapterSlug).toBe('ch2');
  });

  it('counts a section once however often it cites the same source', () => {
    const chapter = chapterWith([section([cited(url), cited(url), cited(url)], 1)]);
    const found = allReferencesWithLocations([chapter]).find((r) => r.key === url);
    expect(found?.cited).toHaveLength(1);
  });

  it('leaves an uncited store entry with no locations rather than dropping it', () => {
    // /bibliography answers "what does this book rest on", and the store is the
    // authority on that - an entry the walk did not reach is still a source.
    const refs = allReferencesWithLocations([chapterWith([section([])])]);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every((r) => Array.isArray(r.cited))).toBe(true);
  });
});
