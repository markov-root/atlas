// config/metadata.mjs

export const metadata = {
  title: 'AI Safety Atlas',
  tagline: 'A comprehensive guide to AI safety and alignment',
  favicon: 'img/favicon.ico',
  
  // GitHub User Pages - always use baseUrl: /
  url: 'https://markov-root.github.io',
  baseUrl: '/',
  
  // GitHub deployment settings
  organizationName: 'markov-root',
  projectName: 'markov-root.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  
  // Build configuration
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  
  // Static directories
  staticDirectories: ['static'],
};
