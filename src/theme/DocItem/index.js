// src/theme/DocItem/index.js - Fixed feedback placement with DOM manipulation
import React, { useState, useEffect, useMemo, useRef } from 'react';
import DocItem from '@theme-original/DocItem';
import { useLocation } from '@docusaurus/router';
import ChapterLanding from './Landing';
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
        
        {/* Use wrapper component that controls the order */}
        <DocItemWithControlledFeedback 
          docItemProps={props}
          chapterNumber={chapterNumber}
          sectionNumber={sectionNumber}
          title={title}
          pathname={location.pathname}
          frontMatter={frontMatter}
        />
      </div>
    );
  }

  return <DocItem {...props} />;
}

/**
 * Wrapper that ensures feedback appears before pagination by moving DOM elements
 */
function DocItemWithControlledFeedback({ 
  docItemProps, 
  chapterNumber, 
  sectionNumber, 
  title, 
  pathname, 
  frontMatter 
}) {
  const containerRef = useRef(null);
  const feedbackRef = useRef(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    // Function to reorder elements with proper null checks
    const reorderElements = () => {
      const container = containerRef.current;
      const feedback = feedbackRef.current;
      
      // Early return if essential elements don't exist
      if (!container || !feedback) {
        return;
      }

      try {
        const pagination = container.querySelector('.pagination-nav');
        
        if (pagination && feedback && pagination.parentNode) {
          // Check if feedback is already in the correct position
          if (pagination.previousElementSibling !== feedback) {
            // Move feedback to be right before pagination
            pagination.parentNode.insertBefore(feedback, pagination);
          }
        }
      } catch (error) {
        console.warn('Error reordering feedback and pagination:', error);
      }
    };

    // Multiple delayed attempts to ensure DOM is ready
    const timers = [
      setTimeout(reorderElements, 50),
      setTimeout(reorderElements, 200),
      setTimeout(reorderElements, 500)
    ];

    // Set up mutation observer with error handling
    let observer = null;
    
    const setupObserver = () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        observer = new MutationObserver((mutations) => {
          // Debounce the reordering
          clearTimeout(window.reorderDebounce);
          window.reorderDebounce = setTimeout(reorderElements, 50);
        });

        observer.observe(container, {
          childList: true,
          subtree: true
        });
      } catch (error) {
        console.warn('Error setting up mutation observer:', error);
      }
    };

    // Set up observer after a delay
    const observerTimer = setTimeout(setupObserver, 100);

    return () => {
      // Clean up timers
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(observerTimer);
      clearTimeout(window.reorderDebounce);
      
      // Clean up observer
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMounted]);

  if (!chapterNumber) {
    return <DocItem {...docItemProps} />;
  }

  return (
    <div ref={containerRef} className="docitem-container-with-feedback">
      {/* Render the original DocItem */}
      <DocItem {...docItemProps} />
      
      {/* Feedback component - will be moved by the effect */}
      <div 
        ref={feedbackRef} 
        className="feedback-component-wrapper"
        style={{ 
          /* Ensure it's visible but will be repositioned */
          display: 'block'
        }}
      >
        <ChapterFeedback
          chapterNumber={chapterNumber}
          sectionNumber={sectionNumber}
          title={title}
          pathname={pathname}
          frontMatter={frontMatter}
        />
      </div>
    </div>
  );
}
