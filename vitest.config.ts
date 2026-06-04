import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Default `pnpm test` skips the smoke and a11y suites — both boot real
    // processes (`pnpm build`, `astro preview` + chromium) and take 30s+.
    // Run them explicitly with `pnpm test:smoke` / `pnpm test:a11y`.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/smoke/**', 'tests/a11y/**'],
  },
});
