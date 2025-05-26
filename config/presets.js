// config/presets.js
import { docsConfig } from './docs.js';

export const presetsConfig = [
  [
    'classic',
    /** @type {import('@docusaurus/preset-classic').Options} */
    ({
      docs: docsConfig,
      blog: false,
      theme: {
        customCss: './src/css/custom.css',
      },
    }),
  ],
];
