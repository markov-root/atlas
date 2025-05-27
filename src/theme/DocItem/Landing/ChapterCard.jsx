// src/theme/DocItem/Landing/ChapterCard.jsx
import React from 'react';
import styles from './ChapterCard.module.css';

export default function ChapterCard({ chapter, isFlipped, onToggle, textureFile }) {
  const handleResourceClick = (e, url, resourceType) => {
    e.stopPropagation();
    if (url) {
      // Internal links (chapters) open in same tab, external links open in new tab
      if (resourceType === 'chapter') {
        window.location.href = url; // Same tab for chapter links
      } else {
        window.open(url, '_blank'); // New tab for external links
      }
    }
  };

  // All possible resources - shown on every card, activated based on availability
  const allResources = [
    { 
      key: 'chapter', 
      icon: '/img/icons/read.svg', 
      label: 'Read Chapter',
      tooltip: 'Read Chapter Online'
    },
    { 
      key: 'video', 
      icon: '/img/icons/video.svg', 
      label: 'Watch Video',
      tooltip: 'Watch Video Explanation'
    },
    { 
      key: 'audio', 
      icon: '/img/icons/audio.svg', 
      label: 'Listen Audio',
      tooltip: 'Listen to Audio Version'
    },
    { 
      key: 'pdf', 
      icon: '/img/icons/pdf.svg', 
      label: 'Download PDF',
      tooltip: 'Download PDF Version'
    },
    { 
      key: 'facilitation', 
      icon: '/img/icons/teach.svg', 
      label: 'Teaching Guide',
      tooltip: 'Teaching Guide & Resources'
    }
  ];

  return (
    <div 
      onClick={onToggle}
      className={styles.cardContainer}
    >
      {/* Flip Container */}
      <div className={`${styles.flipContainer} ${isFlipped ? styles.flipped : ''}`}>
        
        {/* FRONT SIDE - Book Cover */}
        <div className={styles.frontSide} style={textureFile ? {
          backgroundImage: `url(/img/textures/${textureFile})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {}}>
          
          {/* Texture overlay if texture is provided */}
          {textureFile && <div className={styles.textureOverlay} />}
          
          {/* Main Content */}
          <div className={styles.frontContent}>
            
            {/* Title Row - Number and Title on same line */}
            <div className={styles.titleRow}>
              <div className={styles.chapterNumber}>
                {chapter.number.toString().padStart(2, '0')}
              </div>

              <h3 className={styles.chapterTitle}>
                {chapter.title}
              </h3>
            </div>

            {/* Resource Buttons - Vertical Stack with Text */}
            <div className={styles.resourceButtons}>
              {allResources.map((resource) => {
                const isAvailable = !!chapter.resources[resource.key];
                
                return (
                  <div
                    key={resource.key}
                    onClick={(e) => isAvailable ? handleResourceClick(e, chapter.resources[resource.key], resource.key) : e.stopPropagation()}
                    className={`${styles.resourceButton} ${isAvailable ? styles.available : styles.unavailable}`}
                  >
                    <img 
                      src={resource.icon} 
                      alt={resource.label}
                      className={styles.resourceIcon}
                    />
                    <span className={styles.resourceLabel}>
                      {resource.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Flip Hint */}
            <div className={styles.flipHint}>
              View Summary →
            </div>
          </div>
        </div>

        {/* BACK SIDE - Book Back Cover */}
        <div className={styles.backSide}>
          <div className={styles.backContent}>

            {/* Description - Full space */}
            <div className={styles.descriptionContainer}>
              <p className={styles.description}>
                {chapter.description}
              </p>
            </div>

            {/* Bottom action */}
            <div className={styles.bottomAction}>
              <div
                onClick={(e) => handleResourceClick(e, chapter.resources.chapter, 'chapter')}
                className={styles.startReading}
              >
                Start Reading Chapter {chapter.number}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
