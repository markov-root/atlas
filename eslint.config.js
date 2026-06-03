// Minimal ESLint flat config. The point isn't to enforce a style — it's to
// catch genuine bugs and code smells without drowning agents/contributors in
// noise. Formatting is Prettier's job (see .prettierrc).
//
// Adding rules: prefer "warn" over "error" for non-bug issues; reserve
// "error" for things that genuinely fail the build (unused vars in code we
// just wrote, unreachable code, etc.).

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      '.cache/**',
      'src/assets/uc/**',
      'public/uc/**',
      '**/*.snap',
    ],
  },
  js.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs,astro}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // The transformer legitimately filters control characters from doc text.
      'no-control-regex': 'off',
      // Allow empty catch blocks (used for best-effort cleanup paths).
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Unused vars warn — TS already catches the meaningful ones via tsc.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Inline analytics scripts in <script> tags use legitimate expression
      // patterns that this rule misclassifies. TS catches real cases.
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      // TS already catches undefined identifiers more accurately than ESLint.
      'no-undef': 'off',
    },
  },
  {
    // .astro files: relax noisy rules. astro check (pnpm typecheck) is the
    // authoritative checker for Astro template type safety.
    files: ['**/*.astro'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // The astro plugin's recommended config flags template expressions like
      // `<MyComponent />` as unused expressions. Disabled — that's not a bug.
      'no-unused-expressions': 'off',
    },
  },
];
