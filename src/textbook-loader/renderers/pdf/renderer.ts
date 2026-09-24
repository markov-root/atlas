import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pushPublicFiles } from '../audio/r2-cache';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREAMBLE = readFileSync(join(__dirname, 'preamble.typ'), 'utf-8');
import type { Author, Chapter, Section, Textbook } from '../..';
import type { Node } from '../../transformer';
import { chapterReferences, type Reference } from '../../../lib/bibliography';

const CDN_BASE = 'https://atlas.foreviewusercontent.com';

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
  'Iframe',
];

interface RenderContext {
  assetsDir: string;
  chapterNumber: number;
}

export class Renderer {
  textbook: Textbook;
  outputDir: string;
  assetsDir: string;

  constructor(textbook: Textbook, assetsDir: string, outputDir: string) {
    this.textbook = textbook;
    this.assetsDir = assetsDir;
    this.outputDir = outputDir;
  }

  async render(): Promise<Record<string, string>> {
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });

    let renders: Record<string, string> = {};
    const publicPdfs = new Map<string, string>();

    for (const chapter of this.textbook.chapters) {
      let rendered = await this.renderChapter(chapter);

      chapter.pdfLink = rendered;
      renders[chapter.contentHash] = rendered;

      // Track for CDN upload
      const filename = rendered.split('/').pop()!;
      const localPath = join(this.outputDir, filename);
      if (existsSync(localPath)) {
        publicPdfs.set(filename, localPath);
      }
    }

    // Upload PDFs to public CDN
    await pushPublicFiles(publicPdfs, 'pdf', 'application/pdf');

    return renders;
  }

  async renderChapter(chapter: Chapter): Promise<string> {
    const pdfFilename = `atlas-chapter${chapter.number}-${chapter.contentHash}.pdf`;
    const pdfPath = join(this.outputDir, pdfFilename);

    if (existsSync(pdfPath)) {
      return `${CDN_BASE}/pdf/${pdfFilename}`;
    }

    const typstContent = this.generateChapter(chapter);

    try {
      execSync(`typst compile --font-path src/fonts --root src - "${pdfPath}"`, {
        input: typstContent,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error: any) {
      const docId = chapter.meta.docId;
      const tabId = chapter.meta.tabId;
      const docUrl = docId ? `https://docs.google.com/document/d/${docId}/edit` : 'unknown';
      const cacheKey = `${docId}:${tabId}`;
      console.error(
        `\nError in Chapter ${chapter.number} "${chapter.title}"\nGoogle Doc: ${docUrl}`,
      );
      console.error(
        `\nTo clear this chapter's Google Doc cache and force refetch:\nrm ".cache/docs/${cacheKey}"\n`,
      );
      throw error;
    }

    return `${CDN_BASE}/pdf/${pdfFilename}`;
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
      '#pagebreak()',
    ];

    for (const section of chapter.sections) {
      parts.push(`= ${escapeTypst(section.title)}\n\n`);

      for (const node of section.nodes) {
        let rendered: string | string[] = renderNode(node, ctx);
        if (!Array.isArray(rendered)) {
          rendered = [rendered];
        }

        rendered = rendered.filter((p) => p.trim() !== '');

        if (rendered.length === 0) {
          continue;
        }

        parts.push(...rendered);

        if (BLOCK_NODES.includes(node.name)) {
          parts.push('\n\n');
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

    parts.push(renderReferences(chapter));

    return parts.join('\n');
  }
}

/**
 * The chapter's reference list, or an empty string (`task:0034`).
 *
 * The PDF is the fourth reader-facing surface `task:0021` D5 named, and the one
 * where a missing reference list is not recoverable: a reader on a plane cannot
 * click through to `/bibliography`, so the in-text author-year citations point
 * at nothing the document contains.
 *
 * `task:0034` D1 chose the **house Basic style**, matching the site's default.
 * It is the one style that needs no `rendered.json`, so a contributor who has
 * not run `atlas citations render` still gets a reference list - which is what
 * makes AC-3 true without a second code path.
 *
 * Warn-never-block per `task:0021` D4: a missing or unreadable store costs the
 * PDF its references, never the build.
 */
function renderReferences(chapter: Chapter): string {
  let refs: Reference[];
  try {
    refs = chapterReferences(chapter);
  } catch {
    return '';
  }
  // AC-2: no heading over an empty list. A chapter citing nothing should end
  // where its prose ends, not on a promise the page does not keep.
  if (refs.length === 0) return '';

  return `
#pagebreak()
#heading(outlined: true, numbering: none)[References]

${refs.map(referenceToTypst).join('\n\n')}
`;
}

/**
 * One reference as Typst, with a hanging indent.
 *
 * `task:0034` D2: the address is **both** a link on the title and visible text
 * of its own. Typst can make a URL clickable and a printed page cannot, so a
 * reference whose address existed only as a hyperlink would be unusable on
 * paper - which is the medium this whole task exists for.
 */
function referenceToTypst(ref: Reference): string {
  const head = [ref.authors, ref.year && `(${ref.year})`].filter(Boolean).join(' ');
  const parts = [
    head && `${escapeTypst(head)}.`,
    `#link("${ref.url}")[${escapeTypst(ref.title)}].`,
    ref.container && `#emph[${escapeTypst(ref.container)}].`,
  ]
    .filter(Boolean)
    .join(' ');
  const address = `#text(size: 0.8em, fill: rgb("#666666"))[${escapeTypst(displayedUrl(ref))}]`;
  return `#par(hanging-indent: 1.5em)[${parts} \\\n${address}]`;
}

/** The address a reader reads off the page: no scheme, and not endless. */
function displayedUrl(ref: Reference): string {
  const bare = (ref.doi ? `doi.org/${ref.doi}` : ref.url).replace(/^https?:\/\//, '');
  return bare.length <= 110 ? bare : `${bare.slice(0, 109)}…`;
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
  const dictionaries = authors.map((author) => {
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

  if (node.name === 'Paragraph' || node.name === 'SpanGroup' || node.name === 'ListItem') {
    return node.children.flatMap((child) => renderNode(child, ctx));
  }

  if (node.name === 'Heading') {
    const level = node.attributes.level as number;
    const text = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    const prefix = '='.repeat(Math.min(level, 4));
    return `${prefix} ${text}`;
  }

  if (node.name === 'List') {
    return node.children.map((child) => {
      const content = child.children
        .map((c) => renderNode(c, ctx))
        .flat()
        .join('');
      return `${node.attributes.ordered ? '+' : '-'} ${content}\n`;
    });
  }

  if (node.name === 'Figure') {
    const { image, caption } = node.attributes;

    if (!image) return '';

    return `#figure(
    image("${image}", width: 90%),
    caption: [${caption ? [renderNode(caption as Node, ctx)].flat().join('') : ''}]
    )`;
  }

  if (node.name === 'Definition') {
    const { term, source } = node.attributes;

    const content = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    const sourceRendered = source ? [renderNode(source as Node, ctx)].flat().join('') : null;

    return `#definition-box(
      [${escapeTypst((term as string) || '')}],
      ${sourceRendered ? `[${sourceRendered}]` : 'none'},
      [${content}]
    )`;
  }

  if (node.name === 'Quote') {
    const { speaker, position, date, sourceUrl } = node.attributes;

    const content = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    const sourceUrlText = sourceUrl ? [renderNode(sourceUrl as Node, ctx)].flat().join('') : 'none';

    return `#quote-box(
    ${speaker ? `[${escapeTypst(speaker as string)}]` : 'none'},
    ${position ? `[${escapeTypst(position as string)}]` : 'none'},
    ${date ? `[${escapeTypst(date as string)}]` : 'none'},
    ${sourceUrl ? `[${sourceUrlText}]` : 'none'},
    [${content}]
    )`;
  }

  if (node.name === 'NoteBox') {
    const content = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    return `#note-box(
    [${escapeTypst((node.attributes.title as string) || 'Note')}],
    [${content}]
    )`;
  }

  if (node.name === 'Callout') {
    const { flavor } = node.attributes as { flavor?: string };
    const content = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    if (flavor === 'warning') {
      return `#warning-box([${content}])`;
    }

    throw new Error(`Unknown flavor for Callout: ${flavor}`);
  }

  if (node.name === 'InlineEquation') {
    return `$${node.attributes.content as string}$`;
  }

  if (node.name === 'DisplayEquation') {
    return `$ ${node.attributes.content as string} $`;
  }

  if (node.name === 'Footnote') {
    const content = node.children
      .map((child) => renderNode(child, ctx))
      .flat()
      .join('');
    return `#footnote[${content}]`;
  }

  if (node.name === 'Link') {
    const { href, content } = node.attributes;
    return `#link("${href}")[${escapeTypst(content as string)}]`;
  }

  if (node.name === 'Iframe') {
    const { stillImage, caption } = node.attributes;

    if (!stillImage) {
      console.warn(`Iframe has no still image`);
      return '';
    }
    const captionText = caption ? [renderNode(caption as Node, ctx)].flat().join('') : '';

    return `#figure(
    image("${stillImage}", width: 90%),
    caption: [${captionText} _(interactive version on website)_]
    )`;
  }

  console.warn(`Unknown node type: ${node.name}`);
  return '';
}

function renderSpan(node: Node, ctx: RenderContext): string {
  const { content, bold, italic, strikethrough, underline, link } = node.attributes;

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
