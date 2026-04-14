import { docs_v1 } from "googleapis";
import { countWords, slugify } from "./utils";
import type { FootnoteData, GlossaryEntry, InstanceCount, Section, TocEntry } from ".";

export type Node = {
  name: string;
  attributes: Record<string, unknown>;
  children: Node[];
};

export type RawChapter = {
  title: string;
  description: string
  number: number;
  sections: Section[]
}

type Cell = docs_v1.Schema$StructuralElement | docs_v1.Schema$StructuralElement[] | undefined

/** Strip control characters (vertical tab, form feed, etc.) that leak from Google Docs. */
function stripControlChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export class Transformer {
  private sectionCounts: Map<string, number> = new Map();
  private chapterCounts: Map<string, number> = new Map();
  private textbookCounts: Map<string, number>;
  private ctx: docs_v1.Schema$DocumentTab;
  private sectionNumber = 0
  private chapterNumber = 0
  private glossary: GlossaryEntry[];

  constructor(ctx: docs_v1.Schema$DocumentTab, textbookCounts?: Map<string, number>, glossary: GlossaryEntry[]) {
    this.ctx = ctx
    this.textbookCounts = textbookCounts ?? new Map();
    this.glossary = glossary
  }

  transformSection(section, body: docs_v1.Schema$StructuralElement[]): Partial<Section> {
    // Google Docs does not wrap list items into a list component.
    // We accumulate list items and flush when the list ends.
    let inList: Node | null = null

    const flushList = () => {
      if (inList !== null) {
        section.nodes.push(inList)
        inList = null
      }
    }

    while (body.length > 0) {
      let el = body.shift()
      if (el === undefined) break

      // Check if this element continues the current list
      const listId = el.paragraph?.bullet?.listId
      const continuesList = listId && inList?.attributes.list === listId

      // Flush pending list if this element doesn't continue it
      if (!continuesList) {
        flushList()
      }

      // Handle tables
      if (el.table !== undefined) {
        if (el.table.columns !== 2) {
          console.log(
            `Ignoring non-component table with [${el.table.columns}] number of columns (supported: 2)`
          );
          continue;
        }

        const node = this.processComponent(el.table);
        if (!node) continue

        if (node.name === "SectionDescription") {
          section.description = node.attributes.value as string
          continue
        }

        section.readingTimeInSeconds += this.getComponentReadingTime(node);
        section.nodes.push(node);
        continue
      }

      // Handle non-paragraphs => ignore
      if (el.paragraph === undefined) {
        continue
      }

      // Skip empty paragraphs
      if (el.paragraph.elements === undefined || el.paragraph.elements.length === 0 || this.getTrimmedString(el) === "") {
        continue
      }

      const styleType = el.paragraph.paragraphStyle?.namedStyleType

      // End of section - put the HEADING_1 back for transformChapter to handle
      if (styleType === 'HEADING_1') {
        body.unshift(el)
        return section
      }

      // Handle headings
      if (styleType?.startsWith('HEADING_')) {
        let heading = this.createNode(
          "Heading", {
            level: parseInt(styleType.slice(8), 10),
            slug: slugify(this.getTrimmedString(el))
          },
          this.getSpans(el.paragraph)
        )

        section.toc.push({
          level: heading.attributes.level,
          slug: heading.attributes.slug,
          title: this.getTrimmedString(el)
        })
        section.nodes.push(heading)
        continue
      }

      // Handle regular paragraphs (not list items)
      if (!listId) {
        let spans = this.getSpans(el.paragraph)
        section.readingTimeInSeconds += this.wordsToSeconds(this.getSpansWordCount(spans))
        section.nodes.push(this.createNode("Paragraph", {}, spans))
        continue
      }

      // Handle list items
      const glyphFormat = this.ctx.lists?.[listId]?.listProperties?.nestingLevels?.[0].glyphFormat || ''
      let spans = this.getSpans(el.paragraph)
      section.readingTimeInSeconds += this.wordsToSeconds(this.getSpansWordCount(spans))

      if (inList === null) {
        inList = this.createNode(
          "List",
          { list: listId, ordered: glyphFormat.includes("%0") },
          [this.createNode("ListItem", {}, spans)]
        )
      } else {
        inList.children.push(this.createNode("ListItem", { list: listId }, spans))
      }
    }

    flushList()
    return section
  }

  transformChapter(body: docs_v1.Schema$StructuralElement[]): RawChapter {
    let chapter: RawChapter = {
      title: 'Untitled',
      description: '',
      number: 0,
      sections: [],
    }

    let section: Section | null = null

    while (body.length > 0) {
      let el = body.shift()
      if (el === undefined) {
        break
      }

      if (el.sectionBreak !== undefined) {
        continue
      }

      if (el.paragraph === undefined && section === null) {
        console.warn('Unexpected early element before encoutering first section', el)
        continue
      }

      if (el.paragraph === undefined && section !== null) {
        this.transformSection(section, body)
        continue
      }

      const styleType = el.paragraph!.paragraphStyle?.namedStyleType || undefined

      if (styleType === "TITLE") {
        let matches = this.getTrimmedString(el).match(/Chapter (?<number>\d+) - (?<title>.+)/)

        if (matches && matches.groups) {
          chapter.title = matches.groups.title
          chapter.number = parseInt(matches.groups.number, 10)
          this.chapterNumber = chapter.number
        }

        continue
      }

      if (styleType === "SUBTITLE") {
        chapter.description = this.getTrimmedString(el)

        continue
      }

      if (styleType === "HEADING_1") {
        const sectionTitle = this.getTrimmedString(el)
        if (sectionTitle === '') {
          continue
        }

        section = this.createSection(sectionTitle)
        chapter.sections.push(section)
        continue
      }

      if (section !== null) {
        body.unshift(el)
        this.transformSection(section, body)
      }
    }

    chapter.sections.forEach(section => {
      section.chapterNumber = chapter.number
    })

    return chapter
  }

  private createSection(title: string): Section {
    this.resetSectionCounts();
    return {
      chapterNumber: 0,
      number: ++this.sectionNumber,
      description: '',
      title,
      slug: slugify(title),
      toc: [],
      nodes: [],
      footnotes: [],
      readingTimeInSeconds: 0,
      prevSection: null,
      nextSection: null,
    }
  }

  private processComponent(table: docs_v1.Schema$Table): Node | null {
    const rows = table.tableRows!;

    const componentAttrs: Record<string, Cell> = {};

    for (const row of rows) {
      const [key, value] = row.tableCells!;

      componentAttrs[this.getTrimmedString(key.content)] = value.content;
    }

    if (componentAttrs.type === undefined) {
      return null
    }

    let componentType = this.getTrimmedString(componentAttrs.type)


    const converter = {
      video: this.convertVideo.bind(this),
      quote: this.convertQuote.bind(this),
      figure: this.convertFigure.bind(this),
      definition: this.convertDefinition.bind(this),
      noteBox: this.convertNoteBox.bind(this),
      "section-description": this.convertSectionDescription.bind(this),
      callout: this.convertCallout.bind(this),
      iframe: this.convertIframe.bind(this),
      }[componentType] || (() => {
        console.warn(`Unknown component type: [${componentType}]`);
        return null
      });

    const node = converter(componentAttrs);
    if (node === null) {
      return null
    }

    node.attributes.instanceCount = this.getInstanceCount(node.name);
    node.attributes.sectionNumber = this.sectionNumber;
    node.attributes.chapterNumber = this.chapterNumber;

    return node;
  }

  private convertVideo({ source, caption }: Record<string, Cell>): Node {
    return this.createNode("Video", {
      source: this.getTrimmedString(source),
      caption: this.getSpanGroup(caption)
    })
  }

  private convertQuote(attrs: Record<string, Cell>): Node {
    return this.createNode("Quote", {
      speaker: this.getTrimmedString(attrs['speaker']),
      position: this.getTrimmedString(attrs['position']),
      date: this.getTrimmedString(attrs['date']),
      sourceUrl: this.getSpanGroup(attrs['source-url']),
    }, [this.getSpanGroup(attrs['content'])])
  }

  private convertCallout(attrs: Record<string, Cell>): Node {
    return this.createNode("Callout", {
      flavor: this.getTrimmedString(attrs["flavor"])
    }, [this.getParagraph(attrs['content'])])
  }

  private convertSectionDescription(attrs: Record<string, Cell>): Node {
    return this.createNode("SectionDescription", { value: this.getTrimmedString(attrs['content'])})
  }

  private convertFigure(attrs: Record<string, Cell>): Node {
    return this.createNode("Figure", {
      image: this.getImage(attrs.content),
      caption: this.getSpanGroup(attrs.caption)
    })
  }

  private convertDefinition(attrs: Record<string, Cell>): Node {
    return this.createNode("Definition", {
      term: this.getTrimmedString(attrs.term),
      source: this.getSpanGroup(attrs.source),
    }, this.getDocFromSlice(attrs.content).nodes || [])
  }

  private convertNoteBox(attrs: Record<string, Cell>): Node {
    let content = this.getDocFromSlice(attrs.content)
    const title = this.getTrimmedString(attrs.title)

    return this.createNode("NoteBox", {
      title,
      slug: `notebox-${slugify(title)}`,
      collapsed: this.getBool(attrs.collapsed, true),
      readingTimeInSeconds: content.readingTimeInSeconds
    }, content.nodes)
  }

  private convertIframe(attrs: Record<string, Cell>): Node {
    return this.createNode("Iframe", {
      src: this.getTrimmedString(attrs.src ?? attrs.source),
      stillImage: this.getImage(attrs["still_image"]),
      caption: this.getSpanGroup(attrs["caption"])
    })
  }

  private getInstanceCount(componentName: string): InstanceCount {
    const inSection = (this.sectionCounts.get(componentName) || 0) + 1;
    const inChapter = (this.chapterCounts.get(componentName) || 0) + 1;
    const inTextbook = (this.textbookCounts.get(componentName) || 0) + 1;

    this.sectionCounts.set(componentName, inSection);
    this.chapterCounts.set(componentName, inChapter);
    this.textbookCounts.set(componentName, inTextbook);

    return { inSection, inChapter, inTextbook };
  }

  resetSectionCounts(): void {
    this.sectionCounts.clear();
  }

  private createNode(name: string, attributes: Record<string, unknown> = {}, children: (Node | null)[] = []) {
    return { name, attributes, children: children.filter(child => child !== null) }
  }

  private normalizeCell(cell: Cell): docs_v1.Schema$StructuralElement[] {
    if (Array.isArray(cell)) return cell
    if (cell === undefined) return []
    return [cell]
  }

  private getTrimmedString(cell: Cell): string {
    let content = "";

    for (const structEl of this.normalizeCell(cell)) {
      if (!structEl.paragraph) {
        continue;
      }

      for (const el of structEl.paragraph.elements ?? []) {
        content += el.textRun?.content || '';
      }
    }

    return stripControlChars(content).trim();
  }

  private getBool(cell: Cell, default_: boolean = false): boolean {
    const text = this.getTrimmedString(cell).toLowerCase()
    if (text === "true" || text === "yes") return true
    if (text === "false" || text === "no") return false
    return default_
  }

  private getDocFromSlice(cell: Cell): Partial<Section> {
    return this.transformSection({ nodes: [], readingTimeInSeconds: 0, footnotes: [], toc: [] }, this.normalizeCell(cell));
  }

  private getImage(cell: Cell): string | null {
    for (const structEl of this.normalizeCell(cell)) {
      if (!structEl.paragraph) {
        continue
      }

      for (const el of structEl.paragraph.elements ?? []) {
        if (!el.inlineObjectElement) {
          continue
        }

        let src = this.ctx.inlineObjects?.[el.inlineObjectElement.inlineObjectId || ''].inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri

        if (src) {
          return src
        }
      }
    }

    return null
  }

  private parseInlineSymbols(content: string, baseAttrs: Record<string, unknown>): Node[] {
    const nodes: Node[] = []
    let buffer = ''
    let i = 0

    while (i < content.length) {
      const char = content[i]

      if (char === '\\' && content[i + 1] === '$') {
        // Escaped dollar sign - add literal $
        buffer += '$'
        i += 2
        continue
      }

      if (char === '$') {
        // Check if this is the start of an equation
        const isDisplayStart = content[i + 1] === ' '

        // Find the closing delimiter
        let closeIndex = -1
        let isDisplay = false

        if (isDisplayStart) {
          // Look for " $" pattern for display equation
          closeIndex = content.indexOf(' $', i + 2)
          if (closeIndex !== -1) {
            isDisplay = true
            // closeIndex points to the space, we need to include it
          }
        }

        if (closeIndex === -1) {
          // Look for "$" for inline equation (no space before closing $)
          for (let j = i + 1; j < content.length; j++) {
            if (content[j] === '$' && content[j - 1] !== ' ') {
              closeIndex = j
              break
            }
          }
        }

        if (closeIndex !== -1) {
          // Found a valid equation
          if (buffer) {
            nodes.push(this.createNode("Span", { ...baseAttrs, content: buffer }))
            buffer = ''
          }

          let mathContent: string
          if (isDisplay) {
            // Display equation: $ content $ -> extract "content" (trim the spaces)
            mathContent = content.slice(i + 2, closeIndex).trim()
            nodes.push(this.createNode("DisplayEquation", { content: mathContent }))
            i = closeIndex + 2 // Skip past " $"
          } else {
            // Inline equation: $content$ -> extract "content"
            mathContent = content.slice(i + 1, closeIndex)
            nodes.push(this.createNode("InlineEquation", { content: mathContent }))
            i = closeIndex + 1 // Skip past "$"
          }
          continue
        } else {
          // No closing delimiter found, treat as literal $
          buffer += char
          i++
          continue
        }
      }

      buffer += char
      i++
    }

    // Handle remaining buffer
    if (buffer) {
      nodes.push(this.createNode("Span", { ...baseAttrs, content: buffer }))
    }

    return nodes
  }

  private getSpans(p: docs_v1.Schema$Paragraph): Node[] {
    if (p.elements === undefined) {
      return []
    }

    let spans: Node[] = []

    for (const el of p.elements) {
      if (el.footnoteReference !== undefined) {
        let content = this.ctx.footnotes?.[el.footnoteReference.footnoteId || ''].content || []

        spans.push(this.createNode("Footnote", {
          number: el.footnoteReference.footnoteNumber || '1'
        }, this.getDocFromSlice(content).nodes || []))
      }

      if (el.textRun === undefined) {
        continue
      }

      let content = stripControlChars(el.textRun.content || '')

      if (content === '' || content === '\n') {
        continue
      }

      if (content.endsWith('\n')) {
        content = content.slice(0, -1)
      }

      let textStyle = el.textRun.textStyle || {}
      let baseAttrs: Record<string, unknown> = {
        bold: textStyle.bold || false,
        italic: textStyle.italic || false,
        strikethrough: textStyle.strikethrough || false,
        underline: textStyle.underline || false,
        link: textStyle.link?.url || null,
      }

      // Docs shows links like " Hello" as an unstyled space and then the link "Hello"
      // We remove links in empty content for the same reason.
      // Note that "Hello world" would be treated as one link, so the " " would not be affected by this.
      if (content.trim() === '' && baseAttrs.link !== null) {
        baseAttrs.link = false
      }

      // We don't support equations in links, we could, but we don't.
      if (baseAttrs.link !== null) {
        spans.push(this.createNode("Link", {
          href: baseAttrs.link,
          content,
        }))
        continue
      }

      // Parse content for inline math
      const parsed = this.parseInlineSymbols(content, baseAttrs)
      for (const node of parsed) {
        if (node.name === "Span") {
          // Try to merge with previous span if attributes match
          const lastSpan = spans[spans.length - 1]
          if (lastSpan?.name === "Span") {
            const lastAttrs = lastSpan.attributes
            if (['bold', 'italic', 'strikethrough', 'underline', 'link'].every(k => lastAttrs[k] === node.attributes[k])) {
              lastAttrs.content = (lastAttrs.content as string) + (node.attributes.content as string)
              continue
            }
          }
        }
        spans.push(node)
      }
    }

    return spans.flatMap(span => {
      // We need to do this after consolidating.
      if (span.name !== 'Span') {
        return [span]
      }

      return this.wrapGlossaryTerms(span)
    })
  }

  /**
   * Wraps glossary terms found in a Span node with GlossaryDefinition nodes.
   * Splits "the alignment for" into ["the ", GlossaryDefinition("alignment"), " for"]
   */
  private wrapGlossaryTerms(span: Node): Node[] {
    const content = span.attributes.content as string
    if (!content) {
      return [span]
    }

    // Build a list of all terms and their aliases with references to the glossary entry
    const termMap = new Map<string, GlossaryEntry>()
    for (const entry of this.glossary) {
      termMap.set(entry.term.toLowerCase(), entry)
      for (const alias of entry.aliases || []) {
        termMap.set(alias.toLowerCase(), entry)
      }
    }

    // Sort terms by length (longest first) to match longer phrases before shorter ones
    const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length)

    if (sortedTerms.length === 0) {
      return [span]
    }

    // Build regex pattern that matches any glossary term (case insensitive, word boundaries)
    const escapedTerms = sortedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi')

    const result: Node[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(content)) !== null) {
      const matchedText = match[0]
      const matchedTermLower = match[1].toLowerCase()
      const entry = termMap.get(matchedTermLower)

      if (!entry) continue

      // Add text before the match as a Span (if any)
      if (match.index > lastIndex) {
        result.push(this.createNode("Span", {
          ...span.attributes,
          content: content.slice(lastIndex, match.index)
        }))
      }

      // Add the GlossaryDefinition node
      result.push(this.createNode("GlossaryDefinition", {
        term: entry.term,
        definition: entry.definition,
        sourceUrl: entry.sourceUrl,
        sourceLabel: entry.sourceLabel,
        matchedText: matchedText, // Preserve original casing
      }))

      lastIndex = match.index + matchedText.length
    }

    // If no matches were found, return the original span
    if (result.length === 0) {
      return [span]
    }

    // Add remaining text after the last match
    if (lastIndex < content.length) {
      result.push(this.createNode("Span", {
        ...span.attributes,
        content: content.slice(lastIndex)
      }))
    }

    return result
  }

  private getParagraph(cell: Cell): Node | null {
    let spanGroup = this.getSpanGroup(cell)
    if (spanGroup) {
      spanGroup.name = "Paragraph"
    }

    return spanGroup
  }

  private getSpanGroup(cell: Cell): Node | null {
    let spans: Node[] = []

    for (const structEl of this.normalizeCell(cell)) {
      if (!structEl.paragraph) {
        continue
      }

      spans = this.getSpans(structEl.paragraph)
      if (spans.length === 0) {
        continue
      }

      break
    }

    if (spans.length === 0) {
      return null
    }

    return this.createNode("SpanGroup", {}, spans)
  }

  private getSpansWordCount(spans: Node[]): number {
    let count = 0

    for (const span of spans) {
      if (span.name === "Span" || span.name === "Link") {
        count += countWords(span.attributes.content as string)
      } else if (span.name === "GlossaryDefinition") {
        count += countWords(span.attributes.matchedText as string)
      }
    }

    return count
  }

  private getNodeTreeWordCount(nodes: Node[]): number {
    let count = 0
    for (const node of nodes) {
      if (node.name === "Span" || node.name === "Link") {
        count += countWords(node.attributes.content as string)
      } else if (node.name === "GlossaryDefinition") {
        count += countWords(node.attributes.matchedText as string)
      }
      count += this.getNodeTreeWordCount(node.children)
    }
    return count
  }

  private wordsToSeconds(wordCount: number): number {
    return 60 / 200 * wordCount
  }

  private getComponentReadingTime(node: Node): number {
    let seconds = 0

    // Count words in all text children (quote content, callout content, definition content, etc.)
    seconds += this.wordsToSeconds(this.getNodeTreeWordCount(node.children))

    // Count words in SpanGroup attributes (captions, sources, etc.)
    for (const key of ["caption", "source", "sourceUrl"]) {
      const spanGroup = node.attributes[key]
      if (spanGroup && typeof spanGroup === "object" && (spanGroup as Node).children) {
        seconds += this.wordsToSeconds(this.getNodeTreeWordCount((spanGroup as Node).children))
      }
    }

    // NoteBox already tracks its own reading time via getDocFromSlice
    if (node.name === "NoteBox") {
      seconds = node.attributes.readingTimeInSeconds as number || 0
    }

    return seconds
  }
}
