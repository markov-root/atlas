// config/metadata.js
export const metadata = {
  title: 'AI Safety Atlas',
  tagline: 'A comprehensive guide to AI safety and alignment',
  favicon: 'img/favicon.ico',
  
  // GitHub Pages test deployment config
  url: 'https://markov-root.github.io',
  baseUrl: '/atlas/',
  
  // GitHub deployment settings
  organizationName: 'markov-root',
  projectName: 'atlas',
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
