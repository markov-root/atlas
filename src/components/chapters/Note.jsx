// src/components/chapters/Note.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ActionButtonTooltip } from '../UI/Tooltip';
import styles from './Note.module.css';

/**
 * Collapsible Info Note component with reading time estimation
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the note
 * @param {string} props.title - Title of the note
 * @param {boolean|string} props.collapsed - Whether the note is initially collapsed
 */
export default function Note({ 
  children, 
  title = "Note", 
  collapsed = true
}) {
  // Convert the collapsed prop to a boolean
  const initialCollapsed = typeof collapsed === 'string' 
    ? collapsed.toLowerCase() === 'true' 
    : Boolean(collapsed);
    
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const contentRef = useRef(null);

  // Calculate word count and reading time
  useEffect(() => {
    if (contentRef.current) {
      const text = contentRef.current.textContent || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const count = words.length;
      setWordCount(count);
      
      // Average reading speed: 200 words per minute
      // Round up to nearest minute
      const minutes = Math.ceil(count / 200);
      setReadingTime(minutes);
    }
  }, [children]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Tooltip text based on current state
  const tooltipText = isCollapsed ? "Click to expand" : "Click to collapse";

  return (
    <div className={`${styles.noteContainer} ${isCollapsed ? styles.collapsed : styles.expanded}`}>
      
      {/* Optional tag - positioned absolutely */}
      <div className={styles.optionalTag}>
        Optional
      </div>
      
      {/* Header - always visible, clickable */}
      <ActionButtonTooltip content={tooltipText}>
        <div 
          className={styles.noteHeader}
          onClick={toggleCollapse}
          role="button"
          aria-expanded={!isCollapsed}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCollapse();
            }
          }}
        >
          
          {/* Left side - Icon and content */}
          <div className={styles.headerLeft}>
            
            {/* Icon */}
            <div className={styles.iconContainer}>
              <img src="/img/icons/info.svg" alt="" className={styles.infoIcon} />
            </div>
            
            {/* Title and metadata */}
            <div className={styles.titleSection}>
              <div className={styles.noteTitle}>{title}</div>
              <div className={styles.metadata}>
                <span className={styles.typeLabel}>Info</span>
                {readingTime > 0 && (
                  <>
                    <span className={styles.metaSeparator}>•</span>
                    <img src="/img/icons/reading-time.svg" alt="" className={styles.readingTimeIcon} />
                    <span className={styles.readingTime}>+{readingTime} min{readingTime !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
            
          </div>
          
          {/* Right side - Expand/Collapse icon */}
          <div className={styles.chevronContainer}>
            <img 
              src={isCollapsed ? "/img/icons/expand.svg" : "/img/icons/collapse.svg"}
              alt=""
              className={styles.chevronIcon}
            />
          </div>
          
        </div>
      </ActionButtonTooltip>
      
      {/* Content - collapsible */}
      <div 
        className={`${styles.noteContent} ${isCollapsed ? styles.contentCollapsed : styles.contentExpanded}`}
        style={{
          maxHeight: isCollapsed ? '0' : 'none',
          opacity: isCollapsed ? 0 : 1
        }}
      >
        <div className={styles.contentInner} ref={contentRef}>
          {children}
        </div>
      </div>
      
    </div>
  );
}
