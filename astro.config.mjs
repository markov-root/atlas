// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: 'https://ai-safety-atlas.com',
  redirects: {
    '/chapters': '/read',
  },
  integrations: [icon()],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false, // Allow large animated GIFs
      }
    }
  },
  env: {
    schema: {
      GOOGLE_CREDENTIALS_BASE64: envField.string({ context: "server", access: "secret"}),
      PUBLIC_ALGOLIA_APP_ID: envField.string({ context: "client", access: "public" }),
      PUBLIC_ALGOLIA_SEARCH_KEY: envField.string({ context: "client", access: "public" }),
      ALGOLIA_WRITE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      PUBLIC_ALGOLIA_INDEX_NAME: envField.string({ context: "client", access: "public", default: "atlas-foreview" }),
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  experimental: {
    svgo: true
  }
});
