// src/components/chapters/Video.jsx
import React, { useState } from 'react';
import { useLocation } from '@docusaurus/router';
import Caption from './Caption';
import styles from './Video.module.css';

/**
 * Enhanced Video component with full-width design and custom player option
 * @param {Object} props
 * @param {string} props.type - Type of video ('youtube', 'vimeo', 'mp4', 'webm', 'custom')
 * @param {string} props.videoId - Video ID for YouTube/Vimeo, or full URL for direct video files
 * @param {string} props.caption - Optional caption for the video
 * @param {string} props.title - Accessibility title for the video
 * @param {string} props.startTime - Optional start time for YouTube videos (e.g., "2m30s" or "150")
 * @param {boolean} props.autoplay - Whether to autoplay the video (default: false)
 * @param {boolean} props.controls - Whether to show video controls (default: true)
 * @param {string} props.aspectRatio - Aspect ratio ('16:9', '4:3', '1:1', '21:9') - default: '16:9'
 * @param {string} props.width - Optional custom width
 * @param {string} props.height - Optional custom height
 * @param {number} props.chapter - Chapter number for figure numbering
 * @param {number} props.number - Video number within chapter for numbering
 * @param {string} props.label - Optional label (e.g., "1.1") for numbering
 * @param {boolean} props.useCustomPlayer - Use custom Atlas player instead of embedded (default: false)
 * @param {boolean} props.fullWidth - Span full content width (default: true)
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
  number,
  label,
  useCustomPlayer = false,
  fullWidth = true
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();

  // Auto-extract chapter number from URL if not provided
  const getChapterFromPath = () => {
    const match = location.pathname.match(/\/chapters\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const chapterNumber = chapter || getChapterFromPath();

  // Convert start time to seconds for YouTube
  const parseStartTime = (time) => {
    if (!time) return '';
    
    if (typeof time === 'number') return time.toString();
    
    if (typeof time === 'string') {
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
        if (!controls && !useCustomPlayer) params.append('controls', '0');
        
        // Enhanced YouTube embed parameters for better experience
        params.append('rel', '0'); // Don't show related videos
        params.append('modestbranding', '1'); // Minimal YouTube branding
        params.append('fs', '1'); // Allow fullscreen
        params.append('cc_load_policy', '0'); // Don't force captions
        params.append('iv_load_policy', '3'); // Hide annotations
        
        if (useCustomPlayer) {
          // For custom player, we might want different params
          params.append('enablejsapi', '1'); // Enable JS API
          params.append('origin', window.location.origin);
        }
        
        const paramString = params.toString();
        return paramString ? `${youtubeUrl}?${paramString}` : youtubeUrl;
        
      case 'vimeo':
        let vimeoUrl = `https://player.vimeo.com/video/${videoId}`;
        const vimeoParams = new URLSearchParams();
        
        if (autoplay) vimeoParams.append('autoplay', '1');
        if (!controls && !useCustomPlayer) vimeoParams.append('controls', '0');
        vimeoParams.append('title', '0');
        vimeoParams.append('byline', '0');
        vimeoParams.append('portrait', '0');
        vimeoParams.append('dnt', '1'); // Do not track
        
        const vimeoParamString = vimeoParams.toString();
        return vimeoParamString ? `${vimeoUrl}?${vimeoParamString}` : vimeoUrl;
        
      case 'mp4':
      case 'webm':
      case 'video':
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

  const videoUrl = getVideoUrl();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Custom Atlas Player Component (placeholder for future implementation)
  const CustomVideoPlayer = ({ src, onLoad, onError }) => {
    return (
      <div className={styles.customPlayer}>
        <div className={styles.customPlayerPlaceholder}>
          <h3>Atlas Custom Player</h3>
          <p>Coming Soon</p>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.fallbackLink}
          >
            Watch on {type.charAt(0).toUpperCase() + type.slice(1)}
          </a>
        </div>
      </div>
    );
  };

  // Direct video element for MP4/WebM files
  const renderDirectVideo = () => (
    <video
      className={styles.videoElement}
      controls={controls}
      autoPlay={autoplay}
      onLoadedData={handleLoad}
      onError={handleError}
      title={title || caption || `${type} video`}
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
  const renderEmbeddedVideo = () => {
    if (useCustomPlayer) {
      return <CustomVideoPlayer src={videoUrl} onLoad={handleLoad} onError={handleError} />;
    }

    return (
      <iframe
        className={styles.videoIframe}
        src={videoUrl}
        title={title || caption || `${type} video`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
  };

  const isDirectVideo = ['mp4', 'webm', 'video'].includes(type.toLowerCase());

  return (
    <figure className={`${styles.videoFigure} ${fullWidth ? styles.fullWidth : ''}`}>
      <div 
        className={`${styles.videoContainer} ${getAspectRatioClass()}`}
        style={{ 
          width: fullWidth ? '100%' : (width || 'auto'),
          maxWidth: fullWidth ? 'none' : '800px'
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
      
      {/* Caption with automatic numbering */}
      <Caption 
        caption={caption}
        mediaType="video"
        chapter={chapterNumber}
        number={number}
        label={label}
      />
    </figure>
  );
}
