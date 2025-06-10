// src/components/chapters/Video/InlineVideoPlayer.jsx - New component for inline video playback
import React from 'react';
import styles from './InlineVideoPlayer.module.css';

const InlineVideoPlayer = ({ 
  videoUrl,
  title,
  onClose
}) => {
  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return (
      <div className={styles.videoError}>
        <p>Unable to load video. Invalid YouTube URL.</p>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className={styles.inlineVideoPlayer}>
      {/* Minimal top controls - just close button */}
      <div className={styles.inlineControls}>
        <button className={styles.closeButton} onClick={onClose} title="Close video player">
          ×
        </button>
      </div>

      {/* Video content - no wrapper */}
      <div className={styles.videoWrapper}>
        <iframe
          className={styles.videoPlayer}
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
          title={title || "Video Lecture"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default InlineVideoPlayer;
