// src/components/chapters/Definition.jsx
import React from 'react';
import styles from './Definition.module.css';

/**
 * Definition component for key terms and concepts
 * @param {Object} props
 * @param {React.ReactNode} props.children - Definition content
 * @param {string} props.term - The term being defined
 * @param {string|React.ReactNode} props.source - Source citation with markdown links
 * @param {string|number} props.number - Definition number (e.g., "1", "2.1", etc.)
 * @param {string} props.label - Optional label to display instead of number (e.g., "1.1")
 */
export default function Definition({ 
  children, 
  term, 
  source,
  number,
  label
}) {
  // Process markdown links in source
  const processMarkdownLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Replace markdown links [text](url) with HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.sourceLink + '">$1</a>'
    );
  };

  const processedSource = typeof source === 'string' ? processMarkdownLinks(source) : source;

  // Use label if provided, otherwise use number
  const displayNumber = label || number;

  return (
    <div className={styles.definitionContainer}>
      
      {/* Left side - Icon, term, and metadata */}
      <div className={styles.headerLeft}>
        
        {/* Icon and term row */}
        <div className={styles.iconTermRow}>
          <div className={styles.iconContainer}>
            <img src="/img/icons/definition.svg" alt="" className={styles.definitionIcon} />
          </div>
          <div className={styles.termSection}>
            <div className={styles.termName}>{term}</div>
            
            {/* Metadata directly under the term */}
            <div className={styles.metadata}>
              <span className={styles.typeLabel}>
                Definition{displayNumber && ` ${displayNumber}`}
              </span>
              {source && (
                <>
                  <span className={styles.metaSeparator}>•</span>
                  <span 
                    className={styles.termSource}
                    dangerouslySetInnerHTML={{ __html: processedSource }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Right side - Definition content */}
      <div className={styles.definitionContent}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
      
    </div>
  );
}
