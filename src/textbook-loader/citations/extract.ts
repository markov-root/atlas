/**
 * Extract citation instances from parsed section content.
 *
 * Bank B2 of `task:0021`. Pure: no file system, no network, no clock. Given the
 * same nodes it returns the same instances, which is what makes the whole
 * bibliography reproducible from the documents rather than maintained by hand.
 *
 * The key design point is that this function does not decide what a citation
 * *means* — it reports what it found and how confident the classification is.
 * A link whose anchor is "available here" is recorded as a content link, not
 * discarded, so that `atlas citations report` can show an author the difference
 * between "we ignored this" and "we never saw it".
 */
import type { Node } from '../transformer';
import type { Section } from '..';
import { isAuthorYearAnchor, parentheticalCitations } from './author-year';
import { canonicalizeUrl, isAssetUrl } from './canonical-url';

/** Why a link was or was not treated as a citation. */
export type CitationKind =
  /** Anchor text is an author-year reference. The bibliography case. */
  | 'citation'
  /** A real link, but the anchor is prose — "available here". Not a citation. */
  | 'content-link'
  /** Points at an image or stylesheet rather than a document. */
  | 'asset'
  /** Author-year text in a footnote with no hyperlink at all. */
  | 'unlinked';

export type CitationInstance = {
  /** Canonical URL — the bibliography entry identity. Null for `unlinked`. */
  key: string | null;
  /** The URL exactly as it appeared, kept so a report can show the original. */
  rawUrl: string | null;
  /** The link text, or the matched text for an unlinked citation. */
  anchorText: string;
  kind: CitationKind;
  /** Where in the prose this was found. */
  origin: 'inline' | 'footnote';
  /** Present when `origin` is 'footnote'. */
  footnoteNumber?: string;
  chapterNumber: number;
  sectionNumber: number;
  sectionSlug: string;
};

type Location = Pick<CitationInstance, 'chapterNumber' | 'sectionNumber' | 'sectionSlug'>;

function classify(rawUrl: string, anchorText: string): CitationKind {
  if (isAssetUrl(rawUrl)) return 'asset';
  return isAuthorYearAnchor(anchorText) ? 'citation' : 'content-link';
}

function linkInstance(
  node: Node,
  origin: 'inline' | 'footnote',
  loc: Location,
  footnoteNumber?: string,
): CitationInstance | null {
  const rawUrl = typeof node.attributes.href === 'string' ? node.attributes.href : null;
  if (!rawUrl) return null;
  const anchorText = typeof node.attributes.content === 'string' ? node.attributes.content : '';
  const kind = classify(rawUrl, anchorText);
  return {
    key: canonicalizeUrl(rawUrl),
    rawUrl,
    anchorText,
    kind,
    origin,
    ...(footnoteNumber === undefined ? {} : { footnoteNumber }),
    ...loc,
  };
}

/**
 * True for a value that is itself an AST node.
 *
 * Needed because **node content lives in two places in this AST**, with nothing
 * at the type level distinguishing them. `children` holds the obvious case, but
 * several components put a `SpanGroup` node inside an *attribute*:
 * `Figure.caption`, `Iframe.caption`, `Video.caption`, `Quote.sourceUrl` and
 * `Definition.source` (`transformer.ts:288-345`).
 *
 * A `children`-only walk silently misses every citation in a figure caption.
 * Measured on the committed corpus: 364 of 1,778 linked runs — 20% — were
 * invisible until this was added. `task:0015` (discriminated-union AST) is
 * aimed squarely at this class of trap; until it lands, every traversal has to
 * know about it.
 */
function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'attributes' in value &&
    'children' in value
  );
}

/** Every child of a node, from `children` *and* from node-valued attributes. */
export function allChildNodes(node: Node): Node[] {
  const out: Node[] = [...node.children];
  for (const value of Object.values(node.attributes)) {
    if (isNode(value)) out.push(value);
    else if (Array.isArray(value)) for (const v of value) if (isNode(v)) out.push(v);
  }
  return out;
}

/**
 * All text carried by a node subtree, used to find citations that carry no link.
 *
 * Spans are concatenated with **no separator**. The transformer preserves the
 * document's own whitespace inside each span's `content`, so inserting one here
 * corrupts the text: Google Docs routinely splits a sentence across several
 * spans, and a joining space turns `(Rodriguez, 2020)` into `( Rodriguez, 2020 )`,
 * which no citation pattern matches. That defect hid all 9 of the corpus's
 * unlinked footnote citations while every unit test passed, because constructed
 * fixtures put the citation in a single span.
 */
function subtreeText(nodes: Node[]): string {
  let out = '';
  const walk = (list: Node[]) => {
    for (const n of list) {
      if (typeof n.attributes.content === 'string') out += n.attributes.content;
      walk(allChildNodes(n));
    }
  };
  walk(nodes);
  return out;
}

/**
 * Citations inside a footnote that are plain text with no hyperlink.
 *
 * The corpus contains 9 of these. They have no URL, so they cannot be keyed the
 * way every other entry is — they are emitted with a null key and an `unlinked`
 * kind so that `task:0025` AC-5 holds: they surface in a report rather than
 * vanishing. Resolving them to real entries is a later, separate problem.
 */
function unlinkedFootnoteCitations(
  children: Node[],
  footnoteNumber: string,
  loc: Location,
  linkedAnchors: Set<string>,
): CitationInstance[] {
  const text = subtreeText(children);
  const matches = text.match(parentheticalCitations()) ?? [];
  const out: CitationInstance[] = [];
  for (const match of matches) {
    const inner = match.slice(1, -1).trim();
    // Skip any that a hyperlink in the same footnote already accounts for:
    // one citation should not be reported twice under two kinds.
    if (linkedAnchors.has(inner)) continue;
    out.push({
      key: null,
      rawUrl: null,
      anchorText: inner,
      kind: 'unlinked',
      origin: 'footnote',
      footnoteNumber,
      ...loc,
    });
  }
  return out;
}

/**
 * Every citation instance in one section, inline prose and footnotes alike.
 *
 * Footnotes are walked explicitly rather than by falling through the node tree,
 * so each instance can record which footnote it came from — an author fixing a
 * malformed citation needs to know where it lives.
 */
export function extractSectionCitations(section: Section): CitationInstance[] {
  const loc: Location = {
    chapterNumber: section.chapterNumber,
    sectionNumber: section.number,
    sectionSlug: section.slug,
  };
  const out: CitationInstance[] = [];

  const walkInline = (nodes: Node[]) => {
    for (const node of nodes) {
      // Footnote subtrees are handled separately below, from section.footnotes,
      // so that origin and footnote number are recorded correctly. Skipping the
      // subtree here is what stops each footnote citation being counted twice.
      if (node.name === 'Footnote') continue;
      if (node.name === 'Link') {
        const inst = linkInstance(node, 'inline', loc);
        if (inst) out.push(inst);
      }
      walkInline(allChildNodes(node));
    }
  };
  walkInline(section.nodes);

  for (const footnote of section.footnotes ?? []) {
    const children = footnote.children ?? [];
    const linkedAnchors = new Set<string>();
    const walkFootnote = (nodes: Node[]) => {
      for (const node of nodes) {
        if (node.name === 'Link') {
          const inst = linkInstance(node, 'footnote', loc, footnote.number);
          if (inst) {
            out.push(inst);
            linkedAnchors.add(inst.anchorText.trim());
          }
        }
        walkFootnote(allChildNodes(node));
      }
    };
    walkFootnote(children);
    out.push(...unlinkedFootnoteCitations(children, footnote.number, loc, linkedAnchors));
  }

  return out;
}

export type CitationSummary = {
  instances: CitationInstance[];
  /** Instances that are citations — excludes content links and assets. */
  citations: CitationInstance[];
  /** Distinct canonical URLs across all citations. */
  uniqueKeys: string[];
  counts: Record<CitationKind, number>;
};

/** Aggregate over many sections, with the counts a report and AC-2 both need. */
export function summarizeCitations(sections: Section[]): CitationSummary {
  const instances = sections.flatMap(extractSectionCitations);
  const counts: Record<CitationKind, number> = {
    citation: 0,
    'content-link': 0,
    asset: 0,
    unlinked: 0,
  };
  for (const i of instances) counts[i.kind]++;

  const citations = instances.filter((i) => i.kind === 'citation');
  const uniqueKeys = [...new Set(citations.map((i) => i.key).filter((k): k is string => !!k))];
  uniqueKeys.sort();

  return { instances, citations, uniqueKeys, counts };
}
