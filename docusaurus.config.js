// docusaurus.config.js
import { metadata } from './config/metadata.js';
import { themeConfig } from './config/theme.js';
import { presetsConfig } from './config/presets.js';
import { pluginsConfig } from './config/plugins.js';
import { stylesheetsConfig } from './config/stylesheets.js';

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
