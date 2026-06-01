import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TextbookLoader } from "./loader";
import { TEXTBOOK_EDITIONS } from "./data";

const EDITION = TEXTBOOK_EDITIONS[0];
const FIRST_CHAPTER = EDITION.chapters[0];

// Exercises the contributor build path end-to-end against the committed
// .cache/docs/ snapshot — null credentials, cacheOnly mode.
describe("TextbookLoader (contributor / cacheOnly)", () => {
  const prevSkipPdf = process.env.SKIP_PDF;
  const prevSkipAudio = process.env.SKIP_AUDIO;
  const prevSkipAudioDownload = process.env.SKIP_AUDIO_DOWNLOAD;

  beforeAll(() => {
    // The full load() runs the PDF and audio renderers. We don't want
    // typst or R2 traffic during unit tests.
    process.env.SKIP_PDF = "1";
    process.env.SKIP_AUDIO = "1";
    process.env.SKIP_AUDIO_DOWNLOAD = "1";
  });

  afterAll(() => {
    if (prevSkipPdf === undefined) delete process.env.SKIP_PDF;
    else process.env.SKIP_PDF = prevSkipPdf;
    if (prevSkipAudio === undefined) delete process.env.SKIP_AUDIO;
    else process.env.SKIP_AUDIO = prevSkipAudio;
    if (prevSkipAudioDownload === undefined) delete process.env.SKIP_AUDIO_DOWNLOAD;
    else process.env.SKIP_AUDIO_DOWNLOAD = prevSkipAudioDownload;
  });

  it("loadChapter returns a fully-populated chapter from cache", async () => {
    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    const chapter = await loader.loadChapter(FIRST_CHAPTER);

    expect(chapter.title).toBeTruthy();
    expect(typeof chapter.title).toBe("string");
    expect(chapter.slug).toBeTruthy();
    expect(typeof chapter.number).toBe("number");
    expect(chapter.sections.length).toBeGreaterThan(0);
    expect(chapter.readingTimeInSeconds).toBeGreaterThan(0);
    expect(chapter.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(chapter.meta).toBe(FIRST_CHAPTER);
  });

  it("sections have nodes, footnotes array, and reading time", async () => {
    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    const chapter = await loader.loadChapter(FIRST_CHAPTER);

    for (const section of chapter.sections) {
      expect(section.title).toBeTruthy();
      expect(section.slug).toBeTruthy();
      expect(Array.isArray(section.nodes)).toBe(true);
      expect(section.nodes.length).toBeGreaterThan(0);
      expect(Array.isArray(section.footnotes)).toBe(true);
      expect(section.readingTimeInSeconds).toBeGreaterThanOrEqual(0);
    }
  });

  it("loadGlossary returns entries (used to cross-link inline terms)", async () => {
    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    const glossary = await loader.loadGlossary();

    expect(Array.isArray(glossary)).toBe(true);
    expect(glossary.length).toBeGreaterThan(0);
    for (const entry of glossary) {
      expect(entry.term).toBeTruthy();
      expect(entry.definition).toBeTruthy();
      expect(Array.isArray(entry.aliases)).toBe(true);
    }
  });

  it("contentHash is deterministic across fresh loader instances", async () => {
    // The Transformer accumulates per-textbook counters (figure numbers etc.)
    // so calling loadChapter twice on the SAME loader would NOT match. The
    // invariant we care about is: same cached source + fresh loader →
    // same hash. That keeps CI rebuilds reproducible.
    const a = await new TextbookLoader(null, EDITION, { cacheOnly: true }).loadChapter(FIRST_CHAPTER);
    const b = await new TextbookLoader(null, EDITION, { cacheOnly: true }).loadChapter(FIRST_CHAPTER);
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("load() returns a complete Textbook with cross-linked sections", async () => {
    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    const textbook = await loader.load();

    expect(textbook.version).toBe(EDITION.version);
    expect(textbook.language).toBe(EDITION.language);
    expect(textbook.chapters.length).toBe(EDITION.chapters.length);
    expect(textbook.readingTimeInSeconds).toBeGreaterThan(0);

    const allSections = textbook.chapters.flatMap((c) => c.sections);
    // First section has no prev; last has no next; everything else is linked
    // both ways.
    expect(allSections[0].prevSection).toBeNull();
    expect(allSections[allSections.length - 1].nextSection).toBeNull();
    for (let i = 0; i < allSections.length - 1; i++) {
      expect(allSections[i].nextSection).not.toBeNull();
      expect(allSections[i + 1].prevSection).not.toBeNull();
    }
  }, 30_000);

  it("attempting to load with a fake docId fails with a useful error", async () => {
    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    await expect(
      loader.loadChapter({ ...FIRST_CHAPTER, docId: "non-existent-fake-doc" }),
    ).rejects.toThrow(/non-existent-fake-doc/);
  });
});
