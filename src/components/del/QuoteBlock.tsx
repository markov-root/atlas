// File: src/components/QuoteBlock.tsx

import React from 'react';
import clsx from 'clsx';
import styles from './QuoteBlock.module.css';
import { ExternalLink } from 'lucide-react';

// Known authors with images in the static/quotes directory
const KNOWN_AUTHORS = {
  'Lord Kelvin': '/quotes/lord_kelvin.webp',
  'Rich Sutton': '/quotes/rich_sutton.jpg',
  'Vernor Vinge': '/quotes/vernor_vinge.jpg',
  'Victoria Krakovna': '/quotes/victoria_krakovna.webp',
  'Yann LeCun': '/quotes/yann_lecun.jpg'
};

interface QuoteBlockProps {
  speaker: string;
  position?: string;
  date?: string;
  source?: React.ReactNode;
  avatarUrl?: string;
  children: React.ReactNode;
  className?: string;
}

const QuoteBlock: React.FC<QuoteBlockProps> = ({
  speaker,
  position,
  date,
  source,
  avatarUrl,
  children,
  className
}) => {
  // Check if we have a known author image
  const knownAuthorImage = KNOWN_AUTHORS[speaker];
  const finalAvatarUrl = avatarUrl || knownAuthorImage;
  const isKnownAuthor = Boolean(knownAuthorImage);

  return (
    <figure className={clsx(
      styles.quoteBlock, 
      isKnownAuthor && styles.knownAuthor,
      className
    )}>
      <div className={styles.quoteContent}>
        <blockquote className={styles.quoteText}>
          {children}
        </blockquote>
        
        <figcaption className={styles.quoteMeta}>
          <div className={styles.quoteAttribution}>
            <div className={styles.avatarWrapper}>
              {finalAvatarUrl ? (
                <img 
                  src={finalAvatarUrl} 
                  alt={`${speaker}`} 
                  className={styles.avatar} 
                  loading="lazy"
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {speaker.charAt(0)}
                </div>
              )}
            </div>
            <div className={styles.speakerInfo}>
              <div className={styles.quoteSpeaker}>{speaker}</div>
              {position && <div className={styles.quotePosition}>{position}</div>}
            </div>
          </div>
          
          <div className={styles.quoteSource}>
            {date && <span className={styles.quoteDate}>{date}</span>}
            {source && (
              <span className={styles.quoteReference}>
                {typeof source === 'string' ? (
                  <a href={source} target="_blank" rel="noopener noreferrer">
                    Source <ExternalLink size={14} />
                  </a>
                ) : (
                  source
                )}
              </span>
            )}
          </div>
        </figcaption>
      </div>
    </figure>
  );
};

export default QuoteBlock;
