import { defineCollection, z } from 'astro:content';
import { GOOGLE_CREDENTIALS_BASE64 } from "astro:env/server"
import { TEXTBOOK_EDITIONS } from './textbook-loader/data';
import { TextbookLoader } from './textbook-loader/loader';

const textbooks = defineCollection({
  loader: async () => {
    let editions = TEXTBOOK_EDITIONS.map(async edition => {
      let textbook = await new TextbookLoader(GOOGLE_CREDENTIALS_BASE64, edition).load()

      // ID format: version-language (e.g., "v1-en", "v1-fr")
      return { id: `${textbook.version}-${textbook.language}`, ...textbook}
    })

    return Promise.all(editions)
  },
})

export const collections = { textbooks };
