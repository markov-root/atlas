import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Chapter, Section, Textbook } from '../..';

// Mock the Typst subprocess so unit tests don't shell out.
const execSyncMock = vi.fn<(cmd: string, opts?: any) => Buffer | string>(() => Buffer.alloc(0));
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return { ...actual, execSync: execSyncMock };
});

// Mock the R2 push so we don't try to talk to S3.
const pushPublicFilesMock = vi.fn<
  (files: Map<string, string>, prefix: string, ct: string) => Promise<void>
>(async () => undefined);
vi.mock('../audio/r2-cache', () => ({
  pushPublicFiles: pushPublicFilesMock,
}));

const { Renderer } = await import('./renderer');

function section(num: number, partial: Partial<Section> = {}): Section {
  return {
    chapterNumber: 1,
    number: num,
    description: '',
    title: `Section ${num}`,
    slug: `s${num}`,
    toc: [],
    nodes: [],
    footnotes: [],
    readingTimeInSeconds: 60,
    prevSection: null,
    nextSection: null,
    ...partial,
  };
}

function chapter(num: number, sections: Section[], extra: Partial<Chapter> = {}): Chapter {
  return {
    title: `Chapter ${num}`,
    number: num,
    slug: `ch${num}`,
    sections,
    meta: {
      docId: 'd',
      tabId: 't',
      authors: [{ name: 'Jane Doe', affiliation: 'MIT' }],
      acknowledgements: [],
    },
    readingTimeInSeconds: 600,
    contentHash: 'hash-stable',
    ...extra,
  };
}

function textbook(chapters: Chapter[]): Textbook {
  return { version: 'v1', language: 'en', chapters, readingTimeInSeconds: 600 };
}

let tmpOut: string;

beforeEach(() => {
  tmpOut = mkdtempSync(join(tmpdir(), 'pdf-render-test-'));
  execSyncMock.mockClear();
  execSyncMock.mockReturnValue(Buffer.alloc(0));
  pushPublicFilesMock.mockClear();
});

afterEach(() => {
  rmSync(tmpOut, { recursive: true, force: true });
});

// Chapter titles and author names flow from Google Docs straight into the
// Typst source. Without escaping, an author name containing `*` or `#`
// would corrupt the PDF layout (or, in adversarial scenarios, inject Typst
// markup). If this fails, downloaded PDFs for chapters with special
// characters in titles/authors will render incorrectly or fail to compile.
describe('PDF Renderer — Typst escaping of user-supplied strings', () => {
  it('escapes Typst special characters in chapter title and author fields', () => {
    const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
    const ch = chapter(1, [section(1)]);
    ch.title = 'Title with *bold* and #hash';
    ch.meta = {
      ...ch.meta,
      authors: [{ name: 'Doe, *J.*', affiliation: 'MIT/CSAIL' }],
    };
    const src = r.generateChapter(ch);
    expect(src).toContain('chapter-title = "Title with \\*bold\\* and \\#hash"');
    expect(src).toContain('name: "Doe, \\*J.\\*"');
  });
});

// Acknowledgements are visible to PDF readers at the end of each chapter.
// Skipping the block when there are none avoids an empty "Acknowledgements"
// heading; appending it when there are some ensures contributors get
// credit. If this fails, readers either see stray empty sections or named
// contributors lose attribution in the PDF artifact.
describe('PDF Renderer — Acknowledgements visibility', () => {
  it('appends an Acknowledgements section when the chapter has acknowledgements', () => {
    const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
    const ch = chapter(1, [section(1)]);
    ch.meta = { ...ch.meta, acknowledgements: ['Alice', 'Bob', 'Carol'] };
    const src = r.generateChapter(ch);
    expect(src).toContain('Acknowledgements');
    expect(src).toContain('Alice');
    expect(src).toContain('Bob');
    expect(src).toContain('Carol');
  });

  it('omits the Acknowledgements section when the list is empty', () => {
    const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
    const ch = chapter(1, [section(1)]);
    const src = r.generateChapter(ch);
    expect(src).not.toContain('Acknowledgements');
  });
});

// Typst compilation runs as a subprocess at build time. If subprocess
// invocation breaks (wrong command, wrong stdin, wrong destination path),
// PDF generation silently fails or writes PDFs to the wrong location —
// readers either see stale PDFs or no PDFs at all. If this test fails, a
// contributor changing the PDF pipeline has broken the build's primary
// integration point with the Typst compiler.
describe('PDF Renderer — Typst subprocess invocation', () => {
  it('invokes typst with the chapter Typst source as stdin and writes to the expected path', async () => {
    const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
    const ch = chapter(5, [section(1)]);
    ch.contentHash = 'deadbeef';
    const url = await r.renderChapter(ch);

    expect(execSyncMock).toHaveBeenCalledTimes(1);
    const [cmd, opts] = execSyncMock.mock.calls[0];
    expect(cmd).toContain('typst compile');
    expect(cmd).toContain(join(tmpOut, 'atlas-chapter5-deadbeef.pdf'));
    expect(opts?.input).toContain('#let chapter-number = 5');
    expect(url).toBe('https://atlas.foreviewusercontent.com/pdf/atlas-chapter5-deadbeef.pdf');
  });

  it('short-circuits Typst invocation when the content-hashed PDF already exists locally', () => {
    // Content-hashed filenames are the cache key. If this short-circuit
    // breaks, every build will regenerate every chapter PDF — making maintainer
    // builds an order of magnitude slower and burning Typst CPU on no-ops.
    const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
    const ch = chapter(7, [section(1)]);
    ch.contentHash = 'cached-hash';
    const pdfPath = join(tmpOut, 'atlas-chapter7-cached-hash.pdf');
    mkdirSync(tmpOut, { recursive: true });
    writeFileSync(pdfPath, 'existing pdf bytes');

    return r.renderChapter(ch).then((url) => {
      expect(execSyncMock).not.toHaveBeenCalled();
      expect(url).toBe('https://atlas.foreviewusercontent.com/pdf/atlas-chapter7-cached-hash.pdf');
    });
  });

  it('rethrows Typst compilation failures with Google Doc context for the maintainer', async () => {
    // When Typst can't compile (usually because the source Google Doc has
    // unsupported markup), the maintainer needs to know which doc to fix.
    // If this fails, Typst errors land without a doc URL and debugging
    // requires manual grep through cache filenames.
    execSyncMock.mockImplementation(() => {
      throw new Error('typst syntax error');
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const r = new Renderer(textbook([]), '/tmp/assets', tmpOut);
      const ch = chapter(1, [section(1)]);
      ch.meta = { ...ch.meta, docId: 'abc123', tabId: 'tab1' };
      await expect(r.renderChapter(ch)).rejects.toThrow(/typst syntax error/);
      const errCalls = errSpy.mock.calls.flat().join(' ');
      expect(errCalls).toContain('abc123');
    } finally {
      errSpy.mockRestore();
    }
  });
});

// The end-to-end PDF pipeline: every chapter gets a pdfLink set to the
// CDN URL, and every successfully-rendered PDF gets pushed to the public
// R2 prefix. If this fails, the website displays "Download PDF" buttons
// pointing to URLs that 404, breaking a documented user-facing feature
// (offline reading).
describe('PDF Renderer — full pipeline links chapters and pushes to CDN', () => {
  it('sets chapter.pdfLink for each chapter and pushes PDFs to the public CDN prefix', async () => {
    const tb = textbook([
      chapter(1, [section(1)], { contentHash: 'h1' }),
      chapter(2, [section(1)], { contentHash: 'h2' }),
    ]);

    // Pretend typst writes the file
    execSyncMock.mockImplementation((cmd: string) => {
      const dest = /"([^"]+\.pdf)"/.exec(cmd)?.[1];
      if (dest) writeFileSync(dest, 'fake pdf bytes');
      return Buffer.alloc(0);
    });

    const r = new Renderer(tb, '/tmp/assets', tmpOut);
    await r.render();

    expect(tb.chapters[0].pdfLink).toBe(
      'https://atlas.foreviewusercontent.com/pdf/atlas-chapter1-h1.pdf',
    );
    expect(tb.chapters[1].pdfLink).toBe(
      'https://atlas.foreviewusercontent.com/pdf/atlas-chapter2-h2.pdf',
    );

    expect(pushPublicFilesMock).toHaveBeenCalledTimes(1);
    const [files, prefix, contentType] = pushPublicFilesMock.mock.calls[0];
    expect(prefix).toBe('pdf');
    expect(contentType).toBe('application/pdf');
    expect(files.size).toBe(2);
  });
});
