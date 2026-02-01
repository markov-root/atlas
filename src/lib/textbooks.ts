import { getEntry, getCollection } from 'astro:content';
import type { Textbook } from '@/textbook-loader';

/**
 * Get a textbook by version.
 */
export async function getTextbook(version: string): Promise<Textbook> {
  const textbook = await getEntry('textbooks', `${version}-en`);

  if (textbook) {
    return textbook.data;
  }

  throw new Error(`Textbook not found: ${version}`);
}

/**
 * Get the latest textbook version.
 */
export async function getLatestTextbook(): Promise<Textbook> {
  const textbooks = await getCollection('textbooks');

  const sorted = textbooks
    .filter(t => t.data.language === 'en')
    .sort((a, b) => b.data.version.localeCompare(a.data.version));

  if (sorted.length > 0) {
    return sorted[0].data;
  }

  throw new Error('No textbooks found');
}

/**
 * Get all English textbooks.
 */
export async function getTextbooks() {
  const textbooks = await getCollection('textbooks');
  return textbooks.filter(t => t.data.language === 'en');
}
