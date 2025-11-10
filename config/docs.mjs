// config/docs.mjs
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGlossary from '../src/utils/remark-glossary.js';

export const docsConfig = {
  routeBasePath: '/',
  sidebarPath: './config/sidebars.js',
  editUrl: 'https://github.com/markov-root/atlas/edit/main/',
  showLastUpdateTime: false,
  showLastUpdateAuthor: false,
  remarkPlugins: [
    remarkMath,
    [remarkGlossary, {
      glossaryDir: './src/data/glossary',
      caseSensitive: false,
      excludeNodes: ['code', 'inlineCode', 'link', 'heading'],
      silent: true // Suppress warnings for empty glossary files
    }]
  ],
  rehypePlugins: [
    [rehypeKatex, {
      strict: false  // Suppress LaTeX strict mode warnings
    }]
  ],
};
