import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import pThrottle from 'p-throttle';

const CHUNK_CACHE_DIR = join(process.cwd(), '.cache', 'audio-chunks');
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-pro-preview-tts';
const MAX_RPM = 10;
const MAX_RETRIES = 5;

export class GeminiTTS {
  private ai: GoogleGenAI | null = null;
  // Throttle the actual API call so retries also respect the rate limit
  private throttledCall: ((text: string) => Promise<Buffer>) | null = null;
  private dailyQuotaExhausted = false;

  constructor(apiKey: string | undefined) {
    mkdirSync(CHUNK_CACHE_DIR, { recursive: true });

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      const throttle = pThrottle({ limit: MAX_RPM, interval: 60_000 });
      this.throttledCall = throttle((text: string) => this.callTtsApi(text));
    }
  }

  hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  isCached(text: string): boolean {
    const path = this.chunkPath(this.hashText(text));
    return existsSync(path) && readFileSync(path).length > 0;
  }

  private chunkPath(hash: string): string {
    return join(CHUNK_CACHE_DIR, `${hash}.pcm`);
  }

  /**
   * Synthesize an array of paragraph strings to PCM audio, using per-paragraph caching.
   * Returns a Buffer of raw PCM (16-bit, 24kHz, mono).
   */
  async synthesizeParagraphs(paragraphs: string[]): Promise<Buffer> {
    if (paragraphs.length === 0) return Buffer.alloc(0);

    const results: (Buffer | null)[] = new Array(paragraphs.length).fill(null);

    // Load cached paragraphs
    const needed: { idx: number; text: string; hash: string }[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i];
      const hash = this.hashText(text);
      const path = this.chunkPath(hash);
      if (existsSync(path) && readFileSync(path).length > 0) {
        results[i] = readFileSync(path);
      } else {
        needed.push({ idx: i, text, hash });
      }
    }

    // Skip synthesis if no API key — only use cached chunks
    if (!this.throttledCall) {
      if (needed.length > 0) {
        console.log(`[gemini-tts] No API key, skipping ${needed.length} uncached paragraphs.`);
      }
    } else {
    // Synthesize uncached paragraphs concurrently, throttled to MAX_RPM
    let completed = 0;
    await Promise.all(needed.map(async ({ idx, text, hash }) => {
      if (this.dailyQuotaExhausted) return;
      const preview = text.length > 60 ? text.slice(0, 60) + '...' : text;
      console.log(`[gemini-tts] Synthesizing paragraph ${completed + 1}/${needed.length}: "${preview}"`);
      const pcm = await this.synthesizeSingle(text);
      if (this.dailyQuotaExhausted) return;
      completed++;
      console.log(`[gemini-tts] Completed ${completed}/${needed.length}`);
      if (pcm.length > 0) {
        results[idx] = pcm;
        writeFileSync(this.chunkPath(hash), pcm);
      }
    }));
    } // end if (this.throttledCall)

    // Assemble in order, skipping failures
    const pcmBuffers: Buffer[] = [];
    for (const buf of results) {
      if (buf && buf.length > 0) pcmBuffers.push(buf);
    }

    return Buffer.concat(pcmBuffers);
  }

  private async synthesizeSingle(text: string): Promise<Buffer> {
    // Caller is expected to gate on this.throttledCall being non-null
    // (see line ~65). Narrow the type for the rest of the function.
    if (!this.throttledCall) throw new Error('[gemini-tts] synthesizeSingle called without API key configured');
    const throttledCall = this.throttledCall;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (this.dailyQuotaExhausted) return Buffer.alloc(0);
      try {
        // Each call (including retries) goes through the throttle
        return await throttledCall(text);
      } catch (err: any) {
        if (err?.status === 429 && attempt < MAX_RETRIES) {
          // Check if it's a daily quota (no point retrying)
          const msg = String(err?.message ?? '');
          if (msg.includes('per_day') || msg.includes('per_model_per_day')) {
            console.warn('[gemini-tts] Daily quota exhausted, skipping remaining paragraphs.');
            this.dailyQuotaExhausted = true;
            return Buffer.alloc(0);
          }
          // Rate limit — wait for the retry delay
          const retryMatch = msg.match(/retryDelay.*?(\d+)s/i)
            ?? msg.match(/retry in ([\d.]+)s/i);
          const delaySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 1 : 30;
          console.warn(`[gemini-tts] Rate limited, waiting ${delaySec}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, delaySec * 1000));
          continue;
        }
        console.warn('[gemini-tts] TTS API call failed:', (err?.message ?? err));
        return Buffer.alloc(0);
      }
    }
    return Buffer.alloc(0);
  }

  private async callTtsApi(text: string): Promise<Buffer> {
    if (!this.ai) throw new Error('No API key configured for TTS');
    const response = await this.ai.models.generateContent({
      model: TTS_MODEL,
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'));

    if (!audioPart?.inlineData?.data) {
      throw new Error('TTS response contained no audio data');
    }

    return Buffer.from(audioPart.inlineData.data, 'base64');
  }

  /**
   * Convert raw PCM (16-bit, 24kHz, mono) to MP3 using ffmpeg.
   */
  pcmToMp3(pcmBuffer: Buffer, outputPath: string): void {
    const pcmArgs = '-f s16le -ar 24000 -ac 1';

    // Two-pass loudness normalization (EBU R128)
    // Pass 1: measure loudness
    const measureResult = execSync(
      `ffmpeg -y ${pcmArgs} -i pipe:0 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null /dev/null 2>&1`,
      { input: pcmBuffer }
    );
    const stderr = measureResult.toString();
    const jsonMatch = stderr.match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
    if (!jsonMatch) {
      // Fallback: single-pass if measurement parsing fails
      execSync(
        `ffmpeg -y ${pcmArgs} -i pipe:0 -af loudnorm=I=-14:TP=-1:LRA=11 -codec:a libmp3lame -q:a 4 "${outputPath}"`,
        { input: pcmBuffer, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return;
    }
    const stats = JSON.parse(jsonMatch[0]);

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
      `ffmpeg -y ${pcmArgs} -i pipe:0 -af ${af} -codec:a libmp3lame -q:a 4 "${outputPath}"`,
      { input: pcmBuffer, stdio: ['pipe', 'pipe', 'pipe'] }
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
