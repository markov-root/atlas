// File: src/components/FigureEmbed.tsx

import React from 'react';
import styles from './FigureEmbed.module.css';
import clsx from 'clsx';

interface FigureEmbedProps {
  src: string;
  alt: string;
  caption: string;
  source?: {
    authors: string;
    year: string;
    url?: string;
  };
  chapterNumber: number;
  figureNumber: number;
  className?: string;
  maxWidth?: string;
}

const FigureEmbed: React.FC<FigureEmbedProps> = ({
  src,
  alt,
  caption,
  source,
  chapterNumber,
  figureNumber,
  className,
  maxWidth
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <figure 
      className={clsx(styles.figure, className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className={styles.imageContainer}>
        {isLoading && (
          <div className={styles.loadingPlaceholder}>
            Loading...
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={clsx(
            styles.image,
            isLoading && styles.loading,
            hasError && styles.error
          )}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.figureNumber}>
          Figure {chapterNumber}.{figureNumber}:
        </span>
        {' '}
        {caption}
      </figcaption>
    </figure>
  );
};

export default FigureEmbed;
