// config/theme.mjs - Properly importing modular configurations
import {themes as prismThemes} from 'prism-react-renderer';
import { navbarConfig } from './navbar.mjs';
import { footerConfig } from './footer.mjs';
import { algoliaConfig } from './algolia.mjs';

export const themeConfig = {
  docs: {
    sidebar: {
      hideable: true,
      autoCollapseCategories: true,
    },
  },
  // Disable the table of contents sidebar completely
  tableOfContents: {
    minHeadingLevel: 2,
    maxHeadingLevel: 6,
  },
  
  // Color mode configuration
  colorMode: {
    defaultMode: 'light',
    disableSwitch: false,
    respectPrefersColorScheme: false,
  },
  
  // Prism theme configuration
  prism: {
    theme: prismThemes.github,
    darkTheme: prismThemes.dracula,
  },

  // Search module
  algolia: algoliaConfig,

  // Import navbar configuration from separate file
  navbar: navbarConfig,
  
  // Import footer configuration from separate file
  footer: footerConfig,
};
