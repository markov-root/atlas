import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREAMBLE = readFileSync(join(__dirname, 'preamble.typ'), 'utf-8');
import type { Author, Chapter, Section, Textbook } from "../..";
import type { Node } from "../../transformer";

const BLOCK_NODES = [
  'Paragraph',
  'SpanGroup',
  'ListItem',
  'Heading',
  'List',
  'NoteBox',
  'Callout',
  'DisplayEquation',
  'Figure',
  'Definition',
  'Quote',
  'Iframe'
]

interface RenderContext {
  assetsDir: string;
  chapterNumber: number;
}

export class Renderer {
  textbook: Textbook
  outputDir: string
  assetsDir: string

  constructor(textbook: Textbook, assetsDir: string, outputDir: string) {
    this.textbook = textbook
    this.assetsDir = assetsDir
    this.outputDir = outputDir
  }

  async render(): Promise<Record<string, string>> {
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });

    let renders: Record<string, string> = {}

    for (const chapter of this.textbook.chapters) {
      let rendered = await this.renderChapter(chapter)

      chapter.pdfLink = rendered
      renders[chapter.contentHash] = rendered
    }

    return renders
  }

  async renderChapter(chapter: Chapter): Promise<string> {
    const pdfFilename = `atlas-chapter${chapter.number}-${chapter.contentHash.slice(0, 16)}.pdf`;
    const pdfPath = join(this.outputDir, pdfFilename);

    if (existsSync(pdfPath)) {
      return `/uc/${pdfFilename}`;
    }

    const typstContent = this.generateChapter(chapter);

    execSync(`typst compile --root src - "${pdfPath}"`, {
      input: typstContent,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return `/uc/${pdfFilename}`;
  }

  generateChapter(chapter: Chapter): string {
    const ctx: RenderContext = {
      assetsDir: this.assetsDir,
      chapterNumber: chapter.number as number,
    };


    const parts: string[] = [
      `#let authors = ${convertAuthors(chapter.meta.authors)}`,
      `#let chapter-number = ${chapter.number}`,
      `#let chapter-title = "${escapeTypst(chapter.title as string)}"`,
      PREAMBLE,
      `#title-page(${chapter.number}, [${escapeTypst(chapter.title as string)}], [${chapter.meta.description || ''}])`,
      '',
      '#outline(depth: 2, indent: auto)',
      '#pagebreak()'
    ];

    for (const section of chapter.sections) {
      parts.push(`= ${escapeTypst(section.title)}\n\n`);

      for (const node of section.nodes) {
        let rendered: string | string[]  = renderNode(node, ctx)
        if (!Array.isArray(rendered)) {
          rendered = [rendered]
       }

       rendered = rendered.filter(p => p.trim() !== '');

        if (rendered.length === 0) {
          continue
        }

        parts.push(...rendered);

        if (BLOCK_NODES.includes(node.name)) {
          parts.push('\n\n')
        }
      }
    }

    if (chapter.meta.acknowledgements && chapter.meta.acknowledgements.length > 0) {
      const formattedNames = formatAcknowledgementNames(chapter.meta.acknowledgements);
      parts.push(`
#heading(outlined: true, numbering: none)[Acknowledgements]

We would like to express our gratitude to ${formattedNames} for their valuable feedback, discussions, and contributions to this work.
`);
    }

    return parts.join('\n');
  }

}

function escapeTypst(text: string): string {
  return text.replace(/([*_$#@\\[\]<>`])/g, '\\$1');
}

function formatAcknowledgementNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}

function convertAuthors(authors: Author[]): string {
  const dictionaries = authors.map(author => {
      const name = escapeTypst(author.name);
      const affiliation = escapeTypst(author.affiliation);
      return `(name: "${name}", affiliation: "${affiliation}")`;
    });

    return `(${dictionaries.join(', ')},)`;
}


function renderNode(node: Node, ctx: RenderContext): string | string[] {
  if (node.name === 'Video') {
    return '';
  }

  if (node.name === 'GlossaryDefinition') {
    // In PDF, just render the matched text without any special formatting
    return escapeTypst(node.attributes.matchedText as string);
  }

  if (node.name === 'Span') {
    return renderSpan(node, ctx);
  }

  if (node.name === 'Paragraph' || node.name === "SpanGroup" || node.name === "ListItem") {
    return node.children.flatMap(child => renderNode(child, ctx));
  }

  if (node.name === 'Heading') {
    const level = node.attributes.level as number;
    const text = node.children.map(child => renderNode(child, ctx)).join('');
    const prefix = '='.repeat(Math.min(level, 4));
    return `${prefix} ${text}`;
  }

  if (node.name === 'List') {
    return node.children.map(child => {
      const content = child.children.map(c => renderNode(c, ctx)).join('');
      return `${node.attributes.ordered ? '+' : '-'} ${content}\n`;
    });
  }

  if (node.name === 'Figure') {
    const { image, caption } = node.attributes

    if (!image) return '';

    return `#figure(
    image("${image}", width: 90%),
    caption: [${caption ? renderNode(caption, ctx) : ''}]
    )`;
  }

  if (node.name === 'Definition') {
    const { term, source } = node.attributes

    const content = node.children.map(child => renderNode(child, ctx)).flat().join('');
    const sourceRendered = source ? [renderNode(source as Node, ctx)].flat().join('') : null;

    return `#definition-box(
      [${escapeTypst(term as string || '')}],
      ${sourceRendered ? `[${sourceRendered}]` : 'none'},
      [${content}]
    )`;
  }

  if (node.name === 'Quote') {
    const { speaker, position, date, sourceUrl } = node.attributes

    const content = node.children.map(child => renderNode(child, ctx)).join('');
    const sourceUrlText = sourceUrl ? renderNode(sourceUrl, ctx) : 'none';

    return `#quote-box(
    ${speaker ? `[${escapeTypst(speaker)}]` : 'none'},
    ${position ? `[${escapeTypst(position)}]` : 'none'},
    ${date ? `[${escapeTypst(date)}]` : 'none'},
    ${sourceUrl ? `[${sourceUrlText}]` : 'none'},
    [${content}]
    )`;
  }

  if (node.name === 'NoteBox') {
    const content = node.children.map(child => renderNode(child, ctx)).join('');
    return `#note-box(
    [${escapeTypst(node.attributes.title || 'Note')}],
    [${content}]
    )`;
  }

  if (node.name === 'Callout') {
    const { flavor } = node.attributes as { flavor?: string };
    const content = node.children.map(child => renderNode(child, ctx)).join('');
    if (flavor === 'warning') {
      return `#warning-box([${content}])`;
    }

    throw new Error(`Unknown flavor for Callout: ${flavor}`)
  }

  if (node.name === 'InlineEquation') {
    return `$${node.attributes.content as string}$`;
  }

  if (node.name === 'DisplayEquation') {
    return `$ ${node.attributes.content as string} $`;
  }

  if (node.name === 'Footnote') {
    const content = node.children.map(child => renderNode(child, ctx)).join('');
    return `#footnote[${content}]`;
  }

  if (node.name === 'Link') {
    const { href, content } = node.attributes;
    return `#link("${href}")[${escapeTypst(content as string)}]`;
  }

  if (node.name === 'Iframe') {
    const { stillImage, caption } = node.attributes

    if (!stillImage) {
      console.warn(`Iframe has no still image`);
      return ''
    }
    const captionText = caption ? renderNode(caption, ctx) : '';

    return `#figure(
    image("${stillImage}", width: 90%),
    caption: [${captionText} _(interactive version on website)_]
    )`;
  }

  console.warn(`Unknown node type: ${node.name}`);
  return '';
}

function renderSpan(node: Node, ctx: RenderContext): string {
  const { content, bold, italic, strikethrough, underline, link } = node.attributes

  if (!content) return '';

  let text = escapeTypst(content as string);

  // Apply styling from innermost to outermost
  // Use function syntax (#strong, #emph) instead of markup syntax (*..*, _.._)
  // to avoid parsing issues when content contains special characters
  if (strikethrough) {
    text = `#strike[${text}]`;
  }
  if (underline) {
    text = `#underline[${text}]`;
  }
  if (italic) {
    text = `#emph[${text}]`;
  }
  if (bold) {
    text = `#strong[${text}]`;
  }
  if (link) {
    text = `#link("${link}")[${text}]`;
  }

  return text;
}
