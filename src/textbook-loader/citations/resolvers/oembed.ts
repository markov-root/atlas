/**
 * oEmbed resolver — YouTube videos, 15 unique URLs.
 *
 * YouTube's oEmbed endpoint needs no API key, which is why it is the whole
 * integration; a Data API key would buy upload date and view counts, but the
 * date would tempt inventing a publication year the metadata source does not
 * actually speak for. See the note in `resolve`.
 */
import { literalName, type CslItem } from '../store';
import type { Resolver } from './types';

const ENDPOINT = 'https://www.youtube.com/oembed';
const TIMEOUT_MS = 30_000;

type OEmbedResponse = { title?: unknown; author_name?: unknown };

export const oembedResolver: Resolver = {
  name: 'oembed',

  claims(canonicalUrl) {
    // Canonicalization (task:0025) has already folded youtu.be and mobile
    // forms into this exact shape; the resolver only needs to recognise it.
    return canonicalUrl.startsWith('https://www.youtube.com/watch?v=');
  },

  async resolve(canonicalUrl, ctx) {
    try {
      await ctx.throttle();
      const res = await ctx.fetch(
        `${ENDPOINT}?url=${encodeURIComponent(canonicalUrl)}&format=json`,
        {
          headers: { 'User-Agent': ctx.userAgent },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      // 401/404 here is YouTube's answer for deleted or private videos — a
      // normal outcome over 15 sources, not an error.
      if (!res.ok) return null;

      const body = (await res.json()) as OEmbedResponse;
      const title = typeof body.title === 'string' ? body.title : undefined;
      if (!title) return null;

      const fields: Partial<CslItem> = {
        // CSL has no "video" type; motion_picture is what the citation styles
        // expect for one.
        type: 'motion_picture',
        title,
        author: typeof body.author_name === 'string' ? [literalName(body.author_name)] : undefined,
        'container-title': 'YouTube',
        URL: canonicalUrl,
      };
      for (const key of Object.keys(fields)) {
        if (fields[key] === undefined) delete fields[key];
      }
      return {
        fields,
        source: 'oembed',
        // Honest in the store, not just in a comment: hand-curation will see
        // that this entry has no year and must not guess one from the channel.
        note: 'Metadata from YouTube oEmbed, which does not provide a publication date.',
      };
    } catch {
      return null;
    }
  },
};
