// src/components/chapters/Quote.jsx
import React, { useState, useEffect } from 'react';
import styles from './Quote.module.css';
import { Quote as QuoteIcon } from 'lucide-react';

/**
 * Redesigned Quote component with responsive layout and better content distribution
 * @param {Object} props
 * @param {React.ReactNode} props.children - The quote text
 * @param {string} props.speaker - The person being quoted
 * @param {string} props.position - The speaker's position/title
 * @param {string} props.date - The date of the quote
 * @param {string|React.ReactNode} props.source - Source citation with markdown links
 * @param {string} props.avatarUrl - Optional explicit avatar URL
 */
const Quote = ({ 
  children, 
  speaker, 
  position, 
  date, 
  source,
  avatarUrl
}) => {
  const [imagePath, setImagePath] = useState(null);
  const [hasImageError, setHasImageError] = useState(false);

  // Determine image path based on speaker name
  useEffect(() => {
    if (!speaker) return;
    
    // Use provided avatarUrl if available
    if (avatarUrl) {
      setImagePath(avatarUrl);
      return;
    }
    
    // Generate speaker slug and try different file extensions
    const speakerSlug = speaker.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '');
    
    // Try common extensions in order of preference
    const extensions = ['.webp', '.jpg', '.png', '.jpeg'];
    const basePath = `/img/quotes/${speakerSlug}`;
    
    // Start with the first extension
    setImagePath(`${basePath}${extensions[0]}`);
  }, [speaker, avatarUrl]);

  const handleImageError = () => {
    if (!imagePath) return;
    
    // Try next extension if current one fails
    const speakerSlug = speaker?.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '') || '';
    
    const extensions = ['.webp', '.jpg', '.png', '.jpeg'];
    const basePath = `/img/quotes/${speakerSlug}`;
    
    // Find current extension and try the next one
    const currentExt = extensions.find(ext => imagePath.endsWith(ext));
    const currentIndex = extensions.indexOf(currentExt);
    
    if (currentIndex >= 0 && currentIndex < extensions.length - 1) {
      // Try next extension
      setImagePath(`${basePath}${extensions[currentIndex + 1]}`);
    } else {
      // All extensions failed
      setHasImageError(true);
    }
  };

  // Check if we have an image and it hasn't errored
  const hasImage = imagePath && !hasImageError;

  // Process markdown links in source
  const processMarkdownLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Replace markdown links [text](url) with HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.sourceLink + '">$1</a>'
    );
  };

  const processedSource = typeof source === 'string' ? processMarkdownLinks(source) : source;

  return (
    <div className={`${styles.quoteCard} ${hasImage ? styles.withImage : styles.withoutImage}`}>
      
      {/* Desktop Layout */}
      <div className={styles.desktopLayout}>
        
        {/* Left side - Image or Avatar */}
        <div className={styles.imageSection}>
          {hasImage ? (
            <div className={styles.imageContainer}>
              <img 
                src={imagePath} 
                alt={`${speaker}`} 
                className={styles.personImage}
                onError={handleImageError}
                loading="lazy"
              />
            </div>
          ) : (
            <div className={styles.avatarContainer}>
              <div className={styles.avatarPlaceholder}>
                {speaker ? speaker.charAt(0) : 'A'}
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Content */}
        <div className={styles.contentSection}>
          
          {/* Quote icon - positioned relative to content, not image */}
          <div className={styles.quoteIconWrapper}>
            <img src="/img/icons/quote.svg" alt="" className={styles.quoteIcon} />
          </div>
          
          {/* Quote text */}
          <blockquote className={styles.quote}>
            {children}
          </blockquote>
          
          {/* Footer with better layout */}
          <div className={styles.quoteFooter}>
            
            {/* Left side of footer - Author info */}
            <div className={styles.authorSection}>
              <div className={styles.authorName}>{speaker}</div>
              {position && <div className={styles.authorPosition}>{position}</div>}
            </div>
            
            {/* Right side of footer - Meta info */}
            <div className={styles.metaSection}>
              {date && <div className={styles.quoteDate}>{date}</div>}
              {source && (
                <div 
                  className={styles.quoteSource}
                  dangerouslySetInnerHTML={{ __html: processedSource }}
                />
              )}
            </div>
            
          </div>
        </div>
        
      </div>
      
      {/* Mobile Layout */}
      <div className={styles.mobileLayout}>
        
        {/* Header with just quote icon */}
        <div className={styles.mobileHeader}>
          
          {/* Quote icon */}
          <div className={styles.mobileQuoteIcon}>
            <img src="/img/icons/quote.svg" alt="" className={styles.mobileQuoteIconSvg} />
          </div>
          
        </div>
        
        {/* Quote text */}
        <blockquote className={styles.mobileQuote}>
          {children}
        </blockquote>
        
        {/* Footer with image and metadata */}
        <div className={styles.mobileFooter}>
          
          {/* Image section */}
          <div className={styles.mobileImageSection}>
            {hasImage ? (
              <div className={styles.mobileAvatar}>
                <img 
                  src={imagePath} 
                  alt={`${speaker}`} 
                  className={styles.mobileAvatarImage}
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className={styles.mobileAvatar}>
                <div className={styles.mobileAvatarPlaceholder}>
                  {speaker ? speaker.charAt(0) : 'A'}
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata section */}
          <div className={styles.mobileMetadata}>
            <div className={styles.mobileAuthor}>
              <div className={styles.mobileAuthorName}>{speaker}</div>
              {position && <div className={styles.mobileAuthorPosition}>{position}</div>}
            </div>
            
            <div className={styles.mobileMeta}>
              {date && <div className={styles.mobileDateSource}>
                <span className={styles.mobileDate}>{date}</span>
                {source && (
                  <>
                    <span className={styles.mobileSeparator}>•</span>
                    <span 
                      className={styles.mobileSource}
                      dangerouslySetInnerHTML={{ __html: processedSource }}
                    />
                  </>
                )}
              </div>}
              {!date && source && (
                <div 
                  className={styles.mobileSource}
                  dangerouslySetInnerHTML={{ __html: processedSource }}
                />
              )}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default Quote;
