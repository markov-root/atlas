import type { Node } from "./transformer";

export type InstanceCount = {
  inSection: number;
  inChapter: number;
  inTextbook: number;
};

export type TextbookDefinition = {
  version: string;
  language: string;
  chapters: ChapterDefinition[]
}

export type Author = {
  name: string
  affiliation: string
}

export type ChapterDefinition = {
  docId: string
  tabId: string
  description?: string
  authors: Author[]
  acknowledgements: string[]
  lecture?: string,
  paper?: string,
  facilitationGuide?: string
}

export type Chapter = {
  title: string;
  number: number;
  slug: string
  sections: Section[]
  meta: ChapterDefinition
  readingTimeInSeconds: number
  contentHash: string
  pdfLink?: string
  audioLink?: string
}

export type TocEntry = {
  title: string;
  slug: string;
  level: number;
};

export type SectionRef = {
  chapter: number;
  section: number;
};

export type FootnoteData = {
  number: string;
  children: Node[];
};

export type Section = {
  chapterNumber: number;
  number: number;
  description: string;
  title: string;
  slug: string;
  toc: TocEntry[];
  nodes: Node[];
  footnotes: FootnoteData[];
  readingTimeInSeconds: number;
  prevSection: SectionRef | null;
  nextSection: SectionRef | null;
  audioLink?: string;
};

export type Textbook = {
  version: string;
  language: string;
  chapters: Chapter[]
  readingTimeInSeconds: number
  pdfLink?: string
}

export type GlossaryEntry = {
  term: string;
  definition: string;
  sourceUrl?: string;
  sourceLabel?: string;
  aliases: string[];
}
