import { describe, it, expect } from 'vitest';
import { formatChapterMarkdown, formatUrlFiles } from './urls';
import type { Chapter, Section } from '../../../src/textbook-loader/index';
import type { Node } from '../../../src/textbook-loader/transformer';
import type { Store } from '../../../src/textbook-loader/citations/store';

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
    slug: title.toLowerCase().replace(/\s+/g, '-'),
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

const VOYAGER = 'https://arxiv.org/abs/2305.16291';
const BITTER = 'https://incompleteideas.net/IncIdeas/BitterLesson.html';

const store: Store = {
  [VOYAGER]: {
    item: {
      id: VOYAGER,
      type: 'article',
      title: '[2305.16291] Voyager: An Open-Ended Embodied Agent with Large Language Models',
    },
    resolvedBy: 'arxiv',
    anchors: ['Wang et al., 2023'],
  },
  [BITTER]: {
    item: { id: BITTER, type: 'webpage', title: 'The Bitter Lesson' },
    resolvedBy: 'opengraph',
    anchors: ['Sutton, 2019'],
  },
};

describe('formatChapterMarkdown — titles as link text', () => {
  it('uses the resolved title as the link text, not the URL', () => {
    const ch = chapter(1, 'Capabilities', [
      section(5, 'Leveraging Scale', [para(link(BITTER, 'Sutton, 2019'))]),
    ]);
    const { markdown } = formatChapterMarkdown(ch, store);
    expect(markdown).toContain(`- Sutton, 2019 ([The Bitter Lesson](${BITTER}))`);
  });

  // An unresolved entry must stay visible as a bare URL. Hiding it would make
  // the gap invisible; the point of this file is to show what still needs work.
  it('falls back to the bare URL when no title is resolved yet', () => {
    const ch = chapter(1, 'Capabilities', [
      section(1, 'Intro', [para(link('https://example.org/x', 'Smith, 2020'))]),
    ]);
    expect(formatChapterMarkdown(ch, store).markdown).toContain(
      '- Smith, 2020 (https://example.org/x)',
    );
  });

  it('does not use a title from an entry that is still anchor-only', () => {
    const anchorOnly: Store = {
      [BITTER]: {
        item: { id: BITTER, type: 'webpage', title: 'Sutton, 2019' },
        resolvedBy: 'anchor',
        anchors: [],
      },
    };
    const ch = chapter(1, 'C', [section(1, 'S', [para(link(BITTER, 'Sutton, 2019'))])]);
    // The anchor-derived "title" is the anchor text; showing it as a title
    // would claim a lookup that never happened.
    expect(formatChapterMarkdown(ch, anchorOnly).markdown).toContain(`- Sutton, 2019 (${BITTER})`);
  });

  it('escapes brackets so an arXiv-style title does not break the link', () => {
    const ch = chapter(1, 'C', [section(1, 'S', [para(link(VOYAGER, 'Wang et al., 2023'))])]);
    const md = formatChapterMarkdown(ch, store).markdown;
    expect(md).toContain('\\[2305.16291\\] Voyager');
    expect(md).toContain(`](${VOYAGER})`);
  });
});

describe('formatChapterMarkdown — deduplication within a section', () => {
  // The reported case: Sutton twice and Giattino three times in one section.
  it('collapses a source cited repeatedly in one section to a single entry', () => {
    const ch = chapter(1, 'Capabilities', [
      section(5, 'Leveraging Scale', [
        para(link(BITTER, 'Sutton, 2019')),
        para(link(BITTER, 'Sutton, 2019')),
        para(link(BITTER, 'Sutton, 2019')),
      ]),
    ]);
    const md = formatChapterMarkdown(ch, store).markdown;
    expect(md.match(/- Sutton, 2019/g)).toHaveLength(1);
  });

  it('deduplicates by URL even when the anchor text differs', () => {
    const ch = chapter(1, 'C', [
      section(1, 'S', [
        para(link(VOYAGER, 'Wang et al., 2023')),
        para(link(VOYAGER, 'Wang et al, 2023')),
      ]),
    ]);
    expect(formatChapterMarkdown(ch, store).markdown.match(/^- Wang/gm)).toHaveLength(1);
  });

  it('keeps the same source when it appears in different sections', () => {
    const ch = chapter(1, 'C', [
      section(1, 'A', [para(link(BITTER, 'Sutton, 2019'))]),
      section(2, 'B', [para(link(BITTER, 'Sutton, 2019'))]),
    ]);
    expect(formatChapterMarkdown(ch, store).markdown.match(/- Sutton, 2019/g)).toHaveLength(2);
  });

  it('keeps first-seen order, so the list follows the prose', () => {
    const ch = chapter(1, 'C', [
      section(1, 'S', [
        para(link(VOYAGER, 'Wang et al., 2023')),
        para(link(BITTER, 'Sutton, 2019')),
        para(link(VOYAGER, 'Wang et al., 2023')),
      ]),
    ]);
    const lines = formatChapterMarkdown(ch, store)
      .markdown.split('\n')
      .filter((l) => l.startsWith('- '));
    expect(lines[0]).toContain('Wang');
    expect(lines[1]).toContain('Sutton');
    expect(lines).toHaveLength(2);
  });
});

describe('formatUrlFiles — one file per chapter', () => {
  const chapters = [
    chapter(1, 'Capabilities', [section(1, 'Intro', [para(link(BITTER, 'Sutton, 2019'))])]),
    chapter(2, 'Risks', [section(1, 'Intro', [para(link(VOYAGER, 'Wang et al., 2023'))])]),
  ];

  it('writes one file per chapter plus a whole-book index', () => {
    const { files } = formatUrlFiles(chapters, store);
    expect(files.map((f) => f.filename)).toEqual([
      'chapter-01-capabilities.md',
      'chapter-02-risks.md',
      'all-sources.md',
    ]);
  });

  it('zero-pads chapter numbers so files sort correctly', () => {
    const many = [chapter(2, 'B', []), chapter(10, 'J', [])];
    const names = formatUrlFiles(many, store).files.map((f) => f.filename);
    expect(names[0] < names[1]).toBe(true);
  });

  it('keeps each chapter file to its own citations', () => {
    const { files } = formatUrlFiles(chapters, store);
    expect(files[0].markdown).toContain('Sutton');
    expect(files[0].markdown).not.toContain('Wang');
  });

  it('counts resolved titles so the caller can report coverage', () => {
    expect(formatUrlFiles(chapters, store).resolvedTitles).toBe(2);
  });

  it('is deterministic, so regenerating gives a clean diff', () => {
    expect(formatUrlFiles(chapters, store).files[0].markdown).toBe(
      formatUrlFiles(chapters, store).files[0].markdown,
    );
  });
});
