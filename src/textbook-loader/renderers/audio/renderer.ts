import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Chapter, Section, Textbook } from "../..";
import { EquationDescriber } from './equation-describer';
import { ElevenLabsTTS } from './elevenlabs-tts';
import { TextRenderer } from './text-renderer';
import { pullFromR2, pushToR2, pullFinalAudioBatch, pushFinalAudioFiles, pushPublicFiles } from './r2-cache';

const CDN_BASE = 'https://atlas.foreviewusercontent.com';

export interface AudioRendererOptions {
  /** Skip TTS generation; only link existing audio files. */
  skipGeneration?: boolean;
}

interface SectionWork {
  section: Section;
  chapter: Chapter;
  paragraphs: string[];
  mp3Path: string;
  stableKey: string;
  contentKey: string;
  label: string;
}

export class Renderer {
  private textbook: Textbook;
  private assetsDir: string;
  private outputDir: string;
  private apiKey: string | undefined;
  private skipGeneration: boolean;
  private tts: ElevenLabsTTS;
  private describer: EquationDescriber;
  private textRenderer: TextRenderer;

  constructor(textbook: Textbook, assetsDir: string, outputDir: string, options: AudioRendererOptions = {}) {
    this.textbook = textbook;
    this.assetsDir = assetsDir;
    this.outputDir = outputDir;
    this.skipGeneration = options.skipGeneration ?? false;
    const skipGeneration = this.skipGeneration;
    this.apiKey = skipGeneration ? undefined : process.env.ELEVENLABS_API_KEY;
    this.tts = new ElevenLabsTTS(this.apiKey);
    this.describer = new EquationDescriber(skipGeneration ? undefined : process.env.GEMINI_API_KEY);
    this.textRenderer = new TextRenderer(this.describer);
  }

  async render(): Promise<void> {
    // Local-dev escape hatch: skip all audio work including R2 download.
    // Useful when disk space is tight and audio playback is not needed.
    // Does not affect CI (which does not set this var) or production builds.
    if (this.skipGeneration && process.env.SKIP_AUDIO_DOWNLOAD) {
      for (const chapter of this.textbook.chapters) {
        for (const section of chapter.sections) section.audioLink = undefined;
        chapter.audioLink = undefined;
      }
      console.log("[audio] SKIP_AUDIO_DOWNLOAD=1 → all audio disabled, no R2 traffic");
      return;
    }

    mkdirSync(this.outputDir, { recursive: true });

    // Phase 1: Fetch equation descriptions so content hashes are stable.
    // Without descriptions, renderNodes produces different text, giving different hashes.
    if (!this.skipGeneration) {
      const eqKeys = new Set<string>();
      for (const chapter of this.textbook.chapters) {
        for (const section of chapter.sections) {
          const equations = this.textRenderer.collectEquations(section.nodes);
          const context = `${chapter.title} — ${section.title}`;
          for (const eq of equations) {
            const hash = this.describer.hashLatex(eq.latex);
            eqKeys.add(`equation-descriptions/${hash}.txt`);
            this.describer.queue(eq.latex, eq.type, context);
          }
        }
      }
      await pullFromR2(eqKeys);
      await this.describer.batchFetch();
    }

    // Phase 2: Compute section metadata and check local cache
    const sections: SectionWork[] = [];
    for (const chapter of this.textbook.chapters) {
      for (let i = 0; i < chapter.sections.length; i++) {
        const section = chapter.sections[i];
        const preamble: string[] = [];
        if (i === 0) preamble.push(`Chapter ${chapter.number}: ${chapter.title}.`);
        preamble.push(`Section ${chapter.number}.${section.number}: ${section.title}.`);

        const paragraphs = [...preamble, ...this.textRenderer.renderNodes(section.nodes)];
        if (paragraphs.length === 0) {
          section.audioLink = undefined;
          continue;
        }

        const hash = createHash('sha256').update(paragraphs.join('\n')).digest('hex');
        const filename = `atlas-ch${chapter.number}-s${section.number}-${hash}.mp3`;
        const mp3Path = join(this.outputDir, filename);
        section.audioLink = `${CDN_BASE}/audio/${filename}`;

        sections.push({
          section, chapter, paragraphs, mp3Path,
          stableKey: `ch${chapter.number}-s${section.number}`,
          contentKey: `ch${chapter.number}-s${section.number}-${hash}`,
          label: `${chapter.number}.${section.number} "${section.title}"`,
        });
      }
    }

    // Phase 3: Pull content-hashed final audio from R2
    const localCached = sections.filter(s => existsSync(s.mp3Path));
    const needFromR2 = sections.filter(s => !existsSync(s.mp3Path));
    for (const s of localCached) {
      console.log(`[audio] ${s.label}: cached locally`);
    }
    if (needFromR2.length > 0) {
      await pullFinalAudioBatch(needFromR2.map(s => ({
        key: `final-audio/${s.contentKey}.mp3`,
        destPath: s.mp3Path,
      })));
      for (const s of needFromR2) {
        if (existsSync(s.mp3Path)) console.log(`[audio] ${s.label}: downloaded from R2 (content-matched)`);
      }
    }

    // Phase 4: Stable key fallback (SKIP_AUDIO only — serves stale audio)
    if (this.skipGeneration) {
      const stillNeeded = sections.filter(s => !existsSync(s.mp3Path));
      if (stillNeeded.length > 0) {
        await pullFinalAudioBatch(stillNeeded.map(s => ({
          key: `final-audio/${s.stableKey}.mp3`,
          destPath: s.mp3Path,
        })));
        for (const s of stillNeeded) {
          if (existsSync(s.mp3Path)) console.log(`[audio] ${s.label}: downloaded from R2 (stale fallback)`);
        }
      }
    }

    // Phase 5: Synthesize sections that still need it
    const toSynthesize = sections.filter(s => !existsSync(s.mp3Path));
    const synthesizedSections: SectionWork[] = [];

    if (toSynthesize.length > 0 && !this.skipGeneration) {
      // Pull paragraph-level audio chunks only for sections that need synthesis
      const chunkKeys = new Set<string>();
      for (const s of toSynthesize) {
        for (const text of s.paragraphs) {
          const h = this.tts.hashText(text);
          chunkKeys.add(`audio-chunks/${h}.mp3`);
          chunkKeys.add(`audio-chunks/${h}.pcm`);
        }
      }
      await pullFromR2(chunkKeys);

      for (const s of toSynthesize) {
        const cachedCount = s.paragraphs.filter(p => this.tts.isCached(p)).length;
        const uncachedCount = s.paragraphs.length - cachedCount;
        const cacheNote = uncachedCount === 0
          ? ` (all ${s.paragraphs.length} paragraphs cached)`
          : cachedCount > 0
            ? ` (${uncachedCount}/${s.paragraphs.length} to synthesize, ${cachedCount} cached)`
            : ` (${s.paragraphs.length} paragraphs to synthesize)`;
        console.log(`[audio] ${s.label}: synthesizing${cacheNote}`);

        const mp3 = await this.tts.synthesizeParagraphs(s.paragraphs);
        if (mp3.length === 0) {
          s.section.audioLink = undefined;
          continue;
        }
        this.tts.mp3ToNormalizedMp3(mp3, s.mp3Path);
        synthesizedSections.push(s);
      }
    }

    // Clear audioLink for sections that still have no audio
    for (const s of sections) {
      if (!existsSync(s.mp3Path)) {
        console.log(`[audio] ${s.label}: no audio available`);
        s.section.audioLink = undefined;
      }
    }

    // Phase 6: Chapters
    const synthesizedChapters: { stableKey: string; contentKey: string; mp3Path: string }[] = [];

    for (const chapter of this.textbook.chapters) {
      const chapterSectionPaths = sections
        .filter(s => s.chapter === chapter && existsSync(s.mp3Path))
        .map(s => s.mp3Path);

      if (chapterSectionPaths.length === 0) continue;

      const chapterHash = createHash('sha256')
        .update(chapterSectionPaths.join('\n'))
        .digest('hex');
      const chapterFilename = `atlas-chapter${chapter.number}-audio-${chapterHash}.mp3`;
      const chapterMp3Path = join(this.outputDir, chapterFilename);
      const stableKey = `chapter${chapter.number}`;
      const contentKey = `chapter${chapter.number}-${chapterHash}`;

      const chapterLabel = `Chapter ${chapter.number}`;
      if (existsSync(chapterMp3Path)) {
        console.log(`[audio] ${chapterLabel}: cached locally`);
      } else {
        // Try content-hashed key from R2
        await pullFinalAudioBatch([{ key: `final-audio/${contentKey}.mp3`, destPath: chapterMp3Path }]);

        if (existsSync(chapterMp3Path)) {
          console.log(`[audio] ${chapterLabel}: downloaded from R2 (content-matched)`);
        } else if (this.skipGeneration) {
          // Stable key fallback (SKIP_AUDIO only)
          await pullFinalAudioBatch([{ key: `final-audio/${stableKey}.mp3`, destPath: chapterMp3Path }]);
          if (existsSync(chapterMp3Path)) {
            console.log(`[audio] ${chapterLabel}: downloaded from R2 (stale fallback)`);
          }
        }

        if (!existsSync(chapterMp3Path)) {
          console.log(`[audio] ${chapterLabel}: concatenating from ${chapterSectionPaths.length} sections`);
          this.tts.concatenateMp3s(chapterSectionPaths, chapterMp3Path);
          synthesizedChapters.push({ stableKey, contentKey, mp3Path: chapterMp3Path });
        }
      }

      chapter.audioLink = `${CDN_BASE}/audio/${chapterFilename}`;
    }

    // Phase 7: Upload
    await pushToR2();

    // Only upload files that were actually synthesized/concatenated locally
    const finalToUpload = new Map<string, string>();
    for (const s of synthesizedSections) {
      finalToUpload.set(s.contentKey, s.mp3Path);
      finalToUpload.set(s.stableKey, s.mp3Path);
    }
    for (const c of synthesizedChapters) {
      finalToUpload.set(c.contentKey, c.mp3Path);
      finalToUpload.set(c.stableKey, c.mp3Path);
    }
    if (finalToUpload.size > 0) {
      console.log(`[audio] Uploading ${finalToUpload.size} final audio keys to R2:`);
      for (const key of finalToUpload.keys()) {
        console.log(`[audio]   final-audio/${key}.mp3`);
      }
    }
    await pushFinalAudioFiles(finalToUpload);

    // Phase 8: Upload all audio to public CDN prefix
    const publicAudio = new Map<string, string>();
    for (const s of sections) {
      if (existsSync(s.mp3Path)) {
        publicAudio.set(s.mp3Path.split('/').pop()!, s.mp3Path);
      }
    }
    for (const chapter of this.textbook.chapters) {
      if (chapter.audioLink) {
        const filename = chapter.audioLink.split('/').pop()!;
        const mp3Path = join(this.outputDir, filename);
        if (existsSync(mp3Path)) {
          publicAudio.set(filename, mp3Path);
        }
      }
    }
    await pushPublicFiles(publicAudio, 'audio', 'audio/mpeg');
  }
}
