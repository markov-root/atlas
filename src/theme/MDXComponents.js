// src/theme/MDXComponents.js
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import { ContentH2, ContentH3, ContentH4 } from '../components/chapters/ContentSectionHeader/ContentSectionHeader';

export default {
  ...MDXComponents,
  // Override only markdown content headers - this won't touch your existing page headers at all
  // Your ChapterHeader.jsx and SectionHeader.jsx components are completely untouched
  h2: (props) => <ContentH2 {...props} />,
  h3: (props) => <ContentH3 {...props} />,
  h4: (props) => <ContentH4 {...props} />,
  // Keep h1, h5, h6 as default
};
