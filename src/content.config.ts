import { defineCollection, z } from 'astro:content';
import { GOOGLE_CREDENTIALS_BASE64, ALGOLIA_WRITE_KEY } from "astro:env/server"
import { PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_INDEX_NAME } from "astro:env/client"
import { TEXTBOOK_EDITIONS } from './textbook-loader/data';
import { TextbookLoader } from './textbook-loader/loader';
import { indexTextbook } from './textbook-loader/algolia';
import { logosLoader, organizationSchema } from "@foreview/ais-logos-astro";

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

const textbooks = defineCollection({
  loader: async () => {
    let editions = TEXTBOOK_EDITIONS.map(async edition => {
      let textbook = await new TextbookLoader(GOOGLE_CREDENTIALS_BASE64, edition).load()

      // Index to Algolia if write key is available
      if (ALGOLIA_WRITE_KEY && PUBLIC_ALGOLIA_APP_ID) {
        await indexTextbook(textbook, PUBLIC_ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY, PUBLIC_ALGOLIA_INDEX_NAME)
      }

      // ID format: version-language (e.g., "v1-en", "v1-fr")
      return { id: `${textbook.version}-${textbook.language}`, ...textbook}
    })

    return Promise.all(editions)
  },
})

export const collections = { textbooks, organizations };
