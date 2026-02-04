import type { Node } from "./transformer";

export function traverseNodes(nodes: Node[], visitor: (node: Node) => boolean | void): void {
  for (const node of nodes) {
    let keepGoing = visitor(node);
    if (keepGoing === false) {
      continue
    }
    traverseNodes(node.children, visitor);
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getNodeText(node: Node): string {
  if (node.name === "Span") {
    return (node.attributes.content as string) || "";
  }
  return node.children.map(getNodeText).join("");
}

export function formatReadingTime(time_in_s: number): string {
  const minutes = Math.round(time_in_s / 60);

  if (minutes > 90) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  return `${minutes} min`;
}

export function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length
}

/**
 * Extracts all text content from an AST node tree.
 * Handles all node types including Span, Link, GlossaryDefinition, equations,
 * and text stored in attributes (captions, titles, etc.)
 */
export function extractAllText(nodes: Node[]): string {
  const texts: string[] = [];

  traverseNodes(nodes, (node) => {
    if (node.name === "Span") {
      const content = node.attributes.content as string;
      if (content) texts.push(content);
    }

    if (node.name === "Link") {
      const content = node.attributes.content as string;
      if (content) texts.push(content);
    }

    if (node.name === "GlossaryDefinition") {
      const matchedText = node.attributes.matchedText as string;
      if (matchedText) texts.push(matchedText);
      return false; // Don't recurse into children
    }

    if (node.name === "InlineEquation" || node.name === "DisplayEquation") {
      const content = node.attributes.content as string;
      if (content) texts.push(`$${content}$`);
    }

    // Extract text from SpanGroup attributes (caption, source, sourceUrl)
    for (const key of ["caption", "source", "sourceUrl"]) {
      const spanGroup = node.attributes[key] as Node | undefined;
      if (spanGroup && typeof spanGroup === "object" && spanGroup.children) {
        texts.push(getNodeText(spanGroup));
      }
    }

    if (node.name === "NoteBox") {
      const title = node.attributes.title as string;
      if (title) texts.push(title);
    }

    return true;
  });

  return texts.join("");
}
