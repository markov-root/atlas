import { describe, it, expect } from 'vitest';
import { Transformer } from './transformer';
import type { docs_v1 } from 'googleapis';

// Minimal helpers to build Google Docs structural elements.
// The transformer only reads paragraphStyle.namedStyleType and textRun.content
// on the chapter-extraction path, so we don't need a full Schema$DocumentTab.

type StyleType = 'TITLE' | 'SUBTITLE' | 'HEADING_1' | 'HEADING_2' | 'NORMAL_TEXT';

function para(style: StyleType, text: string): docs_v1.Schema$StructuralElement {
  return {
    paragraph: {
      paragraphStyle: { namedStyleType: style },
      elements: [{ textRun: { content: text } }],
    },
  };
}

const EMPTY_TAB = {} as docs_v1.Schema$DocumentTab;

function transformBody(body: docs_v1.Schema$StructuralElement[]) {
  return new Transformer(EMPTY_TAB, new Map(), []).transformChapter(body);
}

// These tests pin down what happens at the boundary where Google Docs
// content meets the loader. Many failures here are *silent* today (the
// transformer falls back to defaults: `title='Untitled'`, `number=0`,
// zero sections). The tests document this so a future "fail loudly"
// refactor is visible — AND so a contributor changing the parser knows
// which boundary behaviors they must preserve or deliberately change.
//
// Reader-facing consequences if these tests fail:
//   - Wrong title parsing → chapter ships with "Untitled" / number 0 in
//     reader-visible breadcrumbs, navigation, and search hierarchy.
//   - Wrong heading parsing → sections collapse together or disappear
//     from the table of contents.
//   - Wrong control-char handling → mojibake in chapter titles on the
//     rendered page.

// Chapter title and number flow from Google Docs straight into reader-
// facing metadata: navigation breadcrumbs, search results, "Chapter N"
// labels on every page. If this test fails, a content edit to the doc
// title silently degrades reader-facing labels site-wide.
describe('Transformer.transformChapter — title parsing', () => {
  it("parses the canonical 'Chapter N - Title' form", () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 3 - Capabilities and Risks'),
      para('HEADING_1', 'Intro'),
    ]);
    expect(ch.title).toBe('Capabilities and Risks');
    expect(ch.number).toBe(3);
  });

  it("falls back to default title/number when separator is ':' instead of ' - '", () => {
    // KNOWN FOOTGUN: regex /Chapter N - Title/ doesn't match 'Chapter N: Title'.
    // Today this is silent; a content author renaming a doc could brick metadata.
    // Test pins down current behavior so a future "fail loudly" refactor is visible.
    const ch = transformBody([
      para('TITLE', 'Chapter 3: Capabilities and Risks'),
      para('HEADING_1', 'Intro'),
    ]);
    expect(ch.title).toBe('Untitled');
    expect(ch.number).toBe(0);
  });

  it('falls back when the TITLE uses an em-dash instead of a hyphen', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 3 — Capabilities and Risks'),
      para('HEADING_1', 'Intro'),
    ]);
    expect(ch.title).toBe('Untitled');
    expect(ch.number).toBe(0);
  });

  it("falls back when there is no 'Chapter N' prefix (e.g. 'Introduction')", () => {
    const ch = transformBody([para('TITLE', 'Introduction'), para('HEADING_1', 'Welcome')]);
    expect(ch.title).toBe('Untitled');
    expect(ch.number).toBe(0);
  });

  it("falls back on appendix-style titles ('Appendix A - References')", () => {
    // No 'Chapter N' prefix → regex misses. Documents the appendix-handling gap.
    const ch = transformBody([
      para('TITLE', 'Appendix A - References'),
      para('HEADING_1', 'Bibliography'),
    ]);
    expect(ch.title).toBe('Untitled');
    expect(ch.number).toBe(0);
  });

  it('accepts arbitrary chapter numbers including double digits', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 12 - Late Chapter'),
      para('HEADING_1', 'Section'),
    ]);
    expect(ch.number).toBe(12);
    expect(ch.title).toBe('Late Chapter');
  });

  it('ignores extra TITLE-styled paragraphs (only the matching one wins)', () => {
    // If a doc has two TITLE paragraphs, the regex applies to each in order;
    // the last matching one overwrites. Pins down current behavior.
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - First'),
      para('TITLE', 'Chapter 2 - Second'),
      para('HEADING_1', 'Body'),
    ]);
    expect(ch.title).toBe('Second');
    expect(ch.number).toBe(2);
  });
});

// SUBTITLE in the Google Doc becomes `chapter.description` — used in
// chapter index pages, social-share previews, and the LLM-readable .md
// route. If this test fails, descriptions silently vanish or duplicate
// across chapters.
describe('Transformer.transformChapter — SUBTITLE handling', () => {
  it('populates chapter.description when SUBTITLE is present', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('SUBTITLE', 'A one-line description.'),
      para('HEADING_1', 'Intro'),
    ]);
    expect(ch.description).toBe('A one-line description.');
  });

  it('leaves chapter.description empty when SUBTITLE is absent', () => {
    // Current behavior: empty string default. Not loud — content author may
    // have intentionally omitted a subtitle, so silence is the right call here.
    const ch = transformBody([para('TITLE', 'Chapter 1 - Title'), para('HEADING_1', 'Intro')]);
    expect(ch.description).toBe('');
  });

  it('the last SUBTITLE wins if there are multiple', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('SUBTITLE', 'first'),
      para('SUBTITLE', 'second'),
      para('HEADING_1', 'Intro'),
    ]);
    expect(ch.description).toBe('second');
  });
});

// HEADING_1 paragraphs become reader-visible sections — each with its
// own URL, audio file, PDF, and search-result entry. If section
// extraction breaks, readers either see merged sections (lost
// navigation), or chapters render as a wall of text with no anchors.
describe('Transformer.transformChapter — section headings (HEADING_1)', () => {
  it('creates one section per HEADING_1', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('HEADING_1', 'First Section'),
      para('HEADING_1', 'Second Section'),
      para('HEADING_1', 'Third Section'),
    ]);
    expect(ch.sections.length).toBe(3);
    expect(ch.sections.map((s) => s.title)).toEqual([
      'First Section',
      'Second Section',
      'Third Section',
    ]);
  });

  it('produces a chapter with zero sections when no HEADING_1 is present', () => {
    // FOOTGUN: this is silent. A doc with only TITLE+SUBTITLE produces an
    // empty-sections chapter; many downstream code paths assume `sections[0]`
    // exists and will crash later. Pinned down here to make a future
    // "throw on empty" refactor visible.
    const ch = transformBody([para('TITLE', 'Chapter 1 - Title'), para('SUBTITLE', 'desc')]);
    expect(ch.sections.length).toBe(0);
  });

  it('skips empty HEADING_1 paragraphs (whitespace-only titles)', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('HEADING_1', '   '),
      para('HEADING_1', 'Real Section'),
    ]);
    expect(ch.sections.length).toBe(1);
    expect(ch.sections[0].title).toBe('Real Section');
  });

  it('assigns chapterNumber to all sections after extraction', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 7 - Title'),
      para('HEADING_1', 'First'),
      para('HEADING_1', 'Second'),
    ]);
    for (const s of ch.sections) {
      expect(s.chapterNumber).toBe(7);
    }
  });

  it('section slugs are derived from titles via slugify', () => {
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('HEADING_1', 'First Section!'),
    ]);
    expect(ch.sections[0].slug).toMatch(/^[a-z0-9-]+$/);
  });
});

// HEADING_2 paragraphs that appear before the first HEADING_1 are an
// editorial mistake — but they shouldn't crash the build or get
// promoted into top-level sections. If this test fails, a content
// author with a stray sub-heading at the top of a doc would either
// brick the build or accidentally create a phantom navigation entry.
describe('Transformer.transformChapter — HEADING_2 at chapter-extraction level', () => {
  it('does not create a section for a HEADING_2 before any HEADING_1', () => {
    // KNOWN FOOTGUN: HEADING_2 paragraphs that appear before the first
    // HEADING_1 trigger the "Unexpected early element" console warn and
    // get dropped. Documents the current handling so a future loud
    // failure mode is visible.
    const ch = transformBody([
      para('TITLE', 'Chapter 1 - Title'),
      para('HEADING_2', 'Stray sub-heading'),
      para('HEADING_1', 'Real Section'),
    ]);
    expect(ch.sections.length).toBe(1);
    expect(ch.sections[0].title).toBe('Real Section');
  });
});

// Defensive handling: empty bodies, sectionBreak elements (which Google
// Docs inserts at column/page boundaries), and stray control characters
// in titles. If these fail, an edge-case Google Doc — for example a
// chapter currently being drafted with no content yet — would crash
// the build instead of producing an empty placeholder chapter.
describe('Transformer.transformChapter — robustness', () => {
  it('handles an empty body without throwing', () => {
    const ch = transformBody([]);
    expect(ch.title).toBe('Untitled');
    expect(ch.number).toBe(0);
    expect(ch.sections).toEqual([]);
  });

  it('ignores sectionBreak elements', () => {
    const ch = transformBody([
      { sectionBreak: {} } as docs_v1.Schema$StructuralElement,
      para('TITLE', 'Chapter 1 - Title'),
      { sectionBreak: {} } as docs_v1.Schema$StructuralElement,
      para('HEADING_1', 'Body'),
    ]);
    expect(ch.title).toBe('Title');
    expect(ch.sections.length).toBe(1);
  });

  it('strips control characters from TITLE text before regex match', () => {
    // The transformer applies stripControlChars in getTrimmedString.
    // A stray form-feed in the doc shouldn't break the chapter regex.
    const ch = transformBody([
      {
        paragraph: {
          paragraphStyle: { namedStyleType: 'TITLE' },
          elements: [{ textRun: { content: 'Chapter 5 - Has\x0Bcontrol\x0Cchars' } }],
        },
      },
      para('HEADING_1', 'Body'),
    ]);
    expect(ch.number).toBe(5);
    expect(ch.title).toBe('Hascontrolchars');
  });
});
