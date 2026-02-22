import type { Node } from "../transformer";
import type { Chapter, FootnoteData, Section } from "..";

type InstanceCount = { inSection: number; inChapter: number; inTextbook: number };

function getMediaLabel(prefix: string, node: Node): string {
  const ic = node.attributes.instanceCount as InstanceCount | undefined;
  const ch = node.attributes.chapterNumber as number | undefined;
  if (ch && ic) return `${prefix} ${ch}.${ic.inChapter}`;
  return prefix;
}

function renderInlineNode(node: Node): string {
  if (node.name === "Span") {
    let text = (node.attributes.content as string) || "";
    if (node.attributes.bold) text = `**${text}**`;
    if (node.attributes.italic) text = `*${text}*`;
    if (node.attributes.strikethrough) text = `~~${text}~~`;
    return text;
  }

  if (node.name === "Link") {
    const content = (node.attributes.content as string) || "";
    const href = (node.attributes.href as string) || "";
    return href ? `[${content}](${href})` : content;
  }

  if (node.name === "GlossaryDefinition") {
    return (node.attributes.matchedText as string) || "";
  }

  if (node.name === "InlineEquation") {
    return `$${node.attributes.content as string}$`;
  }

  if (node.name === "DisplayEquation") {
    return `$$\n${node.attributes.content as string}\n$$`;
  }

  if (node.name === "Footnote") {
    const num = node.attributes.number as string;
    return `[^${num}]`;
  }

  // Unknown inline — recurse into children
  return renderInlineChildren(node.children);
}

function renderInlineChildren(nodes: Node[]): string {
  return nodes.map(renderInlineNode).join("");
}

function renderSpanGroupText(node: Node | null | undefined): string {
  if (!node) return "";
  return renderInlineChildren(node.children);
}

function renderBlockNode(node: Node): string {
  if (node.name === "Paragraph" || node.name === "SpanGroup") {
    return renderInlineChildren(node.children);
  }

  if (node.name === "Heading") {
    const level = node.attributes.level as number;
    const prefix = "#".repeat(level);
    return `${prefix} ${renderInlineChildren(node.children)}`;
  }

  if (node.name === "List") {
    const ordered = node.attributes.ordered as boolean;
    return node.children
      .map((item, i) => {
        const text = renderInlineChildren(item.children);
        return ordered ? `${i + 1}. ${text}` : `- ${text}`;
      })
      .join("\n");
  }

  if (node.name === "Quote") {
    const speaker = node.attributes.speaker as string | undefined;
    const content = renderInlineChildren(node.children);
    const lines = content.split("\n").map((l) => `> ${l}`);
    if (speaker) lines.push(`> — ${speaker}`);
    return lines.join("\n");
  }

  if (node.name === "Callout") {
    const flavor = node.attributes.flavor as string | undefined;
    const content = renderBlockChildren(node.children);
    const prefix = flavor === "warning" ? "**Warning:** " : "";
    return content
      .split("\n")
      .map((l, i) => `> ${i === 0 ? prefix : ""}${l}`)
      .join("\n");
  }

  if (node.name === "Definition") {
    const term = node.attributes.term as string | undefined;
    const content = renderBlockChildren(node.children);
    return term ? `**Definition: ${term}** — ${content}` : content;
  }

  if (node.name === "NoteBox") {
    const title = node.attributes.title as string | undefined;
    const content = renderBlockChildren(node.children);
    const header = title ? `**${title}**` : "**Note**";
    return `${header}\n\n${content}`;
  }

  if (node.name === "Figure") {
    const label = getMediaLabel("Figure", node);
    const caption = renderSpanGroupText(
      node.attributes.caption as Node | undefined
    );
    return caption ? `*${label}: ${caption}*` : `*${label}*`;
  }

  if (node.name === "Video") {
    const label = getMediaLabel("Video", node);
    const caption = renderSpanGroupText(
      node.attributes.caption as Node | undefined
    );
    return caption ? `*${label}: ${caption}*` : `*${label}*`;
  }

  if (node.name === "Iframe") {
    const label = getMediaLabel("Interactive figure", node);
    const caption = renderSpanGroupText(
      node.attributes.caption as Node | undefined
    );
    return caption ? `*${label}: ${caption}*` : `*${label}*`;
  }

  if (node.name === "DisplayEquation") {
    return `$$\n${node.attributes.content as string}\n$$`;
  }

  if (node.name === "InlineEquation") {
    return `$${node.attributes.content as string}$`;
  }

  if (node.name === "Footnote") {
    return "";
  }

  // Unknown block — recurse
  return renderBlockChildren(node.children);
}

function renderBlockChildren(nodes: Node[]): string {
  return nodes
    .map(renderBlockNode)
    .filter((s) => s.length > 0)
    .join("\n\n");
}

function renderFootnotes(footnotes: FootnoteData[]): string {
  if (!footnotes || footnotes.length === 0) return "";

  const lines = footnotes.map(({ number, children }) => {
    const text = renderBlockChildren(children);
    return `[^${number}]: ${text}`;
  });

  return lines.join("\n\n");
}

export type MarkdownHeader = {
  title: string;
  description?: string;
  url: string;
};

/**
 * Render an array of AST nodes to a markdown string.
 */
export function renderNodesToMarkdown(
  nodes: Node[],
  footnotes?: FootnoteData[],
  header?: MarkdownHeader
): string {
  const parts: string[] = [];

  if (header) {
    parts.push(`# ${header.title}`);
    if (header.description) {
      parts.push(header.description);
    }
    parts.push(`[Read online](${header.url})`);
    parts.push("---");
  }

  parts.push(renderBlockChildren(nodes));

  const footnotesSection = renderFootnotes(footnotes ?? []);
  if (footnotesSection) {
    parts.push("---");
    parts.push(footnotesSection);
  }

  return parts.join("\n\n") + "\n";
}

/**
 * Render an entire chapter (all sections) to a single markdown string.
 */
export function renderChapterToMarkdown(
  chapter: Chapter,
  baseUrl: string
): string {
  const parts: string[] = [];

  parts.push(`# Chapter ${chapter.number}: ${chapter.title}`);
  if (chapter.sections[0]?.description) {
    parts.push(chapter.sections[0].description);
  }
  parts.push(`[Read online](${baseUrl})`);
  parts.push("---");

  for (const section of chapter.sections) {
    parts.push(`## ${section.title}`);
    if (section.description) {
      parts.push(section.description);
    }
    parts.push(renderBlockChildren(section.nodes));

    const footnotesSection = renderFootnotes(section.footnotes ?? []);
    if (footnotesSection) {
      parts.push(footnotesSection);
    }
  }

  return parts.join("\n\n") + "\n";
}
