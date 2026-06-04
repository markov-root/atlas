import { describe, it, expect } from 'vitest';
import { textbookToRecords } from './algolia';
import type { Textbook, Chapter, Section } from '.';
import type { Node } from './transformer';

function node(name: string, attributes: Record<string, unknown> = {}, children: Node[] = []): Node {
  return { name, attributes, children };
}

const span = (content: string) => node('Span', { content });

function section(partial: Partial<Section>): Section {
  return {
    chapterNumber: 1,
    number: 1,
    description: '',
    title: 'Section',
    slug: 'section',
    toc: [],
    nodes: [],
    footnotes: [],
    readingTimeInSeconds: 60,
    prevSection: null,
    nextSection: null,
    ...partial,
  };
}

function chapter(partial: Partial<Chapter>): Chapter {
  return {
    title: 'Chapter Title',
    number: 1,
    slug: 'chapter-title',
    sections: [],
    meta: { docId: 'd', tabId: 't', authors: [], acknowledgements: [] },
    readingTimeInSeconds: 600,
    contentHash: 'abc',
    ...partial,
  };
}

function textbook(partial: Partial<Textbook>): Textbook {
  return {
    version: 'v1',
    language: 'en',
    chapters: [],
    readingTimeInSeconds: 600,
    ...partial,
  };
}

function bodyWith(text: string): Node[] {
  return [node('Paragraph', {}, [span(text)])];
}

const LONG = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod.';

// DocSearch (Algolia's documentation search) expects a specific record
// shape: each section is one lvl1 record, each in-section heading is one
// lvl2 record, both keyed into a hierarchy (lvl0 = chapter, lvl1 = section,
// lvl2 = heading). If this contract breaks, the site's search bar either
// stops returning results or returns results that link to broken URLs —
// both observable to any reader using the search feature.
describe('textbookToRecords — DocSearch contract: hierarchy and URLs', () => {
  it('emits one lvl1 record per section keyed to the correct chapter and section URL', () => {
    const tb = textbook({
      chapters: [
        chapter({
          number: 2,
          title: 'Capabilities',
          slug: 'capabilities',
          sections: [
            section({
              number: 1,
              title: 'Intro',
              slug: 'intro',
              nodes: bodyWith(LONG),
            }),
          ],
        }),
      ],
    });
    const records = textbookToRecords(tb);
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.type).toBe('lvl1');
    expect(r.url).toBe('/chapters/v1/capabilities/intro');
    expect(r.hierarchy.lvl0).toBe('Chapter 2: Capabilities');
    expect(r.hierarchy.lvl1).toBe('2.1 Intro');
  });

  it('emits one lvl2 record per Heading, anchored to the heading slug', () => {
    const tb = textbook({
      chapters: [
        chapter({
          number: 3,
          title: 'Risks',
          slug: 'risks',
          sections: [
            section({
              title: 'Sub',
              slug: 'sub',
              nodes: [
                node('Paragraph', {}, [span(LONG)]),
                node('Heading', { level: 2, slug: 'first-heading' }, [span('First Heading')]),
              ],
            }),
          ],
        }),
      ],
    });
    const lvl2 = textbookToRecords(tb).filter((r) => r.type === 'lvl2');
    expect(lvl2.length).toBe(1);
    expect(lvl2[0].url).toBe('/chapters/v1/risks/sub#first-heading');
    expect(lvl2[0].url_without_anchor).toBe('/chapters/v1/risks/sub');
    expect(lvl2[0].anchor).toBe('first-heading');
    expect(lvl2[0].hierarchy.lvl2).toBe('First Heading');
  });

  it('does not index headings inside sections that were themselves skipped for missing content', () => {
    // A section with no extractable prose is excluded from search so a
    // user clicking a result never lands on an empty page. Its headings
    // must therefore also be excluded — otherwise the lvl2 record would
    // point at a parent lvl1 the search UI never displays.
    const tb = textbook({
      chapters: [
        chapter({
          sections: [
            section({
              nodes: [
                node('Paragraph', {}, [span('short')]),
                node('Heading', { level: 2, slug: 'h' }, [span('Heading')]),
              ],
            }),
          ],
        }),
      ],
    });
    expect(textbookToRecords(tb).length).toBe(0);
  });

  it('tags every record with the textbook version (used by version-scoped Algolia filters)', () => {
    // Algolia deletes-by-version before re-indexing on each build. If the
    // version tag drifts from textbook.version, the delete misses, and
    // search returns duplicated records from the previous build.
    const tb = textbook({
      version: 'v2',
      chapters: [
        chapter({
          sections: [
            section({
              nodes: [
                node('Paragraph', {}, [span(LONG)]),
                node('Heading', { level: 2, slug: 'h' }, [span('Heading')]),
              ],
            }),
          ],
        }),
      ],
    });
    for (const r of textbookToRecords(tb)) {
      expect(r.version).toBe('v2');
    }
  });
});

// Search results need actual prose to show snippets and to rank by
// relevance. Skipping Span/Link/GlossaryDefinition text — or accidentally
// including non-textual nodes (equations, images) — produces search hits
// without snippets or with garbled snippets. Both are visible to anyone
// who searches.
describe('textbookToRecords — searchable text extraction', () => {
  it('includes Span, Link visible text, and GlossaryDefinition matched text in the searchable content', () => {
    const tb = textbook({
      chapters: [
        chapter({
          sections: [
            section({
              nodes: [
                node('Paragraph', {}, [
                  span('plain '),
                  node('Link', { content: 'linktext', href: 'https://x' }),
                  span(' '),
                  node('GlossaryDefinition', {
                    matchedText: 'alignment',
                    term: 'AI alignment',
                  }),
                  span(' tail with enough length to clear the minimum threshold.'),
                ]),
              ],
            }),
          ],
        }),
      ],
    });
    const r = textbookToRecords(tb)[0];
    expect(r.content).toContain('plain');
    expect(r.content).toContain('linktext');
    expect(r.content).toContain('alignment');
  });

  it('excludes non-textual inline nodes like equations from the indexable content', () => {
    // Equations stored as LaTeX would pollute search results with raw
    // markup ("x^2") that readers don't search for and that ranks
    // unpredictably.
    const tb = textbook({
      chapters: [
        chapter({
          sections: [
            section({
              nodes: [
                node('Paragraph', {}, [
                  span('intro to the topic, with enough characters to clear the minimum.'),
                  node('InlineEquation', { content: 'x^2' }),
                ]),
              ],
            }),
          ],
        }),
      ],
    });
    expect(textbookToRecords(tb)[0].content).not.toContain('x^2');
  });
});
