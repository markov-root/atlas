// src/components/chapters/Iframe.jsx
import React, { useState } from 'react';
import styles from './Iframe.module.css';

/**
 * Iframe component for embedding external content with responsive behavior
 * @param {Object} props
 * @param {string} props.src - URL of the content to embed
 * @param {string} props.caption - Optional caption for the embedded content
 * @param {string} props.title - Accessibility title for the iframe
 * @param {string} props.height - Optional custom height for the iframe
 * @param {string} props.width - Optional custom width for the iframe
 */
export default function Iframe({ 
  src, 
  caption, 
  title = "Embedded content",
  height = "500px", 
  width = "100%" 
}) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Process markdown links in caption
  const processMarkdownLinks = (text) => {
    if (!text) return '';
    
    // Replace markdown links [text](url) with HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.captionLink + '">$1</a>'
    );
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

      {caption && (
        <figcaption 
          className={styles.caption}
          dangerouslySetInnerHTML={{ __html: processMarkdownLinks(caption) }}
        />
      )}
    </figure>
  );
}
