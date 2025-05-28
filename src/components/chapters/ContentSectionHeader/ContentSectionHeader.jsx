// src/components/chapters/ContentSectionHeader/ContentSectionHeader.jsx
import React, { useEffect, useState } from 'react';
import styles from './ContentSectionHeader.module.css';

/**
 * Custom section header component for CONTENT within markdown (not page headers)
 * Automatically calculates reading time for content until next section
 * This is completely separate from your existing SectionHeader.jsx component
 */
export default function ContentSectionHeader({ 
  children, 
  id, 
  level = 2,
  showReadingTime = true,
  className = '',
  ...props 
}) {
  const [readingTime, setReadingTime] = useState(null);

  useEffect(() => {
    if (!showReadingTime || !id) return;

    // Calculate reading time for content until next section
    const calculateSectionReadingTime = () => {
      // Find the current section header container
      const currentHeaderContainer = document.getElementById(id)?.closest('[class*="contentSectionContainer"]');
      if (!currentHeaderContainer) {
        console.log('Header container not found:', id);
        return;
      }

      // Get all content until the next header container of same or higher level
      let content = '';
      let currentElement = currentHeaderContainer.nextElementSibling;
      
      while (currentElement) {
        // Stop if we hit another section header container
        if (currentElement.classList?.toString().includes('contentSectionContainer')) {
          // Check if it's same or higher level
          const nextHeader = currentElement.querySelector('h1, h2, h3, h4, h5, h6');
          if (nextHeader) {
            const tagName = nextHeader.tagName.toLowerCase();
            const headerLevel = parseInt(tagName.charAt(1));
            if (headerLevel <= level) break;
          }
        }

        // Collect text content from this element, excluding other headers
        const elementText = currentElement.textContent || '';
        content += ' ' + elementText;
        currentElement = currentElement.nextElementSibling;
      }

      // If no content found using container approach, try direct sibling approach
      if (content.trim().length < 50) {
        content = '';
        const currentHeader = document.getElementById(id);
        let nextElement = currentHeader?.parentElement?.nextElementSibling;
        
        while (nextElement) {
          // Stop at next custom header
          if (nextElement.classList?.toString().includes('contentSectionContainer')) {
            break;
          }
          
          // Stop at any regular header of same or higher level
          if (nextElement.tagName?.match(/^H[1-6]$/)) {
            const headerLevel = parseInt(nextElement.tagName.charAt(1));
            if (headerLevel <= level) break;
          }
          
          content += ' ' + (nextElement.textContent || '');
          nextElement = nextElement.nextElementSibling;
        }
      }

      // Calculate reading time (average 200 words per minute)
      const words = content.trim().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      // Only show reading time if we have substantial content (more than 10 words)
      if (wordCount > 10) {
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        setReadingTime(minutes);
        
        console.log('Reading time calculation:', {
          id,
          wordCount,
          minutes,
          contentPreview: content.substring(0, 150) + '...'
        });
      } else {
        console.log('Not enough content found for reading time:', { id, wordCount });
        setReadingTime(null);
      }
    };

    // Calculate with delays to ensure DOM is ready
    const timers = [200, 600, 1200].map(delay => 
      setTimeout(calculateSectionReadingTime, delay)
    );
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [id, level, showReadingTime]);

  // Generate the appropriate header tag
  const HeaderTag = `h${level}`;

  return (
    <div className={`${styles.contentSectionContainer} ${className}`}>
      <div className={styles.contentSectionContent}>
        {/* Main header with reading time */}
        <div className={styles.contentHeaderRow}>
          <HeaderTag 
            id={id} 
            className={styles.contentSectionTitle}
            {...props}
          >
            {children}
          </HeaderTag>
          
          {showReadingTime && readingTime && readingTime > 0 && (
            <div className={styles.contentReadingTime}>
              <span className={styles.contentReadingTimeIcon}>📖</span>
              <span className={styles.contentReadingTimeText}>
                {readingTime} min read
              </span>
            </div>
          )}
        </div>

        {/* Optional: Section progress indicator */}
        <div className={styles.contentSectionMeta}>
          <div className={styles.contentSectionDivider} />
        </div>
      </div>
    </div>
  );
}

/**
 * Specialized components for different header levels
 * These are for CONTENT headers within markdown, not page section headers
 */
export function ContentH2({ children, id, ...props }) {
  return (
    <ContentSectionHeader level={2} id={id} {...props}>
      {children}
    </ContentSectionHeader>
  );
}

export function ContentH3({ children, id, ...props }) {
  return (
    <ContentSectionHeader level={3} id={id} {...props}>
      {children}
    </ContentSectionHeader>
  );
}

export function ContentH4({ children, id, ...props }) {
  return (
    <ContentSectionHeader level={4} id={id} {...props}>
      {children}
    </ContentSectionHeader>
  );
}
