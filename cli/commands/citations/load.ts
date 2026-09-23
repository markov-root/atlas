/**
 * Loading the textbook for citation commands.
 *
 * Kept separate from the formatters so those stay pure and unit-testable. This
 * is the only file in the citations commands that touches the world.
 *
 * Every citation command is a **read** of already-committed content. The env
 * guards below are not an optimization - without them, loading a chapter runs
 * the PDF and audio renderers, and the audio renderer's phases 7 and 8 push to
 * production R2 (`task:0022`). A command that lists URLs must not be able to
 * overwrite published audio, so it disables those paths before loading rather
 * than trusting the ambient environment to be safe.
 */
import { TextbookLoader } from '../../../src/textbook-loader/loader.js';
import { TEXTBOOK_EDITIONS } from '../../../src/textbook-loader/data.js';
import type { Chapter } from '../../../src/textbook-loader/index.js';

export async function loadChaptersFromCache(): Promise<Chapter[]> {
  process.env.SKIP_PDF = '1';
  process.env.SKIP_AUDIO = '1';
  process.env.SKIP_AUDIO_DOWNLOAD = '1';

  const edition = TEXTBOOK_EDITIONS[0];
  // cacheOnly with null credentials: reads the committed .cache/docs/ snapshot
  // and never reaches Google. This is the contributor path, so the command
  // works in a fresh clone with an empty .env.
  const loader = new TextbookLoader(null, edition, { cacheOnly: true });

  const chapters: Chapter[] = [];
  for (const meta of edition.chapters) {
    chapters.push(await loader.loadChapter(meta));
  }
  return chapters;
}
