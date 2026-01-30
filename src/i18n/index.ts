import type { Textbook } from '@/textbook-loader';

// Keep language type for content that may still have language variants
export type Lang = 'en';
export const defaultLang = 'en' as const;

// Re-export content helpers
export { getTextbook, getLatestTextbook, getTextbooks, getTextbooksForLanguage } from './content';
