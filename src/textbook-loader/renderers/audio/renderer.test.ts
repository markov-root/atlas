import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Chapter, Section, Textbook } from '../..';
import type { Node } from '../../transformer';

// Mock the network-touching modules so the audio renderer can be unit-tested
// without ElevenLabs / Gemini / R2 connectivity.

const pullFromR2Mock = vi.fn<(keys: Set<string>) => Promise<void>>(async () => undefined);
const pushToR2Mock = vi.fn<() => Promise<void>>(async () => undefined);
const pullFinalAudioBatchMock = vi.fn<
  (files: { key: string; destPath: string }[]) => Promise<void>
>(async () => undefined);
const pushFinalAudioFilesMock = vi.fn<(files: Map<string, string>) => Promise<void>>(
  async () => undefined,
);
const pushPublicFilesMock = vi.fn<
  (files: Map<string, string>, prefix: string, ct: string) => Promise<void>
>(async () => undefined);

vi.mock('./r2-cache', () => ({
  pullFromR2: pullFromR2Mock,
  pushToR2: pushToR2Mock,
  pullFinalAudioBatch: pullFinalAudioBatchMock,
  pushFinalAudioFiles: pushFinalAudioFilesMock,
  pushPublicFiles: pushPublicFilesMock,
}));

const synthesizeMock = vi.fn<(paragraphs: string[]) => Promise<Buffer>>(async () =>
  Buffer.alloc(0),
);
const mp3ToNormalizedMock = vi.fn();
const concatenateMock = vi.fn();
const hashTextMock = vi.fn((text: string) => `hash-of-${text.length}`);
const isCachedMock = vi.fn(() => false);

vi.mock('./elevenlabs-tts', () => ({
  ElevenLabsTTS: class {
    synthesizeParagraphs = synthesizeMock;
    mp3ToNormalizedMp3 = mp3ToNormalizedMock;
    concatenateMp3s = concatenateMock;
    hashText = hashTextMock;
    isCached = isCachedMock;
  },
}));

const batchFetchMock = vi.fn(async () => undefined);
const queueMock = vi.fn();
vi.mock('./equation-describer', () => ({
  EquationDescriber: class {
    queue = queueMock;
    batchFetch = batchFetchMock;
    hashLatex = (s: string) => `eqhash-${s.length}`;
    getDescription = () => null;
  },
}));

const { Renderer } = await import('./renderer');

function node(name: string, attrs: Record<string, unknown> = {}, children: Node[] = []): Node {
  return { name, attributes: attrs, children };
}
const span = (s: string) => node('Span', { content: s });
const para = (s: string) => node('Paragraph', {}, [span(s)]);

function section(num: number, partial: Partial<Section> = {}): Section {
  return {
    chapterNumber: 1,
    number: num,
    description: '',
    title: `Section ${num}`,
    slug: `s${num}`,
    toc: [],
    nodes: [para('Body of section.')],
    footnotes: [],
    readingTimeInSeconds: 60,
    prevSection: null,
    nextSection: null,
    ...partial,
  };
}

function chapter(num: number, sections: Section[]): Chapter {
  return {
    title: `Chapter ${num}`,
    number: num,
    slug: `ch${num}`,
    sections,
    meta: { docId: 'd', tabId: 't', authors: [], acknowledgements: [] },
    readingTimeInSeconds: 600,
    contentHash: 'abc',
  };
}

function textbook(chapters: Chapter[]): Textbook {
  return { version: 'v1', language: 'en', chapters, readingTimeInSeconds: 600 };
}

let tmpOut: string;
const ENV_KEYS = ['SKIP_AUDIO_DOWNLOAD', 'ELEVENLABS_API_KEY', 'GEMINI_API_KEY'] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  tmpOut = mkdtempSync(join(tmpdir(), 'audio-render-test-'));
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];

  pullFromR2Mock.mockClear();
  pushToR2Mock.mockClear();
  pullFinalAudioBatchMock.mockClear();
  pushFinalAudioFilesMock.mockClear();
  pushPublicFilesMock.mockClear();
  synthesizeMock.mockClear();
  mp3ToNormalizedMock.mockClear();
  concatenateMock.mockClear();
  hashTextMock.mockClear();
  isCachedMock.mockClear();
  batchFetchMock.mockClear();
  queueMock.mockClear();
});

afterEach(() => {
  rmSync(tmpOut, { recursive: true, force: true });
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

// Contributors on low-bandwidth or air-gapped machines need to be able to
// run `pnpm build` without the audio pipeline reaching out to Cloudflare R2
// for cache hydration. The SKIP_AUDIO_DOWNLOAD=1 escape hatch fully disables
// audio output. If this breaks, contributor builds will either fail
// trying to reach R2 (no credentials) or surprise the contributor by
// emitting network traffic they explicitly opted out of.
describe('audio Renderer — SKIP_AUDIO_DOWNLOAD escape hatch', () => {
  it('clears every section.audioLink and chapter.audioLink without any R2 network calls', async () => {
    process.env.SKIP_AUDIO_DOWNLOAD = '1';
    const tb = textbook([
      chapter(1, [section(1, { audioLink: 'leftover' }), section(2, { audioLink: 'leftover2' })]),
    ]);
    tb.chapters[0].audioLink = 'leftover-chapter';

    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: true });
    await r.render();

    expect(tb.chapters[0].audioLink).toBeUndefined();
    for (const s of tb.chapters[0].sections) {
      expect(s.audioLink).toBeUndefined();
    }
    expect(pullFromR2Mock).not.toHaveBeenCalled();
    expect(pullFinalAudioBatchMock).not.toHaveBeenCalled();
    expect(pushToR2Mock).not.toHaveBeenCalled();
    expect(pushFinalAudioFilesMock).not.toHaveBeenCalled();
    expect(pushPublicFilesMock).not.toHaveBeenCalled();
  });

  it('only fires when both skipGeneration and SKIP_AUDIO_DOWNLOAD are set (otherwise the build still tries the cache)', async () => {
    // The escape hatch is intentionally narrow: a maintainer running a
    // full build with SKIP_AUDIO_DOWNLOAD accidentally set should still
    // attempt the R2 cache so they notice the misconfiguration via missing
    // audio rather than silent skipping.
    process.env.SKIP_AUDIO_DOWNLOAD = '1';
    const tb = textbook([chapter(1, [section(1)])]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: false });
    await r.render();
    expect(
      pullFromR2Mock.mock.calls.length + pullFinalAudioBatchMock.mock.calls.length,
    ).toBeGreaterThan(0);
  });
});

// `skipGeneration` is the standard contributor mode — no API keys, no TTS
// synthesis, but the build should still attempt to hydrate cached audio
// from R2 so contributors with R2 read access (and CI) can preview audio.
// If these contracts break, contributors will either trigger unwanted
// ElevenLabs/Gemini API calls (cost + key requirement) or get a build
// missing audio they should have received from cache.
describe('audio Renderer — skipGeneration contributor mode', () => {
  it('never invokes ElevenLabs synthesis when skipGeneration is true', async () => {
    const tb = textbook([chapter(1, [section(1), section(2)])]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: true });
    await r.render();
    expect(synthesizeMock).not.toHaveBeenCalled();
    expect(mp3ToNormalizedMock).not.toHaveBeenCalled();
  });

  it('clears every section.audioLink when no audio is available from cache or R2', async () => {
    // A reader landing on a section with audioLink pointing to a 404 sees
    // a broken player. Better to mark the section as audio-less so the UI
    // hides the player entirely.
    const tb = textbook([chapter(1, [section(1), section(2)])]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: true });
    await r.render();
    for (const s of tb.chapters[0].sections) {
      expect(s.audioLink).toBeUndefined();
    }
  });

  it('attempts both content-hashed and stable-key R2 keys so contributors get stale-but-usable audio', async () => {
    // Content-hashed key serves an exactly-matching cached file; stable-key
    // fallback serves the last-known audio for a section so contributors
    // don't see audio disappear after every prose edit they make.
    const tb = textbook([chapter(1, [section(1)])]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: true });
    await r.render();
    const allKeys = pullFinalAudioBatchMock.mock.calls.flatMap((c) =>
      c[0].map((entry: { key: string }) => entry.key),
    );
    expect(allKeys).toContain('final-audio/ch1-s1.mp3');
    expect(allKeys.some((k) => /final-audio\/ch1-s1-.+\.mp3/.test(k))).toBe(true);
  });
});

// Equations are pre-fetched as a batch before chapter rendering begins so
// that content hashes are deterministic and so the rate-limited Gemini API
// is called efficiently. If the equation pipeline runs (or doesn't run)
// against contributor expectations, builds either hit Gemini surprise costs
// or produce audio with raw LaTeX read aloud — both observable defects.
describe('audio Renderer — equation pre-fetch gating', () => {
  it('queues every equation on the describer before rendering when generation is enabled', async () => {
    process.env.ELEVENLABS_API_KEY = 'fake-key';
    process.env.GEMINI_API_KEY = 'fake-gemini';
    const tb = textbook([
      chapter(1, [
        section(1, {
          nodes: [
            para('Some prose.'),
            node('InlineEquation', { content: 'x^2' }),
            node('DisplayEquation', { content: 'E=mc^2' }),
          ],
        }),
      ]),
    ]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: false });
    await r.render();
    expect(queueMock).toHaveBeenCalledTimes(2);
    expect(batchFetchMock).toHaveBeenCalled();
  });

  it('skips the equation pre-fetch entirely in contributor (skipGeneration) mode', async () => {
    // Contributor builds without API keys must not attempt to reach Gemini.
    const tb = textbook([
      chapter(1, [
        section(1, {
          nodes: [para('Some prose.'), node('InlineEquation', { content: 'x^2' })],
        }),
      ]),
    ]);
    const r = new Renderer(tb, '/tmp/assets', tmpOut, { skipGeneration: true });
    await r.render();
    expect(queueMock).not.toHaveBeenCalled();
    expect(batchFetchMock).not.toHaveBeenCalled();
  });
});
