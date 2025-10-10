// src/theme/DocItem/Landing/index.jsx
import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import Tagline from './Tagline'; // NEW - extracted tagline component
import ImpactSnapshot from './ImpactSnapshot'; // Updated - just logos now
import ChapterList from './List';
import Testimonials from './Testimonials'; // Moved up from bottom
import Story from './Story'; // Moved up from bottom
import Info from './Info';
import chaptersData from '../../../data/chapters.json';
import styles from './index.module.css';

function LoadingSkeleton() {
  return (
    <div className={styles.landingContainer}>
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--atlas-background, #ffffff)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          padding: '2rem',
          opacity: 0.3
        }}>
          <div style={{
            height: '300px',
            background: 'var(--atlas-gray-200, #e9ecef)',
            borderRadius: '8px',
            marginBottom: '2rem',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }} />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '200px',
                background: 'var(--atlas-gray-200, #e9ecef)',
                borderRadius: '8px',
                animation: `pulse 1.5s ease-in-out infinite alternate ${i * 0.2}s`
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChapterLanding() {
  const [mainWidth, setMainWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

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

  const landingStyle = {
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${mainWidth}px`,
    margin: '0'
  };

  if (!isReady || mainWidth <= 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={landingStyle}>
      <div className={styles.landingContainer}>
        
        {/* Hero Section */}
        <Hero />
        
        {/* Tagline - RIGHT BEFORE CHAPTERS */}
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
        
        
        {/* Testimonials - MOVED UP HERE */}
        <Testimonials />
        
        {/* Project Information Section - NOW LAST BEFORE FOOTER */}
        <Info />
        
      </div>
    </div>
  );
}
