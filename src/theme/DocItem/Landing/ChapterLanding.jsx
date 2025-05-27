// src/theme/DocItem/Landing/ChapterLanding.jsx
import React, { useState, useEffect } from 'react';
import ChapterCard from './ChapterCard';
import ProjectInfo from './ProjectInfo';
import QuotesSection from './QuotesSection';
import chaptersData from '../../../data/chapters.json';
import styles from './ChapterLanding.module.css';

export default function ChapterLanding() {
  const [flippedChapter, setFlippedChapter] = useState(null);
  const [mainWidth, setMainWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // COMPONENT TOGGLES - Turn sections on/off here
  const SHOW_PROJECT_INFO = false;
  const SHOW_QUOTES = false;

  // Measure bounds - EXACT same technique as ChapterHeaderRenderer
  useEffect(() => {
    const updateMainWidth = () => {
      const mainContainer = document.querySelector('.docMainContainer_TBSr');
      const width = mainContainer?.getBoundingClientRect().width || 0;
      
      if (width > 0) {
        setMainWidth(width);
        setIsReady(true);
      }
    };

    // Try immediately
    updateMainWidth();
    
    // If not ready, try a few more times with short delays
    if (!isReady) {
      const attempts = [50, 100, 200];
      attempts.forEach(delay => {
        setTimeout(updateMainWidth, delay);
      });
    }
    
    // Also listen for resize events
    window.addEventListener('resize', updateMainWidth);
    return () => window.removeEventListener('resize', updateMainWidth);
  }, [isReady]);

  const handleChapterToggle = (chapter) => {
    if (flippedChapter?.id === chapter.id) {
      setFlippedChapter(null);
    } else {
      setFlippedChapter(chapter);
    }
  };

  // Landing bounds container - EXACT same technique as ChapterHeaderRenderer
  const landingStyle = {
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${mainWidth}px`,
    margin: '0'
  };

  // Render nothing while measuring - no visible loading state
  if (!isReady || mainWidth <= 0) {
    return null;
  }

  return (
    <div style={landingStyle}>
      <div className={styles.landingContainer}>
        
        {/* Project Info Section */}
        {SHOW_PROJECT_INFO && <ProjectInfo />}
        
        {/* Quotes Section */}
        {SHOW_QUOTES && <QuotesSection />}

        {/* Chapter Streams */}
        <div className={styles.streamsContainer}>
          {chaptersData.streams.map(stream => (
            <div key={stream.id} className={styles.streamSection}>
              
              {/* Stream Header */}
              <div className={styles.streamHeader}>
                <h2 className={styles.streamTitle}>
                  {stream.title}
                </h2>
                <p className={styles.streamDescription}>
                  {stream.description}
                </p>
              </div>

              {/* Chapter Cards Grid */}
              <div className={styles.chaptersGrid}>
                {stream.chapters.map(chapter => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    isFlipped={flippedChapter?.id === chapter.id}
                    onToggle={() => handleChapterToggle(chapter)}
                    textureFile={chapter.texture}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
