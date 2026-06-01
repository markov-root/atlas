import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Default `pnpm test` skips the smoke suite (it spawns `pnpm build`
    // and takes ~30s). Run it explicitly with `pnpm test:smoke`.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/smoke/**'],
  },
})
