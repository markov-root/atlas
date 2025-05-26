// File: src/components/FrameEmbed.tsx

import React from 'react';
import styles from './FrameEmbed.module.css';
import clsx from 'clsx';

interface FrameEmbedProps {
  src: string;
  type?: 'graph' | 'interactive';
  caption?: string;
  source?: {
    authors: string;
    year: string;
    url?: string;
  };
  chapterNumber: number;
  frameNumber: number;
  height?: string;
  className?: string;
  maxWidth?: string;
}

const FrameEmbed: React.FC<FrameEmbedProps> = ({
  src,
  type = 'interactive',
  caption,
  source,
  chapterNumber,
  frameNumber,
  height = '400px',
  className,
  maxWidth
}) => {
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    setHasError(true);
  };

  const renderSource = () => {
    if (!source) return null;
    
    const { authors, year, url } = source;
    const citation = `(${authors}, ${year})`;
    
    return url ? (
      <a href={url} className={styles.sourceLink} target="_blank" rel="noopener noreferrer">
        {citation}
      </a>
    ) : citation;
  };

  const labelText = type === 'graph' ? 'GRAPH' : 'INTERACTIVE';

  return (
    <figure 
      className={clsx(styles.frameFigure, className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className={styles.frameContainer}>
        <div className={styles.frameLabel}>{labelText}</div>
        {hasError ? (
          <div className={styles.errorState}>
            Failed to load {type}
          </div>
        ) : (
          <iframe
            className={styles.iframe}
            src={src}
            height={height}
            title={caption || `Interactive ${type} ${chapterNumber}.${frameNumber}`}
            loading="lazy"
            onError={handleError}
          />
        )}
      </div>
      {(caption || source) && (
        <figcaption className={styles.caption}>
          <span className={styles.frameNumber}>
            {type === 'graph' ? 'Graph' : 'Interactive Figure'} {chapterNumber}.{frameNumber}:
          </span>
          {' '}
          {caption}
          {source && (
            <>
              {' '}
              {renderSource()}
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
};

export default FrameEmbed;
