// src/theme/DocItem/Landing/ChapterList/index.jsx
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Row from './Row';
import { useFileVerification } from './hooks';
import styles from './ChapterList.module.css';

export default function ChapterList({ chapters, streamTitle, streamDescription, streamId }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [expandedAudio, setExpandedAudio] = useState(new Set());
  const [expandedVideo, setExpandedVideo] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Custom hook for file verification
  const { verifiedAudioFiles, verifiedPdfFiles } = useFileVerification(chapters);

  // Responsive detection
  useEffect(() => {
    const updateScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    if (typeof window !== 'undefined') {
      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      return () => window.removeEventListener('resize', updateScreenSize);
    }
  }, []);

  // Toggle functions
  const toggleExpanded = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      setExpandedAudio(new Set());
      setExpandedVideo(new Set());
    }
    setExpandedChapters(newExpanded);
  };

  const toggleAudioExpanded = (chapterId) => {
    const newExpanded = new Set(expandedAudio);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      setExpandedChapters(new Set());
      setExpandedVideo(new Set());
    }
    setExpandedAudio(newExpanded);
  };

  const toggleVideoExpanded = (chapterId) => {
    const newExpanded = new Set(expandedVideo);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      setExpandedChapters(new Set());
      setExpandedAudio(new Set());
    }
    setExpandedVideo(newExpanded);
  };

  return (
    <div className={styles.container} id={streamId}>
      
      {/* Stream Title and Description */}
      {streamTitle && (
        <div className={styles.streamHeader}>
          <h2 className={styles.streamTitle}>
            {streamTitle}
          </h2>
          {streamDescription && (
            <p className={styles.streamDescription}>
              {streamDescription}
            </p>
          )}
        </div>
      )}

      {/* Header - only on desktop */}
      {!isMobile && <Header />}

      {/* Chapter Rows */}
      <div className={styles.chapters}>
        {chapters.map(chapter => {
          const chapterAudioFiles = verifiedAudioFiles.get(chapter.id) || {};
          const chapterPdfData = verifiedPdfFiles.get(chapter.id);
          
          return (
            <Row
              key={chapter.id}
              chapter={chapter}
              isMobile={isMobile}
              isExpanded={expandedChapters.has(chapter.id)}
              isAudioExpanded={expandedAudio.has(chapter.id)}
              isVideoExpanded={expandedVideo.has(chapter.id)}
              verifiedAudioFiles={chapterAudioFiles}
              verifiedPdfData={chapterPdfData}
              onToggleExpanded={() => toggleExpanded(chapter.id)}
              onToggleAudio={() => toggleAudioExpanded(chapter.id)}
              onToggleVideo={() => toggleVideoExpanded(chapter.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
