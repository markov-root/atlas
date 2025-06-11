// src/theme/DocItem/Landing/index.jsx
import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import Story from './Story';
import ChapterList from './List';
import Info from './Info';
import Testimonials from './Testimonials';
import chaptersData from '../../../data/chapters.json';
import styles from './index.module.css';

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
        <Hero />
        
        {/* Project Story Section - Why AI Safety matters + What we do */}
        <Story />
        
        {/* Chapter List Section */}
        <div className={styles.section} id="textbook-section">
          {chaptersData.streams.map((stream, index) => (
            <div key={stream.id} className={styles.streamSection}>
              <ChapterList 
                chapters={stream.chapters}
                streamTitle={stream.title}
                streamDescription={stream.description}
                streamId={index === 0 ? 'first-stream' : stream.id}
              />
            </div>
          ))}
        </div>
        
        {/* Project Information Section */}
        <Info />
        
        {/* Testimonials */}
        <Testimonials />
        
      </div>
    </div>
  );
}
