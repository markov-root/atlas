/**
 * Open Graph resolver — the long tail, 604 unique URLs, last in
 * `RESOLVER_ORDER` so it only runs when everything else declined.
 *
 * It will resolve worst, and that is expected: no API describes these pages.
 * `task:0027` says plainly that some entries will honestly end as "Author,
 * Year, URL". What this buys is titles (and, where a page bothers, site name
 * and date) for entries that would otherwise carry only anchor text.
 *
 * There is no HTML parser dependency and none should be added. The matching
 * below handles the common head shapes — `<meta property=... content=...>` in
 * either quote style, self-closing or not — and nothing else. It will not
 * handle tags written with unquoted attributes, `og:title` declared twice
 * with different casing, or metadata that lives below the read cap. For a
 * best-effort pass over 604 pages that is an accepted limitation, not a bug;
 * a page it misses simply resolves as the anchor already provides.
 */
import { inferCslType, type CslItem } from '../store';
import type { Resolver } from './types';

/** Short, because one hung page must not stall a 948-URL run. */
const TIMEOUT_MS = 10_000;

/**
 * Read at most the head of the page. 256 KiB comfortably covers the `<head>`
 * of anything sane; a multi-megabyte page must never reach this process's
 * memory. Char length ≈ byte length for the purposes of a cap.
 * Exported for the test that pins the truncation behaviour.
 */
export const MAX_OG_BYTES = 262_144;

/** http→https and short-domain redirects are common; more than 5 is a loop. */
const MAX_REDIRECTS = 5;

/**
 * Read the response body up to `cap` characters, then stop pulling. The
 * cancellation matters: a merely-sliced 50 MB response would still have been
 * 50 MB in memory.
 */
async function readCapped(body: ReadableStream<Uint8Array> | null, cap: number): Promise<string> {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (text.length < cap) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    // The cap was the point — abandon the rest of the stream either way.
    void reader.cancel().catch(() => {});
  }
  return text;
}

/** Decode the HTML entities that actually occur in meta/title content. */
function decodeEntities(text: string): string {
  // Found by sampling real pages (e.g. defcon.org titles render "&reg;");
  // anything outside the map passes through verbatim, which is acceptable.
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    reg: '®',
    copy: '©',
    trade: '™',
    mdash: '—',
    ndash: '–',
    hellip: '…',
    rsquo: '’',
    lsquo: '‘',
    ldquo: '“',
    rdquo: '”',
    laquo: '«',
    raquo: '»',
    eacute: 'é',
  };
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name: string) => named[name.toLowerCase()] ?? m);
}

/**
 * `content` of the first `<meta>` whose `property` or `name` equals `key`.
 * Both attributes are matched because og:* uses `property` while twitter:*,
 * sometimes aliased to the same keys, uses `name`.
 */
function metaContent(html: string, key: string): string | undefined {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const attr of tag[0].matchAll(/([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      attrs[attr[1].toLowerCase()] = decodeEntities(attr[2] ?? attr[3] ?? '');
    }
    if ((attrs['property'] ?? attrs['name'] ?? '').toLowerCase() === key) {
      const content = attrs['content'];
      if (content) return content;
    }
  }
  return undefined;
}

/** `<title>` fallback for pages with no og:title (surprisingly many). */
function readTitleTag(html: string): string | undefined {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) return undefined;
  const title = decodeEntities(match[1]).replace(/\s+/g, ' ').trim();
  return title || undefined;
}

export const opengraphResolver: Resolver = {
  name: 'opengraph',

  claims(canonicalUrl) {
    try {
      const protocol = new URL(canonicalUrl).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  },

  async resolve(canonicalUrl, ctx) {
    try {
      let target = new URL(canonicalUrl);
      let res: Response | null = null;
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        // Checked per hop, not once: the point of the rule is what the
        // redirect points at, not what we were given.
        if (target.protocol !== 'http:' && target.protocol !== 'https:') return null;
        await ctx.throttle();
        res = await ctx.fetch(target, {
          // Manual so each hop is scheme-checked by hand; 'follow' would chase
          // redirects without letting us refuse the ones we must not take.
          redirect: 'manual',
          headers: { 'User-Agent': ctx.userAgent },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (res.status < 300 || res.status >= 400) break;
        const location = res.headers.get('location');
        if (!location) return null;
        target = new URL(location, target);
        res = null;
      }
      if (!res || !res.ok) return null;

      const contentType = res.headers.get('content-type') ?? '';
      // A PDF or JSON blob has no meta tags; reading it would be waste.
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        return null;
      }

      const html = await readCapped(res.body, MAX_OG_BYTES);

      const title = metaContent(html, 'og:title') ?? readTitleTag(html);
      if (!title) return null; // nothing to add beyond what the anchor gives
      const titleFromFallback = !metaContent(html, 'og:title');

      const fields: Partial<CslItem> = {
        // Webpage vs post-weblog is decided by the URL's domain — the same
        // decision store.ts already made at extraction; reuse it, never fork it.
        type: inferCslType(canonicalUrl),
        title,
        'container-title': metaContent(html, 'og:site_name'),
        abstract: metaContent(html, 'og:description'),
      };

      const published = metaContent(html, 'article:published_time');
      const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(published ?? '');
      if (date) {
        // An ISO timestamp is a full date; keep day precision, styles trim.
        fields.issued = {
          'date-parts': [[Number(date[1]), Number(date[2]), Number(date[3])]],
        };
      }

      for (const key of Object.keys(fields)) {
        if (fields[key] === undefined) delete fields[key];
      }
      return {
        fields,
        source: 'opengraph',
        note: titleFromFallback
          ? 'Title read from the <title> tag; the page had no Open Graph metadata.'
          : undefined,
      };
    } catch {
      // Unreachable, timed out, malformed URL, aborted read — all decline.
      return null;
    }
  },
};
