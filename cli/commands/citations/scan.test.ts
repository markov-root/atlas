/**
 * The TypeScript→Python handoff file (`task:0029` D1).
 *
 * These tests guard the boundary contract rather than the extraction it wraps —
 * extraction has its own suite. What matters here is that the shape Python's
 * `scan.py` expects is the shape this writes, and in particular that
 * `authorYear` travels in the file. That field is why the handoff is a built
 * structure rather than a raw dump: `author-year.ts` holds the single definition
 * of a citation anchor, shared with the audio renderer (`task:0025` AC-6), and
 * reimplementing it on the Python side would fork it.
 */
import { describe, it, expect } from 'vitest';
import { buildScan } from './scan';
import type { Node } from '../../../src/textbook-loader/transformer';
import type { Chapter, Section } from '../../../src/textbook-loader/index';

const link = (href: string, content: string): Node => ({
  name: 'Link',
  attributes: { href, content },
  children: [],
});

const para = (...children: Node[]): Node => ({ name: 'Paragraph', attributes: {}, children });

function section(number: number, nodes: Node[]): Section {
  return {
    chapterNumber: 1,
    number,
    slug: `section-${number}`,
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

function chapter(sections: Section[]): Chapter {
  return {
    number: 1,
    slug: 'capabilities',
    title: 'Capabilities',
    sections,
  } as Chapter;
}

const CITED = 'https://arxiv.org/abs/1911.01547';

describe('buildScan — the handoff contract', () => {
  it('carries the schema version Python checks', () => {
    expect(buildScan([]).schemaVersion).toBe(1);
  });

  it('preserves chapter and section identity, which locations are built from', () => {
    const scan = buildScan([chapter([section(2, [])])]);
    expect(scan.chapters[0]).toMatchObject({
      number: 1,
      title: 'Capabilities',
      slug: 'capabilities',
    });
    expect(scan.chapters[0].sections[0]).toMatchObject({ number: 2, title: 'Section 2' });
  });

  it('includes the author-year parse, so Python never reimplements the pattern', () => {
    const scan = buildScan([chapter([section(1, [para(link(CITED, 'Chollet, 2019'))])])]);
    const [c] = scan.chapters[0].sections[0].citations;
    expect(c.authorYear).toEqual({ author: 'Chollet', year: '2019' });
  });

  it('reports a null parse rather than omitting the field', () => {
    // Python counts a citation-kind instance with a null parse as malformed, so
    // the key must always be present: an absent one would read as "not a
    // citation" rather than "a citation we could not parse".
    const scan = buildScan([
      chapter([section(1, [para(link('https://example.org/guide', 'available here'))])]),
    ]);
    const [c] = scan.chapters[0].sections[0].citations;
    expect('authorYear' in c).toBe(true);
    expect(c.authorYear).toBeNull();
  });

  it('carries every citation kind across the boundary, including the ones Python ignores', () => {
    const scan = buildScan([
      chapter([
        section(1, [
          para(link(CITED, 'Chollet, 2019')),
          para(link('https://example.org/guide', 'available here')),
          para(link('https://example.org/x.png', 'a figure')),
        ]),
      ]),
    ]);
    const kinds = scan.chapters[0].sections[0].citations.map((c) => c.kind);
    expect(kinds).toEqual(['citation', 'content-link', 'asset']);
  });

  it('falls back to a derived slug when a chapter has none', () => {
    const scan = buildScan([{ ...chapter([]), slug: '' } as Chapter]);
    expect(scan.chapters[0].slug).toBe('chapter-1');
  });

  it('survives a JSON round trip unchanged — it is written and read as a file', () => {
    const scan = buildScan([chapter([section(1, [para(link(CITED, 'Chollet, 2019'))])])]);
    expect(JSON.parse(JSON.stringify(scan))).toEqual(scan);
  });

  it('is deterministic, so re-scanning unchanged documents rewrites identical bytes', () => {
    const chapters = [chapter([section(1, [para(link(CITED, 'Chollet, 2019'))])])];
    expect(JSON.stringify(buildScan(chapters))).toBe(JSON.stringify(buildScan(chapters)));
  });
});
