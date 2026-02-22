import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Chapter, Section, Textbook } from "../..";
import { EquationDescriber } from './equation-describer';
import { ElevenLabsTTS } from './elevenlabs-tts';
import { TextRenderer } from './text-renderer';
import { pullFromR2, pushToR2 } from './r2-cache';

export interface AudioRendererOptions {
  /** Skip TTS generation; only link existing audio files. */
  skipGeneration?: boolean;
}

export class Renderer {
  private textbook: Textbook;
  private assetsDir: string;
  private outputDir: string;
  private apiKey: string | undefined;
  private tts: ElevenLabsTTS;
  private describer: EquationDescriber;
  private textRenderer: TextRenderer;

  constructor(textbook: Textbook, assetsDir: string, outputDir: string, options: AudioRendererOptions = {}) {
    this.textbook = textbook;
    this.assetsDir = assetsDir;
    this.outputDir = outputDir;
    const skipGeneration = options.skipGeneration ?? false;
    this.apiKey = skipGeneration ? undefined : process.env.ELEVENLABS_API_KEY;
    this.tts = new ElevenLabsTTS(this.apiKey);
    this.describer = new EquationDescriber(skipGeneration ? undefined : process.env.GEMINI_API_KEY);
    this.textRenderer = new TextRenderer(this.describer);
  }

  async render(): Promise<void> {
    mkdirSync(this.outputDir, { recursive: true });

    // Pre-compute all needed R2 keys before pulling from cache
    const neededKeys = new Set<string>();

    for (const chapter of this.textbook.chapters) {
      for (const section of chapter.sections) {
        // Collect equation description keys
        const equations = this.textRenderer.collectEquations(section.nodes);
        const context = `${chapter.title} — ${section.title}`;
        for (const eq of equations) {
          const hash = this.describer.hashLatex(eq.latex);
          neededKeys.add(`equation-descriptions/${hash}.txt`);
          this.describer.queue(eq.latex, eq.type, context);
        }

        // Collect audio chunk keys from rendered paragraphs
        const paragraphs = this.textRenderer.renderNodes(section.nodes);
        for (const text of paragraphs) {
          const hash = this.tts.hashText(text);
          neededKeys.add(`audio-chunks/${hash}.mp3`);
          neededKeys.add(`audio-chunks/${hash}.pcm`); // legacy Gemini format
        }
      }
    }

    // Pull only the needed files from R2
    await pullFromR2(neededKeys);

    // Batch-fetch equation descriptions from Gemini for any not in cache
    await this.describer.batchFetch();

    // Render chapters
    for (const chapter of this.textbook.chapters) {
      await this.renderChapter(chapter);
    }

    // Push any newly generated cache files to R2
    await pushToR2();
  }

  async renderChapter(chapter: Chapter): Promise<string> {
    const sectionMp3s: string[] = [];

    for (let i = 0; i < chapter.sections.length; i++) {
      const section = chapter.sections[i];
      const isFirstSection = i === 0;
      const mp3Path = await this.renderSection(section, chapter, isFirstSection);
      if (mp3Path) sectionMp3s.push(mp3Path);
    }

    if (sectionMp3s.length === 0) return '';

    // Hash based on section filenames so chapter cache is stable when sections don't change
    const chapterHash = createHash('sha256')
      .update(sectionMp3s.join('\n'))
      .digest('hex');
    const chapterFilename = `atlas-chapter${chapter.number}-audio-${chapterHash}.mp3`;
    const chapterMp3Path = join(this.outputDir, chapterFilename);

    if (!existsSync(chapterMp3Path)) {
      console.log(`[audio] Concatenating chapter ${chapter.number} audio...`);
      this.tts.concatenateMp3s(sectionMp3s, chapterMp3Path);
    }

    const link = `/uc/${chapterFilename}`;
    chapter.audioLink = link;
    return link;
  }

  async renderSection(section: Section, chapter: Chapter, isFirstSection: boolean): Promise<string> {
    // Prepend chapter and section titles
    const preamble: string[] = [];
    if (isFirstSection) {
      preamble.push(`Chapter ${chapter.number}: ${chapter.title}.`);
    }
    preamble.push(`Section ${chapter.number}.${section.number}: ${section.title}.`);

    const paragraphs = [...preamble, ...this.textRenderer.renderNodes(section.nodes)];
    if (paragraphs.length === 0) {
      section.audioLink = undefined;
      return '';
    }

    // Hash based on the actual rendered paragraph text, not the AST nodes.
    // This way non-audio changes (e.g. metadata, links) don't invalidate the cache.
    const sectionHash = createHash('sha256')
      .update(paragraphs.join('\n'))
      .digest('hex');

    const filename = `atlas-ch${chapter.number}-s${section.number}-${sectionHash}.mp3`;
    const mp3Path = join(this.outputDir, filename);
    const link = `/uc/${filename}`;

    section.audioLink = link;

    if (existsSync(mp3Path)) {
      console.log(`[audio] Section ${chapter.number}.${section.number} cached, skipping.`);
      return mp3Path;
    }

    const cachedCount = paragraphs.filter(p => this.tts.isCached(p)).length;
    const uncachedCount = paragraphs.length - cachedCount;
    const cacheNote = uncachedCount === 0
      ? ` (all ${paragraphs.length} paragraphs cached)`
      : cachedCount > 0
        ? ` (${uncachedCount}/${paragraphs.length} paragraphs to synthesize, ${cachedCount} cached)`
        : ` (${paragraphs.length} paragraphs to synthesize)`;
    console.log(`[audio] Synthesizing section ${chapter.number}.${section.number}: "${section.title}"${cacheNote}`);

    const mp3 = await this.tts.synthesizeParagraphs(paragraphs);
    if (mp3.length === 0) {
      section.audioLink = undefined;
      return '';
    }

    this.tts.mp3ToNormalizedMp3(mp3, mp3Path);
    return mp3Path;
  }
}
