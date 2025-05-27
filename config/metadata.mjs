// config/metadata.js

// Detect if we're in GitHub Pages environment
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                      process.env.GITHUB_ACTIONS === 'true' ||
                      process.env.CI === 'true';

export const metadata = {
  title: 'AI Safety Atlas',
  tagline: 'A comprehensive guide to AI safety and alignment',
  favicon: 'img/favicon.ico',
  
  // Conditional URLs - GitHub Pages when in CI, normal for local/production
  url: isGitHubPages ? 'https://markov-root.github.io' : 'http://localhost:3000',
  baseUrl: isGitHubPages ? '/atlas/' : '/',
  
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
