// src/components/chapters/Video.jsx
import React, { useState } from 'react';
import styles from './Video.module.css';

/**
 * Video component for embedding videos with responsive behavior and accessibility
 * @param {Object} props
 * @param {string} props.type - Type of video ('youtube', 'vimeo', 'mp4', 'webm')
 * @param {string} props.videoId - Video ID for YouTube/Vimeo, or full URL for direct video files
 * @param {string} props.caption - Optional caption for the video
 * @param {string} props.title - Accessibility title for the video
 * @param {string} props.startTime - Optional start time for YouTube videos (e.g., "2m30s" or "150")
 * @param {boolean} props.autoplay - Whether to autoplay the video (default: false)
 * @param {boolean} props.controls - Whether to show video controls (default: true)
 * @param {string} props.aspectRatio - Aspect ratio ('16:9', '4:3', '1:1') - default: '16:9'
 * @param {string} props.width - Optional custom width
 * @param {string} props.height - Optional custom height
 * @param {number} props.chapter - Chapter number for figure numbering
 * @param {number} props.video - Video number within chapter for numbering
 */
export default function Video({ 
  type = 'youtube',
  videoId,
  caption,
  title,
  startTime,
  autoplay = false,
  controls = true,
  aspectRatio = '16:9',
  width,
  height,
  chapter,
  video
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convert start time to seconds for YouTube
  const parseStartTime = (time) => {
    if (!time) return '';
    
    // If it's already a number, return as is
    if (typeof time === 'number') return time.toString();
    
    // Parse formats like "2m30s", "1h30m", "150" (seconds)
    if (typeof time === 'string') {
      // If it's just numbers, assume seconds
      if (/^\d+$/.test(time)) return time;
      
      let totalSeconds = 0;
      const hours = time.match(/(\d+)h/);
      const minutes = time.match(/(\d+)m/);
      const seconds = time.match(/(\d+)s/);
      
      if (hours) totalSeconds += parseInt(hours[1]) * 3600;
      if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
      if (seconds) totalSeconds += parseInt(seconds[1]);
      
      return totalSeconds > 0 ? totalSeconds.toString() : '';
    }
    
    return '';
  };

  // Generate video URLs based on type
  const getVideoUrl = () => {
    const startSeconds = parseStartTime(startTime);
    
    switch (type.toLowerCase()) {
      case 'youtube':
        let youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
        const params = new URLSearchParams();
        
        if (startSeconds) params.append('start', startSeconds);
        if (autoplay) params.append('autoplay', '1');
        if (!controls) params.append('controls', '0');
        params.append('rel', '0'); // Don't show related videos
        params.append('modestbranding', '1'); // Minimal YouTube branding
        
        const paramString = params.toString();
        return paramString ? `${youtubeUrl}?${paramString}` : youtubeUrl;
        
      case 'vimeo':
        let vimeoUrl = `https://player.vimeo.com/video/${videoId}`;
        const vimeoParams = new URLSearchParams();
        
        if (autoplay) vimeoParams.append('autoplay', '1');
        if (!controls) vimeoParams.append('controls', '0');
        vimeoParams.append('title', '0'); // Hide title
        vimeoParams.append('byline', '0'); // Hide byline
        vimeoParams.append('portrait', '0'); // Hide portrait
        
        const vimeoParamString = vimeoParams.toString();
        return vimeoParamString ? `${vimeoUrl}?${vimeoParamString}` : vimeoUrl;
        
      case 'mp4':
      case 'webm':
      case 'video':
        // For direct video files, videoId should be the full URL
        return videoId;
        
      default:
        console.warn(`Unsupported video type: ${type}`);
        return videoId;
    }
  };

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '4:3':
        return styles.aspectRatio43;
      case '1:1':
        return styles.aspectRatio11;
      case '21:9':
        return styles.aspectRatio219;
      case '16:9':
      default:
        return styles.aspectRatio169;
    }
  };

  // Generate video label for numbering
  const getVideoLabel = () => {
    if (chapter && video) {
      return `Video ${chapter}.${video}`;
    } else if (video) {
      return `Video ${video}`;
    }
    return '';
  };

  // Generate full caption with video numbering
  const getFullCaption = () => {
    const videoLabel = getVideoLabel();
    
    if (caption) {
      // Check if caption already starts with video numbering
      if (caption.match(/^Video \d+(\.\d+)?:/)) {
        return caption;
      } else if (videoLabel) {
        return `${videoLabel}: ${caption}`;
      } else {
        return caption;
      }
    } else if (videoLabel) {
      return videoLabel;
    }
    
    return '';
  };

  const fullCaption = getFullCaption();
  const videoUrl = getVideoUrl();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Process markdown links in caption
  const processMarkdownLinks = (text) => {
    if (!text) return '';
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.captionLink + '">$1</a>'
    );
  };

  // Custom video element for direct video files
  const renderDirectVideo = () => (
    <video
      className={styles.videoElement}
      controls={controls}
      autoPlay={autoplay}
      onLoadedData={handleLoad}
      onError={handleError}
      title={title || fullCaption || `${type} video`}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        display: isLoading ? 'none' : 'block'
      }}
    >
      <source src={videoUrl} type={`video/${type}`} />
      <p>
        Your browser doesn't support video playback. 
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          Download the video file
        </a>
      </p>
    </video>
  );

  // Embedded iframe for YouTube/Vimeo
  const renderEmbeddedVideo = () => (
    <iframe
      className={styles.videoIframe}
      src={videoUrl}
      title={title || fullCaption || `${type} video`}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onLoad={handleLoad}
      onError={handleError}
      style={{ 
        width: width || '100%', 
        height: height || '100%',
        opacity: isLoading ? 0 : 1
      }}
    />
  );

  const isDirectVideo = ['mp4', 'webm', 'video'].includes(type.toLowerCase());

  return (
    <figure className={styles.videoFigure}>
      <div 
        className={`${styles.videoContainer} ${getAspectRatioClass()}`}
        style={{ 
          width: width || 'auto',
          maxWidth: '100%'
        }}
      >
        {/* Loading indicator */}
        {isLoading && !hasError && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Loading video...</p>
          </div>
        )}
        
        {/* Error state */}
        {hasError && (
          <div className={styles.errorContainer}>
            <svg 
              className={styles.errorIcon} 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h4>Failed to load video</h4>
            <p>Video type: {type}</p>
            <p>Video ID/URL: {videoId}</p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.fallbackLink}
            >
              Try opening video directly
            </a>
          </div>
        )}
        
        {/* Video content */}
        {!hasError && (
          isDirectVideo ? renderDirectVideo() : renderEmbeddedVideo()
        )}
      </div>
      
      {/* Caption */}
      {fullCaption && (
        <figcaption 
          className={styles.videoCaption}
          dangerouslySetInnerHTML={{ __html: processMarkdownLinks(fullCaption) }}
        />
      )}
    </figure>
  );
}
