// src/theme/DocItem/index.js
import React from 'react';
import DocItem from '@theme-original/DocItem';
import { useLocation } from '@docusaurus/router';
import ChapterLanding from './Landing/ChapterLanding';
import ChapterHeaderRenderer from './Headers/ChapterHeaderRenderer';

export default function DocItemWrapper(props) {
  const location = useLocation();
  
  // Debug logging - remove after testing
  console.log('🔍 DocItemWrapper called:', {
    pathname: location.pathname,
    isChapterPage: location.pathname.match(/^\/chapters\/\d+\/?$/) !== null,
    isSectionPage: location.pathname.match(/^\/chapters\/\d+\/\d+/) !== null,
    hasContent: !!props.content
  });
  
  // Fix: Detect chapter or section page with optional trailing slash
  const isChapterPage = location.pathname.match(/^\/chapters\/\d+\/?$/) !== null;
  const isSectionPage = location.pathname.match(/^\/chapters\/\d+\/\d+/) !== null;
  
  // Check if we're on the main chapters landing page
  if (location.pathname === '/' || 
      location.pathname === '/chapters' || 
      location.pathname === '/chapters/') {
    console.log('🏠 Rendering ChapterLanding - BYPASS DocItem completely');
    // Return ChapterLanding directly without any DocItem wrapper
    return <ChapterLanding />;
  }

  // For chapter/section pages, inject our custom header
  if (isChapterPage || isSectionPage) {
    console.log('📖 Rendering custom chapter/section header');
    // Extract the real data from props.content
    const frontMatter = props.content?.frontMatter || {};
    const metadata = props.content?.metadata || {};
    const title = metadata.title || frontMatter.title || 'Untitled';
    
    return (
      <div className="docitem-with-custom-header">
        {/* Render our custom header with the real data */}
        <ChapterHeaderRenderer 
          frontMatter={frontMatter}
          metadata={metadata}
          title={title}
          location={location}
          isChapterPage={isChapterPage}
          isSectionPage={isSectionPage}
        />
        
        {/* Render the original DocItem but hide its H1 and breadcrumbs */}
        <DocItem {...props} />
        
        {/* More comprehensive CSS to hide breadcrumbs and title */}
        <style jsx global>{`
          /* Hide breadcrumbs - try multiple possible class names */
          .docitem-with-custom-header .theme-doc-breadcrumbs,
          .docitem-with-custom-header [class*="breadcrumbs"],
          .docitem-with-custom-header nav[aria-label="Breadcrumbs"],
          .docitem-with-custom-header .breadcrumbs {
            display: none !important;
          }
          
          /* Hide the original H1 title */
          .docitem-with-custom-header article h1:first-of-type,
          .docitem-with-custom-header .markdown h1:first-child,
          .docitem-with-custom-header [class*="docTitle"] {
            display: none !important;
          }
          
          /* Hide any other title containers */
          .docitem-with-custom-header header[class*="docHeader"] {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }

  console.log('📄 Rendering original DocItem');
  // For all other pages, render the original DocItem
  return <DocItem {...props} />;
}
