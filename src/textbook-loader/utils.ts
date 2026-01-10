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
