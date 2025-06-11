// src/theme/DocItem/Landing/ChapterList/Expandable.jsx
import React from 'react';
import AudioPlayer from './AudioPlayer';
import { getAudioUrl } from '../../../../utils/audioUtils';
import styles from './Expandable.module.css';

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

export default function Expandable({
  chapter,
  isExpanded,
  isAudioExpanded,
  isVideoExpanded,
  verifiedAudioFiles,
  onToggleAudio,
  onToggleVideo
}) {
  const videoId = getYouTubeVideoId(chapter.resources.video);

  return (
    <>
      {/* Description */}
      {isExpanded && chapter.description && (
        <div className={styles.descriptionRow}>
          <div className={styles.description}>
            {chapter.description}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {isAudioExpanded && Object.keys(verifiedAudioFiles).length > 0 && (
        <div className={styles.mediaRow}>
          <div className={styles.mediaHeader}>
            <h4 className={styles.mediaTitle}>
              <img src="/img/icons/audio.svg" alt="" className={styles.mediaTitleIcon} />
              Audio Content
            </h4>
            <button 
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAudio();
              }}
              aria-label="Close audio player"
            >
              ×
            </button>
          </div>
          <div className={styles.mediaContent}>
            {Object.entries(verifiedAudioFiles).map(([trackType, filename]) => {
              const audioUrl = getAudioUrl(chapter.number, filename);
              const trackDisplayName = trackType === 'podcast' ? 'Podcast' : 
                                       trackType === 'transcript' ? 'Reading' : 
                                       trackType === 'discussion' ? 'Discussion' : 'Audio';
              
              return (
                <div key={trackType} className={styles.audioTrack}>
                  {Object.keys(verifiedAudioFiles).length > 1 && (
                    <div className={styles.trackLabel}>{trackDisplayName}</div>
                  )}
                  <AudioPlayer 
                    audioUrl={audioUrl}
                    trackType={trackDisplayName}
                    chapterNumber={chapter.number}
                    chapterTitle={chapter.title}
                  />
                </div>
              );
            })}
            <div className={styles.mediaDescription}>
              Listen to the audio content for Chapter {chapter.number}: {chapter.title}
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {isVideoExpanded && chapter.resources.video && videoId && (
        <div className={styles.mediaRow}>
          <div className={styles.mediaHeader}>
            <h4 className={styles.mediaTitle}>
              <img src="/img/icons/video.svg" alt="" className={styles.mediaTitleIcon} />
              Video Lecture
            </h4>
            <button 
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVideo();
              }}
              aria-label="Close video player"
            >
              ×
            </button>
          </div>
          <div className={styles.mediaContent}>
            <div className={styles.videoWrapper}>
              <iframe
                className={styles.videoPlayer}
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={`${chapter.title} - Video Lecture`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.mediaDescription}>
              Watch the video lecture for Chapter {chapter.number}: {chapter.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
