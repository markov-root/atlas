// @ts-check
import { defineConfig, envField, svgoOptimizer } from 'astro/config';
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
      // Maintainer-only: needed to fetch fresh content from Google Docs.
      // Contributors build from the committed .cache/docs/ snapshot — see docs/CONTRIBUTING.md.
      GOOGLE_CREDENTIALS_BASE64: envField.string({ context: "server", access: "secret", optional: true }),
      // Public Algolia keys — safe to commit. The search-only key cannot
      // modify the index; only ALGOLIA_WRITE_KEY (secret) can.
      PUBLIC_ALGOLIA_APP_ID: envField.string({ context: "client", access: "public", default: "W6WTQ7JBP1" }),
      PUBLIC_ALGOLIA_SEARCH_KEY: envField.string({ context: "client", access: "public", default: "636da71890a5466401dc666df2be6fb3" }),
      ALGOLIA_WRITE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      PUBLIC_ALGOLIA_INDEX_NAME: envField.string({ context: "client", access: "public", default: "atlas-foreview" }),
      ELEVENLABS_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      GEMINI_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      SKIP_AUDIO: envField.string({ context: "server", access: "public", optional: true }),
      SKIP_PDF: envField.string({ context: "server", access: "public", optional: true }),
      R2_ENDPOINT: envField.string({ context: "server", access: "secret", optional: true }),
      R2_ACCESS_KEY_ID: envField.string({ context: "server", access: "secret", optional: true }),
      R2_SECRET_ACCESS_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      R2_BUCKET: envField.string({ context: "server", access: "secret", optional: true }),
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  experimental: {
    // Astro v6 renamed `svgo: true` → `svgOptimizer: svgoOptimizer()`.
    svgOptimizer: svgoOptimizer()
  }
});
