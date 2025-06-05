// config/metadata.mjs
export const metadata = {
  title: 'AI Safety Atlas',
  tagline: 'A comprehensive guide to AI safety and alignment',
  favicon: 'img/favicon.ico',
  
  // Change to your custom domain
  url: 'https://ai-safety-atlas.com',  // ← Changed from markov-root.github.io
  baseUrl: '/',
  
  // GitHub deployment settings - keep the same
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
