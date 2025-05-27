// config/presets.mjs
import { docsConfig } from './docs.mjs';

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
