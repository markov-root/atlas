import type { Node } from "../../transformer";
import { traverseNodes } from "../../utils";
import type { EquationDescriber } from "./equation-describer";

// Strips citation references like "(Author, 2023)" or "(Smith et al., 2020)"
function stripCitations(text: string): string {
  return text.replace(/\([A-Z][^)]*,\s*\d{4}[a-z]?\)/g, '').replace(/\s{2,}/g, ' ').trim();
}

const QUOTE_INTROS = [
  (speaker: string) => `Here is a quote by ${speaker}:`,
  (speaker: string) => `As ${speaker} said:`,
  (speaker: string) => `In the words of ${speaker}:`,
  (speaker: string) => `${speaker} once wrote:`,
  (speaker: string) => `To quote ${speaker}:`,
];

const DEFINITION_INTROS = [
  (term: string) => `Let's define ${term}.`,
  (term: string) => `We define ${term} as follows.`,
  (term: string) => `Here is a definition of ${term}.`,
  (term: string) => `The term ${term} refers to the following.`,
];

const FIGURE_INTROS = [
  (num: string) => `The textbook includes ${num} here.`,
  (num: string) => `At this point, the textbook shows ${num}.`,
  (num: string) => `There is ${num} in the textbook here.`,
];

const VIDEO_INTROS = [
  (num: string) => `The textbook includes ${num} here, which you may want to watch separately.`,
  (num: string) => `At this point there is ${num} in the textbook.`,
];

const IFRAME_INTROS = [
  (num: string) => `The textbook has ${num} here, which you can explore in the online version.`,
  (num: string) => `At this point there is ${num} in the textbook, available in the online version.`,
];

function deterministicChoice<T>(arr: ((s: string) => T)[], key: string, arg: string): T {
  // Use a simple hash of key so the choice is deterministic but varies per term
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length](arg);
}

type InstanceCount = { inSection: number; inChapter: number; inTextbook: number };

function getMediaLabel(prefix: string, node: Node): string {
  const ic = node.attributes.instanceCount as InstanceCount | undefined;
  const ch = node.attributes.chapterNumber as number | undefined;
  if (ch && ic) return `${prefix} ${ch}.${ic.inChapter}`;
  return `a ${prefix.toLowerCase()}`;
}

function getSpanText(node: Node): string {
  return (node.attributes.content as string) || '';
}

function getChildrenText(nodes: Node[], describer: EquationDescriber): string {
  return nodes.map(n => getNodeInlineText(n, describer)).join('');
}

function getNodeInlineText(node: Node, describer: EquationDescriber): string {
  if (node.name === 'Span') return getSpanText(node);
  if (node.name === 'Link') return (node.attributes.content as string) || '';
  if (node.name === 'GlossaryDefinition') return (node.attributes.matchedText as string) || '';
  if (node.name === 'InlineEquation') {
    const latex = node.attributes.content as string;
    return describer.getDescription(latex, 'inline') ?? `the expression ${latex}`;
  }
  if (node.name === 'DisplayEquation') {
    const latex = node.attributes.content as string;
    return describer.getDescription(latex, 'display') ?? `the equation ${latex}`;
  }
  if (node.name === 'Footnote') return ''; // Skip footnotes inline
  return getChildrenText(node.children, describer);
}

export class TextRenderer {
  private describer: EquationDescriber;

  constructor(describer: EquationDescriber) {
    this.describer = describer;
  }

  /**
   * Collect all unique LaTeX expressions from an array of nodes so
   * the equation describer can batch-fetch descriptions before rendering.
   */
  collectEquations(nodes: Node[]): { latex: string; type: 'inline' | 'display' }[] {
    const equations: { latex: string; type: 'inline' | 'display' }[] = [];
    traverseNodes(nodes, (node) => {
      if (node.name === 'InlineEquation' || node.name === 'DisplayEquation') {
        const latex = node.attributes.content as string;
        if (latex) equations.push({ latex, type: node.name === 'InlineEquation' ? 'inline' : 'display' });
      }
    });
    return equations;
  }

  /**
   * Render an array of AST nodes to an array of spoken paragraph strings.
   * Each block-level node (Paragraph, Heading, Quote, Definition, etc.)
   * becomes one entry in the array — this is the caching unit for TTS.
   */
  renderNodes(nodes: Node[]): string[] {
    const paragraphs: string[] = [];

    for (const node of nodes) {
      const rendered = this.renderBlockNode(node);
      if (rendered) paragraphs.push(rendered);
    }

    return paragraphs;
  }

  private renderBlockNode(node: Node): string | null {
    if (node.name === 'Paragraph') {
      const text = stripCitations(getChildrenText(node.children, this.describer)).trim();
      return text || null;
    }

    if (node.name === 'SpanGroup') {
      const text = stripCitations(getChildrenText(node.children, this.describer)).trim();
      return text || null;
    }

    if (node.name === 'Heading') {
      const level = node.attributes.level as number;
      const text = getChildrenText(node.children, this.describer).trim();
      if (level <= 2) {
        const num = node.attributes.number as string | undefined;
        return num ? `Section ${num}: ${text}` : `Section: ${text}`;
      }
      return `Subsection: ${text}`;
    }

    if (node.name === 'List') {
      const ordered = node.attributes.ordered as boolean;
      const items = node.children.map((child, i) => {
        const itemText = getChildrenText(child.children, this.describer).trim();
        return ordered ? `${i + 1}. ${itemText}` : `- ${itemText}`;
      });
      return items.join(' ');
    }

    if (node.name === 'Quote') {
      const speaker = node.attributes.speaker as string | undefined;
      const content = stripCitations(getChildrenText(node.children, this.describer)).trim();
      if (speaker) {
        const intro = deterministicChoice(QUOTE_INTROS, speaker, speaker);
        return `${intro} ${content}`;
      }
      return content;
    }

    if (node.name === 'Definition') {
      const term = node.attributes.term as string | undefined;
      const content = stripCitations(getChildrenText(node.children, this.describer)).trim();
      if (term) {
        const intro = deterministicChoice(DEFINITION_INTROS, term, term);
        return `${intro} ${content}`;
      }
      return content;
    }

    if (node.name === 'NoteBox') {
      const title = node.attributes.title as string | undefined;
      if (title) {
        return `The textbook has a supplementary note titled "${title}", which we'll skip over here.`;
      }
      return `The textbook has a supplementary note here, which we'll skip over.`;
    }

    if (node.name === 'Callout') {
      const flavor = node.attributes.flavor as string | undefined;
      const content = stripCitations(getChildrenText(node.children, this.describer)).trim();
      if (flavor === 'warning') {
        return `Warning: ${content}`;
      }
      return content;
    }

    if (node.name === 'Figure') {
      const label = getMediaLabel('Figure', node);
      const caption = node.attributes.caption as Node | undefined;
      const captionText = caption ? stripCitations(getChildrenText(caption.children ?? [], this.describer)).trim() : '';
      const intro = deterministicChoice(FIGURE_INTROS, label, label);
      if (captionText) return `${intro} It depicts ${captionText}`;
      return intro;
    }

    if (node.name === 'Video') {
      const label = getMediaLabel('Video', node);
      const caption = node.attributes.caption as Node | undefined;
      const captionText = caption ? stripCitations(getChildrenText(caption.children ?? [], this.describer)).trim() : '';
      const intro = deterministicChoice(VIDEO_INTROS, label, label);
      if (captionText) return `${intro} It covers ${captionText}`;
      return intro;
    }

    if (node.name === 'Iframe') {
      const label = getMediaLabel('Interactive figure', node);
      const caption = node.attributes.caption as Node | undefined;
      const captionText = caption ? stripCitations(getChildrenText(caption.children ?? [], this.describer)).trim() : '';
      const intro = deterministicChoice(IFRAME_INTROS, label, label);
      if (captionText) return `${intro} It shows ${captionText}`;
      return intro;
    }

    if (node.name === 'Footnote') {
      return null; // Skip footnotes
    }

    if (node.name === 'DisplayEquation') {
      const latex = node.attributes.content as string;
      const desc = this.describer.getDescription(latex, 'display');
      return desc ?? `The following equation: ${latex}`;
    }

    if (node.name === 'InlineEquation') {
      // Shouldn't be top-level but handle defensively
      const latex = node.attributes.content as string;
      const desc = this.describer.getDescription(latex, 'inline');
      return desc ?? null;
    }

    if (node.name === 'Link') {
      return (node.attributes.content as string) || null;
    }

    if (node.name === 'GlossaryDefinition') {
      return (node.attributes.matchedText as string) || null;
    }

    // Recurse into unknown container nodes
    const parts: string[] = [];
    for (const child of node.children) {
      const r = this.renderBlockNode(child);
      if (r) parts.push(r);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
