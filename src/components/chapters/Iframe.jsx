// src/components/chapters/Iframe.jsx
import React, { useState } from 'react';
import { useLocation } from '@docusaurus/router';
import Caption from './Caption';
import styles from './Iframe.module.css';

/**
 * Iframe component for embedding external content with responsive behavior
 * @param {Object} props
 * @param {string} props.src - URL of the content to embed
 * @param {string} props.caption - Optional caption for the embedded content
 * @param {string} props.title - Accessibility title for the iframe
 * @param {string} props.height - Optional custom height for the iframe
 * @param {string} props.width - Optional custom width for the iframe
 * @param {number} props.chapter - Chapter number for numbering
 * @param {number} props.number - Iframe number within chapter for numbering
 * @param {string} props.label - Optional label (e.g., "1.1") for numbering
 */
export default function Iframe({ 
  src, 
  caption, 
  title = "Embedded content",
  height = "500px", 
  width = "100%",
  chapter,
  number,
  label
}) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Auto-extract chapter number from URL if not provided
  const getChapterFromPath = () => {
    const match = location.pathname.match(/\/chapters\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const chapterNumber = chapter || getChapterFromPath();

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Determine if we should use responsive aspect ratio or fixed height
  const useFixedHeight = height && height !== "100%" && height !== "auto";

  return (
    <figure className={styles.iframeContainer}>
      {isLoading && (
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading content...</p>
        </div>
      )}
      
      <div 
        className={styles.iframeWrapper} 
        style={{ 
          paddingBottom: useFixedHeight ? "0" : "56.25%",
          height: useFixedHeight ? height : "auto"
        }}
      >
        <iframe
          src={src}
          title={title}
          width={width}
          height={useFixedHeight ? height : "100%"}
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          onLoad={handleLoad}
          className={styles.iframe}
          style={{ 
            height: useFixedHeight ? height : "100%",
            position: useFixedHeight ? "static" : "absolute"
          }}
        ></iframe>
      </div>

      {/* Caption with automatic numbering */}
      <Caption 
        caption={caption}
        mediaType="iframe"
        chapter={chapterNumber}
        number={number}
        label={label}
      />
    </figure>
  );
}
