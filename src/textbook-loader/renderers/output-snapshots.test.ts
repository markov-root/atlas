import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TextbookLoader } from '../loader';
import { TEXTBOOK_EDITIONS } from '../data';
import { renderChapterToMarkdown } from './markdown-renderer';
import { Renderer as PdfRenderer } from './pdf/renderer';
import type { Chapter, Textbook } from '..';

const EDITION = TEXTBOOK_EDITIONS[0];
const FIRST_CHAPTER = EDITION.chapters[0];

// Snapshot the *full output format* of the renderers against a real
// cached chapter. The goal is to catch any regression that changes the
// rendered output — whether intentional (you'll update the snapshot) or
// accidental (you'll see a focused diff before merging). One snapshot
// per renderer replaces dozens of literal-string unit tests that each
// pinned a single node-type's output and broke on every refactor.
//
// If these tests fail on a PR:
//   - Markdown snapshot diff → the LLM-readable `.md` routes used by
//     scrapers (and the "Open as Markdown" download links) now produce
//     different content. Either intentional (update the snapshot and
//     mention it in the PR) or a regression in how AST nodes serialize.
//   - Typst snapshot diff → downloaded PDF chapters will render with a
//     different visual layout. Same rule: intentional changes get the
//     snapshot regenerated; accidental ones get reverted.
describe('Renderer outputs — full chapter snapshot regression check', () => {
  // The full pipeline runs the audio + PDF renderers; gate them off so
  // these tests only exercise the AST → text/typst conversion paths.
  const prevSkipPdf = process.env.SKIP_PDF;
  const prevSkipAudio = process.env.SKIP_AUDIO;
  const prevSkipAudioDownload = process.env.SKIP_AUDIO_DOWNLOAD;

  let textbook: Textbook;
  let chapter: Chapter;

  beforeAll(async () => {
    process.env.SKIP_PDF = '1';
    process.env.SKIP_AUDIO = '1';
    process.env.SKIP_AUDIO_DOWNLOAD = '1';

    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    textbook = await loader.load();
    const found = textbook.chapters.find((c) => c.meta.docId === FIRST_CHAPTER.docId);
    if (!found) throw new Error('First chapter not found in loaded textbook');
    chapter = found;
  }, 30_000);

  afterAll(() => {
    if (prevSkipPdf === undefined) delete process.env.SKIP_PDF;
    else process.env.SKIP_PDF = prevSkipPdf;
    if (prevSkipAudio === undefined) delete process.env.SKIP_AUDIO;
    else process.env.SKIP_AUDIO = prevSkipAudio;
    if (prevSkipAudioDownload === undefined) delete process.env.SKIP_AUDIO_DOWNLOAD;
    else process.env.SKIP_AUDIO_DOWNLOAD = prevSkipAudioDownload;
  });

  it('renderChapterToMarkdown produces stable markdown for the first chapter', () => {
    const md = renderChapterToMarkdown(chapter, 'https://example.com/chapters/v1/test');
    expect(md).toMatchSnapshot();
  });

  it('PdfRenderer.generateChapter produces stable Typst source for the first chapter', () => {
    const r = new PdfRenderer(textbook, 'src/assets/uc', '/tmp/atlas-pdf-test');
    const typst = r.generateChapter(chapter);
    expect(typst).toMatchSnapshot();
  });
});
