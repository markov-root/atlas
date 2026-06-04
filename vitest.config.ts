import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    // Default `pnpm test` skips the smoke suite (it spawns `pnpm build`
    // and takes ~30s). Run it explicitly with `pnpm test:smoke`.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/smoke/**', 'tests/a11y/**'],
  },
});
