import { getEntry, getCollection } from 'astro:content';
import type { Textbook } from '@/textbook-loader';
import { defaultLang, type Lang } from './index';

/**
 * Get a textbook by version and language, with fallback to default language.
 * 
 * @param version - The textbook version (e.g., 'v1')
 * @param lang - The desired language
 * @returns The textbook data, falling back to default language if not found
 */
export async function getTextbook(version: string, lang: Lang): Promise<Textbook> {
  // Try to get the textbook in the requested language
  const textbook = await getEntry('textbooks', `${version}-${lang}`);
  
  if (textbook) {
    return textbook.data;
  }
  
  // Fallback to default language
  if (lang !== defaultLang) {
    const fallback = await getEntry('textbooks', `${version}-${defaultLang}`);
    if (fallback) {
      return fallback.data;
    }
  }
  
  throw new Error(`Textbook not found: ${version}-${lang}`);
}

/**
 * Get the latest textbook version for a language, with fallback.
 * 
 * @param lang - The desired language
 * @returns The latest textbook data
 */
export async function getLatestTextbook(lang: Lang): Promise<Textbook> {
  const textbooks = await getCollection('textbooks');
  
  // Filter by language, then sort by version (descending)
  const forLang = textbooks
    .filter(t => t.data.language === lang)
    .sort((a, b) => b.data.version.localeCompare(a.data.version));
  
  if (forLang.length > 0) {
    return forLang[0].data;
  }
  
  // Fallback to default language
  if (lang !== defaultLang) {
    const fallback = textbooks
      .filter(t => t.data.language === defaultLang)
      .sort((a, b) => b.data.version.localeCompare(a.data.version));
    
    if (fallback.length > 0) {
      return fallback[0].data;
    }
  }
  
  throw new Error(`No textbooks found for language: ${lang}`);
}

/**
 * Get all textbooks, optionally filtered by language.
 * This uses fallback logic - if a version doesn't exist in the requested language,
 * it returns the default language version instead.
 */
export async function getTextbooks(lang?: Lang) {
  const textbooks = await getCollection('textbooks');
  
  if (!lang) {
    return textbooks;
  }
  
  // Get textbooks for the language, with fallback entries for missing versions
  const forLang = textbooks.filter(t => t.data.language === lang);
  const forDefault = textbooks.filter(t => t.data.language === defaultLang);
  
  // For each default language textbook, check if we have a localized version
  const result = forDefault.map(defaultTextbook => {
    const localized = forLang.find(t => t.data.version === defaultTextbook.data.version);
    return localized || defaultTextbook;
  });
  
  return result;
}

/**
 * Get all textbooks that actually exist for a specific language (no fallback).
 * Use this for generating static paths - only generates pages for textbooks
 * that exist in that language.
 */
export async function getTextbooksForLanguage(lang: Lang) {
  const textbooks = await getCollection('textbooks');
  return textbooks.filter(t => t.data.language === lang);
}
