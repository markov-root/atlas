// src/theme/DocItem/Landing/ChapterLanding.jsx
import React, { useState, useEffect } from 'react';
import ChaptersHero from './ChaptersHero';
import StreamHeader from './StreamHeader';
import ChapterList from './ChapterList';
import ImpactSection from './ImpactSection';
import ProjectInfo from './ProjectInfo';
import chaptersData from '../../../data/chapters.json';
import styles from './ChapterLanding.module.css';

export default function ChapterLanding() {
  const [mainWidth, setMainWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Measure bounds - same technique as your headers
  useEffect(() => {
    const updateMainWidth = () => {
      const mainContainer = document.querySelector('.docMainContainer_TBSr');
      const width = mainContainer?.getBoundingClientRect().width || 0;
      
      if (width > 0) {
        setMainWidth(width);
        setIsReady(true);
      }
    };

    updateMainWidth();
    
    if (!isReady) {
      const attempts = [50, 100, 200];
      attempts.forEach(delay => {
        setTimeout(updateMainWidth, delay);
      });
    }
    
    window.addEventListener('resize', updateMainWidth);
    return () => window.removeEventListener('resize', updateMainWidth);
  }, [isReady]);

  // Landing bounds container
  const landingStyle = {
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${mainWidth}px`,
    margin: '0'
  };

  // Wait for measurements
  if (!isReady || mainWidth <= 0) {
    return null;
  }

  return (
    <div style={landingStyle}>
      <div className={styles.landingContainer}>
        
        {/* Hero Section */}
        <ChaptersHero />
        
        {/* Chapter List Section */}
        <div className={styles.section}>
          {chaptersData.streams.map(stream => (
            <div key={stream.id} className={styles.streamSection}>
              
              {/* Stream Header with Texture */}
              <StreamHeader 
                title={stream.title}
                description={stream.description}
              />

              {/* Chapter List */}
              <ChapterList chapters={stream.chapters} />
            </div>
          ))}
        </div>
        
        {/* Impact Section - Standalone */}
        <ImpactSection />
        
        {/* Project Information Section */}
        <ProjectInfo />
        
      </div>
    </div>
  );
}
