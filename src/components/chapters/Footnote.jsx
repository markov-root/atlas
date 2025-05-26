// src/components/chapters/Footnote.jsx
import React, { useState, useEffect } from 'react';
import Tippy from '@tippyjs/react';
import styles from './Footnote.module.css';

// Helper function for scrolling to elements
function scrollToElement(elementId, highlight = true) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    if (highlight) {
      element.classList.add(styles.highlighted);
      setTimeout(() => element.classList.remove(styles.highlighted), 1500);
    }
  }
}

// Convert markdown links to HTML
function processMarkdownLinks(text) {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Minimal, elegant footnote component with Tippy tooltips
 */
export default function Footnote({ id, text, number }) {
  const footnoteId = id || `footnote-${Math.random().toString(36).substr(2, 9)}`;
  const processedText = typeof text === 'string' ? processMarkdownLinks(text) : text;

  const handleAnchorClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      scrollToElement(`footnote-content-${footnoteId}`);
    }
  };

  // Inject content into registry on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const contentElement = document.getElementById(`footnote-clone-${footnoteId}`);
      if (contentElement && text) {
        contentElement.innerHTML = typeof text === 'string' ? processMarkdownLinks(text) : text.toString();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [footnoteId, text]);

  return (
    <Tippy
      content={
        <div dangerouslySetInnerHTML={{ __html: processedText }} />
      }
      theme="atlas"
      placement="top"
      arrow={true}
      delay={[300, 0]}
      duration={[200, 150]}
      maxWidth={350}
      interactive={false}
    >
      <sup
        id={`footnote-ref-${footnoteId}`}
        className={styles.footnoteAnchor}
        onClick={handleAnchorClick}
        data-footnote-number={number || '?'}
      >
        {number || '*'}
      </sup>
    </Tippy>
  );
}

/**
 * Minimal footnote registry with elegant separator
 */
export function FootnoteRegistry({ title = "References" }) {
  const [footnotes, setFootnotes] = useState([]);
  
  useEffect(() => {
    const footnoteElements = document.querySelectorAll(`[id^="footnote-ref-"]`);
    const collectedFootnotes = Array.from(footnoteElements).map(el => {
      const id = el.id.replace('footnote-ref-', '');
      const number = el.getAttribute('data-footnote-number') || el.textContent;
      return { id, number };
    });
    setFootnotes(collectedFootnotes);
  }, []);
  
  if (!footnotes.length) return null;

  return (
    <div className={styles.footnoteSection}>
      {/* Use the provided SVG separator */}
      <div className={styles.separator}>
        <img 
          src="/img/footer_seperator.svg" 
          alt="Section separator" 
          className={styles.separatorSvg}
        />
      </div>

      <div className={styles.footnoteRegistry}>
        <h2 className={styles.registryTitle}>{title}</h2>
        
        <ol className={styles.footnoteList}>
          {footnotes.map(footnote => (
            <li 
              key={footnote.id} 
              id={`footnote-content-${footnote.id}`}
              className={styles.footnoteItem}
              value={parseInt(footnote.number) || undefined}
            >
              <div id={`footnote-clone-${footnote.id}`} />
              <Tippy
                content="Back to reference"
                theme="atlas"
                placement="top"
                delay={[200, 0]}
              >
                <button 
                  className={styles.backButton}
                  onClick={() => scrollToElement(`footnote-ref-${footnote.id}`)}
                  aria-label="Back to reference"
                >
                  ↩
                </button>
              </Tippy>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
