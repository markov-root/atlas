// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: 'https://atlas.foreview.org',
  integrations: [icon()],
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
