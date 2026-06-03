import { algoliasearch } from 'algoliasearch';
import type { Textbook, Chapter, Section } from '.';
import { getNodeText, traverseNodes } from './utils';
import type { Node } from './transformer';

// DocSearch expects this specific structure
export interface DocSearchRecord {
  objectID: string;
  url: string;
  url_without_anchor: string;
  anchor?: string;
  content: string | null;
  type: 'lvl0' | 'lvl1' | 'lvl2' | 'lvl3' | 'content';
  hierarchy: {
    lvl0: string;
    lvl1: string | null;
    lvl2: string | null;
    lvl3: string | null;
    lvl4: string | null;
    lvl5: string | null;
    lvl6: string | null;
  };
  version: string;
}

/**
 * Extract all text content from a section's nodes.
 */
function extractSectionText(nodes: Node[]): string {
  const parts: string[] = [];

  traverseNodes(nodes, (node) => {
    if (node.name === 'Span' || node.name === 'Link') {
      const text = node.attributes.content as string;
      if (text) parts.push(text);
    }
    if (node.name === 'GlossaryDefinition') {
      const text = node.attributes.matchedText as string;
      if (text) parts.push(text);
    }
    return true;
  });

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract headings with their slugs from a section's nodes.
 */
function extractHeadings(nodes: Node[]): { text: string; slug: string }[] {
  const headings: { text: string; slug: string }[] = [];

  traverseNodes(nodes, (node) => {
    if (node.name === 'Heading') {
      const text = getNodeText(node);
      const slug = node.attributes.slug as string;
      if (text && slug) headings.push({ text, slug });
    }
    return true;
  });

  return headings;
}

/**
 * Convert a textbook to DocSearch-compatible records.
 */
export function textbookToRecords(textbook: Textbook): DocSearchRecord[] {
  const records: DocSearchRecord[] = [];

  for (const chapter of textbook.chapters) {
    for (const section of chapter.sections) {
      const baseUrl = `/chapters/${textbook.version}/${chapter.slug}/${section.slug}`;
      const content = extractSectionText(section.nodes);
      const headings = extractHeadings(section.nodes);

      // Skip sections with very little content
      if (content.length < 50) continue;

      const chapterTitle = `Chapter ${chapter.number}: ${chapter.title}`;
      const sectionTitle = `${chapter.number}.${section.number} ${section.title}`;

      // Main section record
      records.push({
        objectID: baseUrl,
        url: baseUrl,
        url_without_anchor: baseUrl,
        content: content.slice(0, 5000),
        type: 'lvl1',
        hierarchy: {
          lvl0: chapterTitle,
          lvl1: sectionTitle,
          lvl2: null,
          lvl3: null,
          lvl4: null,
          lvl5: null,
          lvl6: null,
        },
        version: textbook.version,
      });

      // Create records for each heading (lvl2)
      for (const heading of headings) {
        const headingUrl = `${baseUrl}#${heading.slug}`;
        records.push({
          objectID: headingUrl,
          url: headingUrl,
          url_without_anchor: baseUrl,
          anchor: heading.slug,
          content: null,
          type: 'lvl2',
          hierarchy: {
            lvl0: chapterTitle,
            lvl1: sectionTitle,
            lvl2: heading.text,
            lvl3: null,
            lvl4: null,
            lvl5: null,
            lvl6: null,
          },
          version: textbook.version,
        });
      }
    }
  }

  return records;
}

/**
 * Index a textbook to Algolia.
 */
export async function indexTextbook(
  textbook: Textbook,
  appId: string,
  writeKey: string,
  indexName: string
): Promise<void> {
  const client = algoliasearch(appId, writeKey);
  const records = textbookToRecords(textbook);

  console.log(`[Algolia] Indexing ${records.length} records from ${textbook.version}...`);

  // Delete old records for this version first
  await client.deleteBy({
    indexName,
    deleteByParams: {
      filters: `version:${textbook.version}`,
    },
  });

  // Save new records
  await client.saveObjects({
    indexName,
    objects: records as unknown as Record<string, unknown>[],
  });

  console.log(`[Algolia] Done indexing ${textbook.version}`);
}
