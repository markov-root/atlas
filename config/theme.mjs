// config/theme.mjs - Properly importing modular configurations
import {themes as prismThemes} from 'prism-react-renderer';
import { navbarConfig } from './navbar.mjs';
import { footerConfig } from './footer.mjs';

export const themeConfig = {
  docs: {
    sidebar: {
      hideable: false,
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
  
  // Import navbar configuration from separate file
  navbar: navbarConfig,
  
  // Import footer configuration from separate file
  footer: footerConfig,
};
