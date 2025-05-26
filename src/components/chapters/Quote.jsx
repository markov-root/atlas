// src/components/chapters/Quote.jsx
import React, { useState, useEffect } from 'react';
import styles from './Quote.module.css';
import { Quote as QuoteIcon } from 'lucide-react';

/**
 * Enhanced Quote component styled to match the homepage testimonials design
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

  // Known authors with images
  const KNOWN_AUTHORS = {
    'Lord Kelvin': '/img/quotes/lord_kelvin.webp',
    'Rich Sutton': '/img/quotes/rich_sutton.jpg',
    'Vernor Vinge': '/img/quotes/vernor_vinge.jpg',
    'Victoria Krakovna': '/img/quotes/victoria_krakovna.webp',
    'Yann LeCun': '/img/quotes/yann_lecun.jpg',
    'Geoffrey Hinton': '/img/quotes/geoffrey_hinton.jpeg',
    'David Patterson': '/img/quotes/david_patterson.jpg'
  };

  // Determine image path based on speaker name
  useEffect(() => {
    if (!speaker) return;
    
    // Use provided avatarUrl if available
    if (avatarUrl) {
      setImagePath(avatarUrl);
      return;
    }
    
    // Check if we have a known author
    if (KNOWN_AUTHORS[speaker]) {
      setImagePath(KNOWN_AUTHORS[speaker]);
      return;
    }
    
    // Fallback to generating from speaker name
    const speakerSlug = speaker.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '');
      
    setImagePath(`/img/quotes/${speakerSlug}.jpg`);
  }, [speaker, avatarUrl]);

  const handleImageError = () => {
    setHasImageError(true);
  };

  // Check if author is known
  const isKnownAuthor = KNOWN_AUTHORS[speaker] || avatarUrl;

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
    <div className={`${styles.quoteCard} ${isKnownAuthor ? styles.knownAuthor : ''}`}>
      <div className={styles.quoteIconWrapper}>
        <QuoteIcon size={24} className={styles.quoteIcon} />
      </div>
      
      <blockquote className={styles.quote}>
        {children}
      </blockquote>
      
      <div className={styles.quoteFooter}>
        <div className={styles.authorSection}>
          <div className={styles.avatarWrapper}>
            {(!hasImageError && imagePath) ? (
              <img 
                src={imagePath} 
                alt={`${speaker}`} 
                className={styles.avatar}
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {speaker ? speaker.charAt(0) : 'A'}
              </div>
            )}
          </div>
          
          <div className={styles.quoteAuthor}>
            <div className={styles.name}>{speaker}</div>
            {position && <div className={styles.position}>{position}</div>}
          </div>
        </div>
        
        <div className={styles.quoteMetadata}>
          {date && <div className={styles.date}>{date}</div>}
          {source && (
            <div 
              className={styles.sourceText}
              dangerouslySetInnerHTML={{ __html: processedSource }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Quote;
