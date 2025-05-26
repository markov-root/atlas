// File: src/components/VideoEmbed.tsx

import React from 'react';
import styles from './VideoEmbed.module.css';
import clsx from 'clsx';

interface VideoEmbedProps {
  type: 'youtube' | 'vimeo' | 'other';
  videoId: string;
  caption?: string;
  source?: {
    authors: string;
    year: string;
    url?: string;
  };
  chapterNumber: number;
  videoNumber: number;
  className?: string;
  maxWidth?: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({
  type,
  videoId,
  caption,
  source,
  chapterNumber,
  videoNumber,
  className,
  maxWidth
}) => {
  const [hasError, setHasError] = React.useState(false);

  const getEmbedUrl = () => {
    switch (type) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${videoId}`;
      default:
        return videoId; // For other video types, assume videoId is the full URL
    }
  };

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

  return (
    <figure 
      className={clsx(styles.videoFigure, className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className={styles.videoContainer}>
        <div className={styles.videoLabel}>VIDEO</div>
        {hasError ? (
          <div className={styles.errorState}>
            Failed to load video
          </div>
        ) : (
          <iframe
            className={styles.iframe}
            src={getEmbedUrl()}
            title={caption || `Video ${chapterNumber}.${videoNumber}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleError}
          />
        )}
      </div>
      {(caption || source) && (
        <figcaption className={styles.caption}>
          <span className={styles.videoNumber}>
            Video {chapterNumber}.{videoNumber}:
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

export default VideoEmbed;
