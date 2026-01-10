import en from './translations/en';
import fr from './translations/fr';

export const languages = {
  en: 'English',
  fr: 'Français',
} as const;

export const defaultLang = 'en' as const;

export type Lang = keyof typeof languages;

export const translations = { en, fr } as const;

export type TranslationKey = keyof typeof en;

/**
 * Get a translation string with optional interpolation.
 * 
 * Simple interpolation:
 *   t('greeting', 'en', { name: 'World' })
 *   // "Hello, {name}!" -> "Hello, World!"
 * 
 * Rich interpolation with tags (returns the string with tags for manual processing):
 *   t('footer.license', 'en')
 *   // "Content licensed under <license>CC BY-SA 4.0</license> unless otherwise noted."
 */
export function t(
  key: TranslationKey,
  lang: Lang = defaultLang,
  params?: Record<string, string | number>
): string {
  const translation: string = translations[lang]?.[key] ?? translations[defaultLang][key] ?? key;
  
  if (!params) return translation;
  
  let result = translation;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

/**
 * Parse a translation string with rich tags and return segments.
 * Useful for rendering translations with embedded links/components.
 * 
 * Example:
 *   parseRichText("Content under <license>CC BY-SA 4.0</license> noted.")
 *   // Returns: [
 *   //   { type: 'text', content: 'Content under ' },
 *   //   { type: 'tag', tag: 'license', content: 'CC BY-SA 4.0' },
 *   //   { type: 'text', content: ' noted.' }
 *   // ]
 */
export type RichTextSegment = 
  | { type: 'text'; content: string }
  | { type: 'tag'; tag: string; content: string };

export function parseRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = tagRegex.exec(text)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    
    // Add the tagged content
    segments.push({ type: 'tag', tag: match[1], content: match[2] });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  return segments;
}

/**
 * Get a rich translation and apply tag handlers.
 * 
 * Example:
 *   tRich('footer.license', 'en', {
 *     license: (text) => `<a href="...">${text}</a>`
 *   })
 */
export function tRich(
  key: TranslationKey,
  lang: Lang = defaultLang,
  handlers: Record<string, (content: string) => string>,
  params?: Record<string, string | number>
): string {
  const translation = t(key, lang, params);
  const segments = parseRichText(translation);
  
  return segments
    .map(segment => {
      if (segment.type === 'text') return segment.content;
      const handler = handlers[segment.tag];
      return handler ? handler(segment.content) : segment.content;
    })
    .join('');
}

/**
 * Get the current language from the URL path.
 */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

/**
 * Get the localized path for a given path and language.
 */
export function getLocalizedPath(path: string, lang: Lang): string {
  // Remove any existing language prefix
  const cleanPath = path.replace(/^\/(en|fr)/, '');
  
  // Default language doesn't need prefix
  if (lang === defaultLang) {
    return cleanPath || '/';
  }
  
  return `/${lang}${cleanPath || ''}`;
}

/**
 * Create a translation function bound to a specific language.
 * Useful in Astro components to avoid passing lang everywhere.
 */
export function useTranslations(lang: Lang) {
  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, lang, params),
    tRich: (key: TranslationKey, handlers: Record<string, (content: string) => string>, params?: Record<string, string | number>) => 
      tRich(key, lang, handlers, params),
    lang,
  };
}
