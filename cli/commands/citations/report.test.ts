import { describe, it, expect } from 'vitest';
import { buildCitationReport, type ReportCounts } from './report';
import { entryFromAnchor, type Store } from '../../../src/textbook-loader/citations/store';
import type { Chapter, Section } from '../../../src/textbook-loader/index';
import type { Node } from '../../../src/textbook-loader/transformer';

const link = (href: string, content: string): Node => ({
  name: 'Link',
  attributes: { href, content },
  children: [],
});

const para = (...children: Node[]): Node => ({ name: 'Paragraph', attributes: {}, children });

function section(number: number, title: string, nodes: Node[], footnotes: Section['footnotes'] = []): Section {
  return {
    chapterNumber: 2,
    number,
    title,
    slug: title.toLowerCase(),
    description: '',
    toc: [],
    nodes,
    footnotes,
    readingTimeInSeconds: 0,
    prevSection: null,
    nextSection: null,
  } as Section;
}

function chapter(number: number, title: string, sections: Section[]): Chapter {
  return { number, title, slug: title.toLowerCase(), sections } as Chapter;
}

const resolved = entryFromAnchor('https://arxiv.org/abs/1804.07461', 'Wang et al., 2018', {
  author: 'Wang et al.',
  year: '2018',
});

const store: Store = {
  'https://arxiv.org/abs/1804.07461': {
    ...resolved,
    item: { ...resolved.item, title: 'On the Measure of Intelligence', abstract: 'Real title.' },
    resolvedBy: 'arxiv',
  },
  'https://arxiv.org/abs/1911.01547': entryFromAnchor(
    'https://arxiv.org/abs/1911.01547',
    'Chollet, 2019',
    { author: 'Chollet', year: '2019' },
  ),
};

const ch = chapter(2, 'Risks', [
  section(1, 'Situations', [
    // Cited twice with two spellings: one entry, inconsistent input.
    para(link('https://arxiv.org/abs/1911.01547', 'Chollet, 2019')),
    para(link('https://arxiv.org/abs/1911.01547', 'Chollet 2019')),
    para(link('https://example.org/guide', 'available here')),
  ]),
  section(2, 'Footnote case', [
    para(link('https://arxiv.org/abs/1804.07461', 'Wang et al., 2018')),
  ]),
]);

const report = (chapters: Chapter[], s: Store) => buildCitationReport(chapters, s);

describe('buildCitationReport — sections an author needs', () => {
  it('lists unresolved entries with every anchor spelling and location', () => {
    const { markdown, counts } = report([ch], store);
    expect(counts.unresolved).toBe(1);
    expect(markdown).toContain('## Unresolved entries (1)');
    // The author must be able to find the citation in the Google Doc from the
    // line alone: anchor text, chapter.section, and the URL. Spellings are
    // sorted, and the same section cited twice is listed once.
    expect(markdown).toContain('`Chollet 2019` / `Chollet, 2019` — `ch2.1`');
    expect(markdown).toContain('https://arxiv.org/abs/1911.01547');
  });

  it('does not list resolved entries as unresolved', () => {
    const { markdown } = report([ch], store);
    expect(markdown).not.toContain('Wang et al., 2018 — `ch2.2`');
  });

  it('reports anchor texts that classify as citations but split into no author+year', () => {
    const glued = chapter(3, 'Edge', [
      section(1, 'Glued', [para(link('https://example.org/x', 'Anthropic2024'))]),
    ]);
    const { markdown, counts } = report([glued], {});
    expect(counts.malformed).toBe(1);
    expect(markdown).toContain('## Malformed anchor text (1)');
    expect(markdown).toContain('`Anthropic2024`');
  });

  it('reports content links so an author can judge which are real citations', () => {
    const { markdown, counts } = report([ch], store);
    expect(counts.contentLinks).toBe(1);
    expect(markdown).toContain('`available here` (https://example.org/guide)');
  });

  it('reports unlinked footnote citations, which have no URL to key on', () => {
    // The corpus has zero of these today; the section exists so the first one
    // an author writes is reported rather than dropped (task:0021 correction).
    const fn = chapter(4, 'Footnotes', [
      section(1, 'With', [], [
        { number: '3', children: [para({ name: 'Span', attributes: { content: '(Rodriguez, 2020)' }, children: [] })] },
      ]),
    ]);
    const { markdown, counts } = report([fn], {});
    expect(counts.unlinked).toBe(1);
    expect(markdown).toContain('`ch2.1, footnote 3` — `Rodriguez, 2020`');
  });

  it('flags one source cited with more than one anchor spelling', () => {
    const { markdown, counts } = report([ch], store);
    expect(counts.inconsistent).toBe(1);
    expect(markdown).toContain('`Chollet 2019` / `Chollet, 2019`');
  });

  it('omits sections with zero findings instead of printing zero rows', () => {
    // A count of zero in a heading trains authors to stop reading headings;
    // an absent section says "nothing here" more honestly.
    const { markdown } = report([ch], {});
    expect(markdown).not.toContain('Unlinked footnote citations');
  });

  it('lists orphaned store entries that no chapter cites', () => {
    const orphan: Store = {
      'https://removed.org/page': entryFromAnchor('https://removed.org/page', 'Old, 2020', {
        author: 'Old',
        year: '2020',
      }),
    };
    const { markdown } = report([ch], orphan);
    expect(markdown).toContain('no citation instance found');
  });

  it('is deterministic, so re-running after doc edits produces a diff', () => {
    expect(report([ch], store).markdown).toBe(report([ch], store).markdown);
  });
});

describe('counts line up with the markdown', () => {
  it('aggregates all five categories in one struct', () => {
    const counts: ReportCounts = report([ch], store).counts;
    expect(counts).toEqual({
      unresolved: 1,
      malformed: 0,
      contentLinks: 1,
      unlinked: 0,
      inconsistent: 1,
    });
  });
});