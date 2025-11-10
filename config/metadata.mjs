// config/metadata.mjs
export const metadata = {
  title: 'AI Safety Atlas',
  tagline: 'A guide to AI safety and alignment',
  favicon: 'img/favicon.ico',
  
  url: 'https://ai-safety-atlas.com',
  baseUrl: '/',
  
  organizationName: 'markov-root',
  projectName: 'markov-root.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // 'ignore' - Completely silent
  // 'warn' - Shows warning + exhaustive list
  // 'throw' - Fails the build 
  // Build configuration
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'ignore',
  
  // Markdown configuration - moved from onBrokenMarkdownLinks
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  
  staticDirectories: ['static'],
};
