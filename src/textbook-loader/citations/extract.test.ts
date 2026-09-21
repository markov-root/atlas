import { describe, it, expect } from 'vitest';
import { extractSectionCitations, summarizeCitations } from './extract';
import type { Node } from '../transformer';
import type { Section } from '..';

const link = (href: string, content: string): Node => ({
  name: 'Link',
  attributes: { href, content },
  children: [],
});

const span = (content: string): Node => ({ name: 'Span', attributes: { content }, children: [] });

const para = (...children: Node[]): Node => ({
  name: 'Paragraph',
  attributes: {},
  children,
});

function section(nodes: Node[], footnotes: Section['footnotes'] = []): Section {
  return {
    chapterNumber: 3,
    number: 2,
    slug: 'risks',
    title: 'Risks',
    description: '',
    toc: [],
    nodes,
    footnotes,
    readingTimeInSeconds: 0,
    prevSection: null,
    nextSection: null,
  } as Section;
}

describe('extractSectionCitations — classification (task:0025 AC-1)', () => {
  it('extracts an author-year citation with its location', () => {
    const s = section([
      para(span('As shown '), link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019')),
    ]);
    const [c] = extractSectionCitations(s);
    expect(c).toMatchObject({
      key: 'https://arxiv.org/abs/1911.01547',
      anchorText: 'Chollet, 2019',
      kind: 'citation',
      origin: 'inline',
      chapterNumber: 3,
      sectionNumber: 2,
      sectionSlug: 'risks',
    });
  });

  it('classifies a prose link as a content link, and does not discard it', () => {
    const s = section([para(link('https://example.org/guide', 'available here'))]);
    const [c] = extractSectionCitations(s);
    expect(c.kind).toBe('content-link');
    // Recorded, not dropped: a report must be able to show it.
    expect(c.rawUrl).toBe('https://example.org/guide');
  });

  it('classifies an image link as an asset', () => {
    const s = section([
      para(
        link(
          'https://upload.wikimedia.org/wikipedia/commons/b/b1/MNIST_dataset_example.png',
          'MNIST database - Wikipedia',
        ),
      ),
    ]);
    expect(extractSectionCitations(s)[0].kind).toBe('asset');
  });

  it('canonicalizes on the way out, so /abs and /pdf are one key', () => {
    const s = section([
      para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019')),
      para(link('https://arxiv.org/pdf/1911.01547v2', 'Chollet, 2019')),
    ]);
    const keys = extractSectionCitations(s).map((c) => c.key);
    expect(new Set(keys).size).toBe(1);
  });

  it('finds citations nested deep in the node tree', () => {
    const s = section([
      {
        name: 'Callout',
        attributes: {},
        children: [
          para({
            name: 'List',
            attributes: {},
            children: [para(link('https://arxiv.org/abs/1804.07461', 'Wang et al., 2018'))],
          }),
        ],
      },
    ]);
    expect(extractSectionCitations(s)).toHaveLength(1);
  });

  it('ignores a link node with no href', () => {
    const s = section([para({ name: 'Link', attributes: { content: 'x' }, children: [] })]);
    expect(extractSectionCitations(s)).toHaveLength(0);
  });
});

describe('extractSectionCitations — footnotes (task:0025 AC-5)', () => {
  it('records a linked footnote citation with its footnote number', () => {
    const s = section(
      [para(span('Text'), { name: 'Footnote', attributes: { number: '4' }, children: [] })],
      [
        {
          number: '4',
          children: [para(link('https://arxiv.org/abs/1803.04585', 'Manheim, 2018'))],
        },
      ],
    );
    const [c] = extractSectionCitations(s);
    expect(c).toMatchObject({ origin: 'footnote', footnoteNumber: '4', kind: 'citation' });
  });

  // The 9 real cases in the corpus: author-year prose inside a footnote with no
  // hyperlink. These have no URL to key on and must not be silently dropped.
  it('surfaces an unlinked footnote citation rather than dropping it', () => {
    const s = section(
      [para(span('Text'))],
      [
        {
          number: '1',
          children: [
            para(
              span(
                'Irrecoverable civilizational collapse has been argued to be possible (Rodriguez, 2020).',
              ),
            ),
          ],
        },
      ],
    );
    const found = extractSectionCitations(s);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      key: null,
      rawUrl: null,
      anchorText: 'Rodriguez, 2020',
      kind: 'unlinked',
      origin: 'footnote',
      footnoteNumber: '1',
    });
  });

  // Regression: subtreeText once joined spans with a space, which turned
  // "(Rodriguez, 2020)" into "( Rodriguez, 2020 )" and matched nothing. Every
  // unit test passed because fixtures used one span; all 9 real corpus cases
  // were silently lost. Google Docs splits sentences across spans routinely.
  it('finds an unlinked citation split across several spans', () => {
    const s = section(
      [para(span('Text'))],
      [
        {
          number: '7',
          children: [
            para(
              span('Collapse is possible '),
              span('('),
              span('Rodriguez, 2020'),
              span(').'),
            ),
          ],
        },
      ],
    );
    const found = extractSectionCitations(s);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: 'unlinked', anchorText: 'Rodriguez, 2020' });
  });

  it('does not double-count a footnote citation that is also hyperlinked', () => {
    const s = section(
      [para(span('Text'))],
      [
        {
          number: '2',
          children: [
            para(
              span('Shown by ('),
              link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019'),
              span(').'),
            ),
          ],
        },
      ],
    );
    const found = extractSectionCitations(s);
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('citation');
  });

  // The footnote subtree appears in both section.nodes and section.footnotes.
  // Counting it from both would inflate every figure in the bibliography.
  it('counts a footnote citation once, not once per representation', () => {
    const fnChildren = [para(link('https://arxiv.org/abs/1803.04585', 'Manheim, 2018'))];
    const s = section(
      [para(span('Text'), { name: 'Footnote', attributes: { number: '1' }, children: fnChildren })],
      [{ number: '1', children: fnChildren }],
    );
    expect(extractSectionCitations(s)).toHaveLength(1);
  });
});

describe('summarizeCitations', () => {
  it('counts by kind and deduplicates keys across sections', () => {
    const a = section([para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019'))]);
    const b = section([
      para(link('https://arxiv.org/pdf/1911.01547', 'Chollet, 2019')),
      para(link('https://example.org/x', 'available here')),
    ]);
    const s = summarizeCitations([a, b]);
    expect(s.counts.citation).toBe(2);
    expect(s.counts['content-link']).toBe(1);
    expect(s.uniqueKeys).toEqual(['https://arxiv.org/abs/1911.01547']);
  });

  it('is pure — repeated calls give identical results', () => {
    const s = section([para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019'))]);
    expect(summarizeCitations([s])).toEqual(summarizeCitations([s]));
  });
});
