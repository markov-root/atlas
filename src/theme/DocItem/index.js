// src/theme/DocItem/index.js - Updated with Feedback Integration
import React, { useState, useEffect, useMemo } from 'react';
import DocItem from '@theme-original/DocItem';
import { useLocation } from '@docusaurus/router';
import ChapterLanding from './Landing/ChapterLanding';
import ChapterHeaderRenderer from './Headers/ChapterHeaderRenderer';
import ChapterFeedback from '../../components/Feedback/ChapterFeedback';

export default function DocItemWrapper(props) {
  const location = useLocation();
  const [isClient, setIsClient] = useState(false);

  // All hooks must be called before any early returns
  useEffect(() => {
    setIsClient(true);
  }, []);

  const pageType = useMemo(() => {
    const pathname = location.pathname;
    
    if (pathname === '/' || pathname === '/chapters' || pathname === '/chapters/') {
      return 'landing';
    }
    
    if (pathname.match(/^\/chapters\/\d+\/?$/)) {
      return 'chapter';
    }
    
    if (pathname.match(/^\/chapters\/\d+\/\d+/)) {
      return 'section';
    }
    
    return 'other';
  }, [location.pathname]);

  // Extract chapter and section numbers for feedback
  const { chapterNumber, sectionNumber } = useMemo(() => {
    const sectionMatch = location.pathname.match(/\/chapters\/(\d+)\/(\d+)/);
    if (sectionMatch) {
      return { 
        chapterNumber: sectionMatch[1], 
        sectionNumber: sectionMatch[2] 
      };
    }
    
    const chapterMatch = location.pathname.match(/\/chapters\/(\d+)/);
    return { 
      chapterNumber: chapterMatch ? chapterMatch[1] : null, 
      sectionNumber: null 
    };
  }, [location.pathname]);

  // Now we can do early returns after all hooks are called
  if (!isClient) {
    return null;
  }

  if (pageType === 'landing') {
    return <ChapterLanding />;
  }

  if (pageType === 'chapter' || pageType === 'section') {
    const frontMatter = props.content?.frontMatter || {};
    const metadata = props.content?.metadata || {};
    const title = metadata.title || frontMatter.title || 'Untitled';
    
    return (
      <div className="docitem-with-custom-header">
        <ChapterHeaderRenderer 
          frontMatter={frontMatter}
          metadata={metadata}
          title={title}
          location={location}
          isChapterPage={pageType === 'chapter'}
          isSectionPage={pageType === 'section'}
        />
        <DocItem {...props} />
        
        {/* Add feedback component at the end of docs pages */}
        {(pageType === 'chapter' || pageType === 'section') && chapterNumber && (
          <ChapterFeedback
            chapterNumber={chapterNumber}
            sectionNumber={sectionNumber}
            title={title}
            pathname={location.pathname}
            frontMatter={frontMatter}
          />
        )}
      </div>
    );
  }

  return <DocItem {...props} />;
}
