import { join } from "path";
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import type { Chapter, ChapterDefinition, FootnoteData, GlossaryEntry, Section, SectionRef, Textbook, TextbookDefinition } from ".";
import { Transformer, type Node } from "./transformer";
import { slugify, getNodeText, traverseNodes } from "./utils";
import { DocsSDK } from "./gdocsdk";
import { Renderer as ChapterPdfRenderer } from "./renderers/pdf/renderer";
import { Renderer as AudioRenderer } from "./renderers/audio/renderer";

export interface TextbookLoaderOptions {
  cacheOnly?: boolean;
}

export class TextbookLoader {
  edition: TextbookDefinition;
  // Where images from the Google Docs are stored
  assetsDir: string;
  docsSdk: DocsSDK;
  // Holds various counts such a number of figures in the textbook as a whole
  // There are similar variable at the chapter and section level.
  textbookCounts: Map<string, number>;
  private _glossary: GlossaryEntry[] | null = null;

  constructor(googleCreds: string | null, edition: TextbookDefinition, options: TextbookLoaderOptions = {}) {
    this.edition = edition;
    this.assetsDir = join(process.cwd(), "src", "assets", "uc")
    this.docsSdk = new DocsSDK(googleCreds, this.assetsDir, (f: string) => `/assets/uc/${f}`, options.cacheOnly ?? false)
    this.textbookCounts = new Map<string, number>();
  }

  private async getGlossary(): Promise<GlossaryEntry[]> {
    if (this._glossary === null) {
      this._glossary = await this.loadGlossary();
    }
    return this._glossary;
  }

  async load(): Promise<Textbook> {
    const chapters: Chapter[] = [];

    for (const def of this.edition.chapters) {
      const chapter = await this.loadChapter(def);
      chapters.push(chapter);
    }

    const readingTimeInSeconds = chapters.reduce((sum, c) => sum + c.readingTimeInSeconds, 0);

    this.linkSections(chapters);

    const textbook: Textbook = {
      version: this.edition.version,
      language: this.edition.language,
      chapters,
      readingTimeInSeconds,
    };

    const outputDir = join(process.cwd(), '.cache', 'uc');
    if (!process.env.SKIP_PDF) {
      await new ChapterPdfRenderer(textbook, this.assetsDir, outputDir).render();
    }



    await new AudioRenderer(textbook, this.assetsDir, outputDir, {
      skipGeneration: !!process.env.SKIP_AUDIO,
    }).render();

    return textbook;
  }

  async loadGlossary(): Promise<GlossaryEntry[]> {
    const glossaryDir = join(
      process.cwd(),
      "src",
      "data",
      `${this.edition.version}-${this.edition.language}`,
      "glossary"
    );

    const files = await readdir(glossaryDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const entries = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await readFile(join(glossaryDir, file), "utf-8");
        const data = JSON.parse(content) as Record<
          string,
          { definition: string; sourceUrl?: string; sourceLabel?: string; aliases: string[] }
        >;

        return Object.entries(data).map(
          ([term, { definition, sourceUrl, sourceLabel, aliases }]) => ({
            term,
            definition,
            sourceUrl,
            sourceLabel,
            aliases,
          })
        );
      })
    );

    return entries.flat();
  }

  private linkSections(chapters: Chapter[]): void {
    const allSections: Section[] = chapters.flatMap(c => c.sections);

    for (let i = 0; i < allSections.length; i++) {
      const section = allSections[i];
      const prev = allSections[i - 1];
      const next = allSections[i + 1];

      section.prevSection = prev
        ? { chapter: prev.chapterNumber, section: prev.number }
        : null;
      section.nextSection = next
        ? { chapter: next.chapterNumber, section: next.number }
        : null;
    }
  }

  async loadChapter(meta: ChapterDefinition): Promise<Chapter> {
    const doc = await this.docsSdk.fetchDoc(meta.docId, meta.tabId);
    const body = doc.body?.content;
    const glossary = await this.getGlossary();

    const rawChapter = new Transformer(doc, this.textbookCounts, glossary).transformChapter(body ?? []);

    for (const section of rawChapter.sections) {
      traverseNodes(section.nodes, (node) => {
        if (node.name === "Footnote") {
          section.footnotes.push({
            number: node.attributes.number as string,
            children: node.children,
          } as FootnoteData);
        }
      });
    }

    return {
      meta,
      sections: rawChapter.sections,
      title: rawChapter.title,
      slug: slugify(rawChapter.title as string || ''),
      number: rawChapter.number,
      readingTimeInSeconds: rawChapter.sections.reduce((sum, s) => sum + s.readingTimeInSeconds, 0),
      contentHash: createHash('sha256').update(JSON.stringify(rawChapter)).digest('hex'),
    };
  }
}
