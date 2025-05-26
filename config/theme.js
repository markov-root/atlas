// config/theme.js
import {themes as prismThemes} from 'prism-react-renderer';
import { navbarConfig } from './navbar.js';
import { footerConfig } from './footer.js';

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
    respectPrefersColorScheme: true,
  },
  
  // Prism theme configuration
  prism: {
    theme: prismThemes.github,
    darkTheme: prismThemes.dracula,
  },
  
  navbar: navbarConfig,
  footer: footerConfig,
};
