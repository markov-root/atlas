// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://atlas.foreview.org',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: false, // /read for English, /fr/read for French
    },
  },
  env: {
    schema: {
      GOOGLE_CREDENTIALS_BASE64: envField.string({ context: "server", access: "secret"})
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  experimental: {
    svgo: true
  }
});
