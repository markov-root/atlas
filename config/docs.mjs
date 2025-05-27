// config/docs.js
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const docsConfig = {
  routeBasePath: '/',
  sidebarPath: './sidebars.js',
  editUrl: 'https://github.com/markov-root/atlas/edit/main/',
  showLastUpdateTime: false,
  showLastUpdateAuthor: false,
  // Add math support to docs
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
};
