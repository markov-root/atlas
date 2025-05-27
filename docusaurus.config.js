// docusaurus.config.js
import { metadata } from './config/metadata.mjs';
import { themeConfig } from './config/theme.mjs';
import { presetsConfig } from './config/presets.mjs';
import { pluginsConfig } from './config/plugins.mjs';
import { stylesheetsConfig } from './config/stylesheets.mjs';

/** @type {import('@docusaurus/types').Config} */
const config = {
  // Site metadata
  ...metadata,
  
  // Presets configuration
  presets: presetsConfig,
  
  // Plugins configuration
  plugins: pluginsConfig,
  
  // External stylesheets
  stylesheets: stylesheetsConfig,
  
  // Theme configuration
  themeConfig: themeConfig,
};

export default config;
