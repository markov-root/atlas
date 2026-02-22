import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import pThrottle from 'p-throttle';

const CHUNK_CACHE_DIR = join(process.cwd(), '.cache', 'audio-chunks');
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // George
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';
const MAX_RPM = 80;
const MAX_RETRIES = 3;

export class ElevenLabsTTS {
  private client: ElevenLabsClient | null = null;
  private throttledCall: ((text: string) => Promise<Buffer>) | null = null;

  constructor(apiKey: string | undefined) {
    mkdirSync(CHUNK_CACHE_DIR, { recursive: true });

    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
      const throttle = pThrottle({ limit: MAX_RPM, interval: 60_000 });
      this.throttledCall = throttle((text: string) => this.callTtsApi(text));
    }
  }

  hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  isCached(text: string): boolean {
    const hash = this.hashText(text);
    const mp3Path = this.chunkPath(hash);
    const pcmPath = join(CHUNK_CACHE_DIR, `${hash}.pcm`);
    return (existsSync(mp3Path) && readFileSync(mp3Path).length > 0)
      || (existsSync(pcmPath) && readFileSync(pcmPath).length > 0);
  }

  private chunkPath(hash: string): string {
    return join(CHUNK_CACHE_DIR, `${hash}.mp3`);
  }

  /**
   * Synthesize an array of paragraph strings to MP3 audio, using per-paragraph caching.
   * Returns a Buffer of MP3 audio.
   */
  async synthesizeParagraphs(paragraphs: string[]): Promise<Buffer> {
    if (paragraphs.length === 0) return Buffer.alloc(0);

    const results: (Buffer | null)[] = new Array(paragraphs.length).fill(null);

    // Load cached paragraphs (check .mp3 first, then fall back to legacy .pcm)
    const needed: { idx: number; text: string; hash: string }[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i];
      const hash = this.hashText(text);
      const mp3Path = this.chunkPath(hash);
      const pcmPath = join(CHUNK_CACHE_DIR, `${hash}.pcm`);

      if (existsSync(mp3Path) && readFileSync(mp3Path).length > 0) {
        results[i] = readFileSync(mp3Path);
      } else if (existsSync(pcmPath) && readFileSync(pcmPath).length > 0) {
        // Convert legacy Gemini PCM chunk to MP3 once
        const pcm = readFileSync(pcmPath);
        const mp3 = this.pcmToMp3Buffer(pcm);
        writeFileSync(mp3Path, mp3);
        results[i] = mp3;
      } else {
        needed.push({ idx: i, text, hash });
      }
    }

    // Skip synthesis if no API key — only use cached chunks
    if (!this.throttledCall) {
      if (needed.length > 0) {
        console.log(`[elevenlabs-tts] No API key, skipping ${needed.length} uncached paragraphs.`);
      }
    } else {
      // Synthesize uncached paragraphs concurrently, throttled.
      // An abort flag lets us stop early on quota exhaustion.
      let aborted = false;
      let completed = 0;
      let failed = 0;
      await Promise.all(needed.map(async ({ idx, text, hash }) => {
        if (aborted) return;
        const preview = text.length > 60 ? text.slice(0, 60) + '...' : text;
        console.log(`[elevenlabs-tts] Synthesizing paragraph ${completed + 1}/${needed.length}: "${preview}"`);
        const mp3 = await this.synthesizeSingle(text, () => aborted, () => { aborted = true; });
        if (aborted) return;
        if (mp3.length > 0) {
          results[idx] = mp3;
          writeFileSync(this.chunkPath(hash), mp3);
          completed++;
          console.log(`[elevenlabs-tts] Completed ${completed}/${needed.length}`);
        } else {
          failed++;
        }
      }));

      if (failed > 0) {
        console.warn(`[elevenlabs-tts] ${failed} paragraphs failed, returning incomplete result.`);
        return Buffer.alloc(0);
      }
    }

    // Assemble in order
    const mp3Buffers: Buffer[] = [];
    for (const buf of results) {
      if (buf && buf.length > 0) mp3Buffers.push(buf);
    }

    if (mp3Buffers.length === 0) return Buffer.alloc(0);
    if (mp3Buffers.length === 1) return mp3Buffers[0];

    return this.concatenateBuffers(mp3Buffers);
  }

  private async synthesizeSingle(text: string, isAborted: () => boolean, abort: () => void): Promise<Buffer> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (isAborted()) return Buffer.alloc(0);
      try {
        return await this.throttledCall!(text);
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        const body = err?.body ?? err?.message ?? err;
        const isQuotaExhausted = status === 401
          && typeof body === 'string' && body.includes('quota_exceeded');
        if (isQuotaExhausted) {
          console.error('[elevenlabs-tts] Quota exhausted, aborting remaining synthesis.');
          abort();
          return Buffer.alloc(0);
        }
        if (status === 429 && attempt < MAX_RETRIES) {
          const delaySec = 10 * (attempt + 1);
          console.warn(`[elevenlabs-tts] Rate limited, waiting ${delaySec}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, delaySec * 1000));
          continue;
        }
        console.warn('[elevenlabs-tts] TTS API call failed:', (err?.message ?? err));
        return Buffer.alloc(0);
      }
    }
    return Buffer.alloc(0);
  }

  /** Convert raw PCM (16-bit, 24kHz, mono) to MP3 buffer via ffmpeg. */
  private pcmToMp3Buffer(pcm: Buffer): Buffer {
    return execSync(
      `ffmpeg -f s16le -ar 24000 -ac 1 -i pipe:0 -codec:a libmp3lame -q:a 4 -f mp3 pipe:1`,
      { input: pcm, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 }
    );
  }

  private async callTtsApi(text: string): Promise<Buffer> {
    if (!this.client) throw new Error('No API key configured for TTS');

    const response = await this.client.textToSpeech.convert(VOICE_ID, {
      text,
      modelId: MODEL_ID,
      outputFormat: 'mp3_44100_128',
    });

    // The SDK returns a ReadableStream; collect into Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Concatenate MP3 buffers by writing to temp files and using ffmpeg.
   */
  private concatenateBuffers(buffers: Buffer[]): Buffer {
    const tmpDir = join(process.cwd(), '.cache', 'audio-tmp');
    mkdirSync(tmpDir, { recursive: true });

    const listFile = join(tmpDir, 'concat.txt');
    const tmpFiles: string[] = [];
    const lines: string[] = [];

    for (let i = 0; i < buffers.length; i++) {
      const tmpPath = join(tmpDir, `chunk-${i}.mp3`);
      writeFileSync(tmpPath, buffers[i]);
      tmpFiles.push(tmpPath);
      lines.push(`file '${tmpPath}'`);
    }
    writeFileSync(listFile, lines.join('\n'));

    const outPath = join(tmpDir, 'combined.mp3');
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outPath}"`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const result = readFileSync(outPath);

    // Clean up
    for (const f of [...tmpFiles, listFile, outPath]) {
      try { execSync(`rm "${f}"`, { stdio: 'pipe' }); } catch {}
    }

    return result;
  }

  /**
   * Normalize MP3 audio loudness and write to output path using ffmpeg.
   */
  mp3ToNormalizedMp3(mp3Buffer: Buffer, outputPath: string): void {
    // Two-pass loudness normalization (EBU R128)
    // Pass 1: measure loudness
    const measureResult = execSync(
      `ffmpeg -y -i pipe:0 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null /dev/null 2>&1`,
      { input: mp3Buffer }
    );
    const stderr = measureResult.toString();
    const jsonStart = stderr.lastIndexOf('{');
    const jsonEnd = stderr.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      // Fallback: single-pass
      execSync(
        `ffmpeg -y -i pipe:0 -af loudnorm=I=-14:TP=-1:LRA=11 -codec:a libmp3lame -q:a 4 "${outputPath}"`,
        { input: mp3Buffer, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return;
    }
    const stats = JSON.parse(stderr.slice(jsonStart, jsonEnd + 1));

    // Pass 2: normalize with measured values (linear mode)
    const af = [
      `loudnorm=I=-14:TP=-1:LRA=11`,
      `measured_I=${stats.input_i}`,
      `measured_TP=${stats.input_tp}`,
      `measured_LRA=${stats.input_lra}`,
      `measured_thresh=${stats.input_thresh}`,
      `offset=${stats.target_offset}`,
      `linear=true`,
    ].join(':');

    execSync(
      `ffmpeg -y -i pipe:0 -af ${af} -codec:a libmp3lame -q:a 4 "${outputPath}"`,
      { input: mp3Buffer, stdio: ['pipe', 'pipe', 'pipe'] }
    );
  }

  /**
   * Concatenate multiple MP3 files into one using ffmpeg.
   */
  concatenateMp3s(inputPaths: string[], outputPath: string): void {
    if (inputPaths.length === 0) return;
    if (inputPaths.length === 1) {
      execSync(`cp "${inputPaths[0]}" "${outputPath}"`);
      return;
    }

    const inputs = inputPaths.map(p => `-i "${p}"`).join(' ');
    const filterComplex = `concat=n=${inputPaths.length}:v=0:a=1[out]`;
    execSync(
      `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[out]" "${outputPath}"`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
  }
}
