import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';

// Mock the AWS SDK before importing r2-cache so the module captures our mocks.
const sendMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = sendMock;
  }
  class GetObjectCommand {
    input: any;
    constructor(input: any) {
      this.input = input;
    }
  }
  class PutObjectCommand {
    input: any;
    constructor(input: any) {
      this.input = input;
    }
  }
  class ListObjectsV2Command {
    input: any;
    constructor(input: any) {
      this.input = input;
    }
  }
  return { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command };
});

const R2_ENV = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'] as const;
const savedEnv: Record<string, string | undefined> = {};

function setR2Env() {
  process.env.R2_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
  process.env.R2_ACCESS_KEY_ID = 'access-key';
  process.env.R2_SECRET_ACCESS_KEY = 'secret-key';
  process.env.R2_BUCKET = 'atlas-cache';
}

function unsetR2Env() {
  for (const k of R2_ENV) delete process.env[k];
}

beforeEach(() => {
  for (const k of R2_ENV) savedEnv[k] = process.env[k];
  sendMock.mockReset();
});

afterEach(() => {
  for (const k of R2_ENV) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

const { pullFromR2, pushToR2, pullFinalAudioBatch, pushFinalAudioFiles, pushPublicFiles } =
  await import('./r2-cache');

function asyncBody(content: string) {
  const buf = Buffer.from(content);
  return {
    [Symbol.asyncIterator]() {
      let yielded = false;
      return {
        async next(): Promise<IteratorResult<Uint8Array>> {
          if (yielded) return { value: undefined as unknown as Uint8Array, done: true };
          yielded = true;
          return { value: new Uint8Array(buf), done: false };
        },
      };
    },
  };
}

// Every R2 entry point must be a no-op when R2 credentials are not
// configured. The textbook is built by both maintainers (with R2 creds)
// and contributors (without). If any of these functions tries to talk to
// R2 in contributor mode, the build either fails outright with a
// confusing AWS-SDK error, or — worse — leaks an attempted request that
// surprises the contributor. The build must never reach R2 without
// explicit credentials.
describe('r2-cache — every public function is a no-op without R2 credentials', () => {
  beforeEach(() => unsetR2Env());

  it.each([
    ['pullFromR2', () => pullFromR2(new Set(['audio-chunks/some.pcm']))],
    ['pushToR2', () => pushToR2()],
    [
      'pullFinalAudioBatch',
      () => pullFinalAudioBatch([{ key: 'final-audio/x.mp3', destPath: '/tmp/x.mp3' }]),
    ],
    ['pushFinalAudioFiles', () => pushFinalAudioFiles(new Map([['k', '/tmp/x.mp3']]))],
    ['pushPublicFiles', () => pushPublicFiles(new Map([['k', '/tmp/x']]), 'audio', 'audio/mpeg')],
  ])('%s makes zero S3 calls when credentials are missing', async (_name, fn) => {
    await fn();
    expect(sendMock).not.toHaveBeenCalled();
  });
});

// pullFromR2 hydrates the local audio-chunk cache from R2 so that
// subsequent builds skip re-synthesis. The contract has two parts:
// (1) skip downloads when the file already exists locally (preserves
// build speed and avoids unnecessary R2 GET cost), and (2) when R2
// returns NoSuchKey, treat it as "new content, fine" rather than an
// error. If either breaks, builds either become slow / costly, or fail
// the first time a new equation or paragraph is encountered.
describe('r2-cache.pullFromR2 — hydrates local cache without re-downloading or erroring on misses', () => {
  beforeEach(() => setR2Env());

  it('only downloads keys whose local file is missing', async () => {
    const cacheDir = join(process.cwd(), '.cache', 'audio-chunks');
    mkdirSync(cacheDir, { recursive: true });
    const existing = join(cacheDir, '__test-r2-existing.pcm');
    writeFileSync(existing, 'already cached');

    const missingKey = 'audio-chunks/__test-r2-missing.pcm';
    const missingPath = join(process.cwd(), '.cache', missingKey);

    sendMock.mockResolvedValueOnce({ Body: asyncBody('downloaded content') });

    try {
      await pullFromR2(new Set(['audio-chunks/__test-r2-existing.pcm', missingKey]));
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(readFileSync(missingPath, 'utf-8')).toBe('downloaded content');
    } finally {
      for (const p of [existing, missingPath]) if (existsSync(p)) unlinkSync(p);
    }
  });

  it('treats a NoSuchKey error as expected (new content first-seen) rather than failing the build', async () => {
    const missingKey = 'audio-chunks/__test-r2-nosuchkey.pcm';
    const missingPath = join(process.cwd(), '.cache', missingKey);
    if (existsSync(missingPath)) unlinkSync(missingPath);

    const err: any = new Error('NoSuchKey');
    err.name = 'NoSuchKey';
    sendMock.mockRejectedValueOnce(err);

    await pullFromR2(new Set([missingKey]));
    expect(existsSync(missingPath)).toBe(false);
  });
});

// pushPublicFiles uploads audio/PDF artifacts to the CDN-facing R2 prefix.
// Two contracts matter to readers: (1) the Content-Type must match the
// asset (audio/mpeg, application/pdf) so browsers stream/download
// correctly, and (2) already-present files are skipped so a maintainer
// re-running a build doesn't burn bandwidth re-uploading 100+ MB of
// unchanged audio. If these break, readers either see broken downloads
// or maintainer builds become unworkably slow.
describe('r2-cache.pushPublicFiles — content-type and skip-existing contract', () => {
  beforeEach(() => setR2Env());

  it('skips files already present in R2 and sets Content-Type on the ones it uploads', async () => {
    const tmp = join(process.cwd(), '.cache', '__test-public-upload');
    writeFileSync(tmp, 'asset bytes');

    sendMock.mockImplementationOnce(async () => ({
      Contents: [{ Key: 'audio/existing.mp3' }],
      IsTruncated: false,
    }));
    sendMock.mockImplementationOnce(async () => ({}));

    try {
      await pushPublicFiles(
        new Map([
          ['existing.mp3', tmp],
          ['new-file.mp3', tmp],
        ]),
        'audio',
        'audio/mpeg',
      );

      // Exactly one PutObject (for new-file.mp3); existing.mp3 was skipped.
      const putCalls = sendMock.mock.calls.filter(
        (c: any[]) => c[0].constructor.name === 'PutObjectCommand',
      );
      expect(putCalls.length).toBe(1);
      expect(putCalls[0][0].input.Key).toBe('audio/new-file.mp3');
      expect(putCalls[0][0].input.ContentType).toBe('audio/mpeg');
    } finally {
      if (existsSync(tmp)) unlinkSync(tmp);
    }
  });
});

// Empty-input early-returns prevent the build from issuing a no-op
// ListObjectsV2 call (which still costs an R2 list operation) when the
// caller has nothing to upload. Minor but visible on the R2 billing
// dashboard and in build logs.
describe('r2-cache — empty inputs short-circuit before reaching R2', () => {
  beforeEach(() => setR2Env());

  it.each([
    ['pullFinalAudioBatch', () => pullFinalAudioBatch([])],
    ['pushFinalAudioFiles', () => pushFinalAudioFiles(new Map())],
    ['pushPublicFiles', () => pushPublicFiles(new Map(), 'audio', 'audio/mpeg')],
  ])('%s issues no S3 calls when given empty input', async (_name, fn) => {
    await fn();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
