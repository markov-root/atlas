import { describe, it, expect } from 'vitest';
import { formatUrlMarkdown } from './urls';
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

describe('formatUrlMarkdown', () => {
  const ch = chapter(1, 'Capabilities', [
    section(1, 'Introduction', []),
    section(2, 'Benchmarks', [
      para(link('https://arxiv.org/abs/1804.07461', 'Wang et al., 2018')),
      para(link('https://example.org/guide', 'available here')),
    ]),
  ]);

  it('renders Title (url) per section', () => {
    const { markdown } = formatUrlMarkdown([ch]);
    expect(markdown).toContain('## Chapter 1 — Capabilities');
    expect(markdown).toContain('### 1.2 Benchmarks');
    expect(markdown).toContain('- Wang et al., 2018 (https://arxiv.org/abs/1804.07461)');
  });

  // An author scanning for gaps must be able to tell "cites nothing" from
  // "missing from the report".
  it('states explicitly when a section has no citations', () => {
    expect(formatUrlMarkdown([ch]).markdown).toContain('_No citations in this section._');
  });

  it('separates unrecognised links instead of hiding or mixing them', () => {
    const { markdown, unrecognised } = formatUrlMarkdown([ch]);
    expect(unrecognised).toBe(1);
    expect(markdown).toContain('Links not recognised as citations (1)');
    expect(markdown).toContain('"available here"');
    // …and it must not appear in the citation list for the section.
    expect(markdown).not.toContain('- available here (');
  });

  it('deduplicates the master list and shows every spelling seen', () => {
    const two = chapter(2, 'Risks', [
      section(1, 'A', [para(link('https://arxiv.org/abs/1804.07461', 'Wang et al, 2018'))]),
    ]);
    const { markdown, uniqueSources } = formatUrlMarkdown([ch, two]);
    expect(uniqueSources).toBe(1);
    // Both spellings of the one source are surfaced, which is how an author
    // finds inconsistent citation text.
    expect(markdown).toContain('Wang et al., 2018 / Wang et al, 2018');
  });

  it('is deterministic, so regenerating gives a clean diff', () => {
    expect(formatUrlMarkdown([ch]).markdown).toBe(formatUrlMarkdown([ch]).markdown);
  });

  it('says plainly that it is not the finished bibliography', () => {
    expect(formatUrlMarkdown([ch]).markdown).toMatch(/not the finished bibliography/i);
  });
});
