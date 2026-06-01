import { defineCollection, z } from 'astro:content';
import { GOOGLE_CREDENTIALS_BASE64, ALGOLIA_WRITE_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, SKIP_AUDIO, SKIP_PDF } from "astro:env/server"
import { PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_INDEX_NAME } from "astro:env/client"
import { TEXTBOOK_EDITIONS } from './textbook-loader/data';
import { TextbookLoader } from './textbook-loader/loader';
import { indexTextbook } from './textbook-loader/algolia';
import { logosLoader, organizationSchema } from "@foreview/ais-logos-astro";
import { detectBuildMode } from './lib/build-mode';

const organizations = defineCollection({
  loader: logosLoader({
    urls: [
      "https://cesia.org",
      "https://ml4good.org",
      "https://bluedot.org",
      "https://www.enais.co",
    ],
  }),
  schema: organizationSchema,
});

const mode = detectBuildMode({
  GOOGLE_CREDENTIALS_BASE64,
  ALGOLIA_WRITE_KEY,
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  SKIP_PDF,
  SKIP_AUDIO,
  NODE_ENV: process.env.NODE_ENV,
});
console.log(mode.summary);

// Bridge Astro env vars to process.env for the audio renderer and R2 cache.
// Renderers consume these via process.env; gating happens here so a single
// BuildMode controls the whole pipeline.
if (ELEVENLABS_API_KEY) process.env.ELEVENLABS_API_KEY = ELEVENLABS_API_KEY;
if (GEMINI_API_KEY) process.env.GEMINI_API_KEY = GEMINI_API_KEY;
if (R2_ENDPOINT) process.env.R2_ENDPOINT = R2_ENDPOINT;
if (R2_ACCESS_KEY_ID) process.env.R2_ACCESS_KEY_ID = R2_ACCESS_KEY_ID;
if (R2_SECRET_ACCESS_KEY) process.env.R2_SECRET_ACCESS_KEY = R2_SECRET_ACCESS_KEY;
if (R2_BUCKET) process.env.R2_BUCKET = R2_BUCKET;
if (!mode.generatePdf) process.env.SKIP_PDF = "1";
if (!mode.generateAudio) process.env.SKIP_AUDIO = "1";

const textbooks = defineCollection({
  loader: async () => {
    let editions = TEXTBOOK_EDITIONS.map(async edition => {
      let textbook = await new TextbookLoader(
        GOOGLE_CREDENTIALS_BASE64 ?? null,
        edition,
        { cacheOnly: !mode.fetchFromGoogleDocs },
      ).load()

      if (mode.indexAlgolia && ALGOLIA_WRITE_KEY) {
        await indexTextbook(textbook, PUBLIC_ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY, PUBLIC_ALGOLIA_INDEX_NAME)
      }

      return { id: `${textbook.version}-${textbook.language}`, ...textbook}
    })

    return Promise.all(editions)
  },
})

export const collections = { textbooks, organizations };
