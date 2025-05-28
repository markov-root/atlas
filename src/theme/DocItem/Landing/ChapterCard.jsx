// src/theme/DocItem/Landing/ChapterCard.jsx - Redesigned to match research card style
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SmallTooltip } from '../../../components/UI/Tooltip';
import styles from './ChapterCard.module.css';

export default function ChapterCard({ chapter, textureFile }) {
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

  const handleCardClick = () => {
    if (chapter.resources.chapter) {
      window.location.href = chapter.resources.chapter;
    }
  };

  // Resources excluding the redundant "chapter/read" option
  const resourcesWithoutRead = [
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
    <article 
      className={styles.card} 
      onClick={handleCardClick}
      style={textureFile ? {
        backgroundImage: `url(/img/textures/${textureFile})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <div className={styles.cardContent}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.chapterNumber}>
            {chapter.number.toString().padStart(2, '0')}
          </div>
          <h3 className={styles.title}>{chapter.title}</h3>
        </div>

        {/* Resource Icons with Labels (excluding read) */}
        <div className={styles.resourceSection}>
          <div className={styles.resourceIcons}>
            {resourcesWithoutRead.map((resource) => {
              const isAvailable = !!chapter.resources[resource.key];
              
              return (
                <SmallTooltip key={resource.key} content={isAvailable ? resource.tooltip : `${resource.label} - Coming soon`}>
                  <div 
                    className={`${styles.resourceIcon} ${isAvailable ? styles.iconAvailable : styles.iconUnavailable}`}
                    onClick={isAvailable ? (e) => handleResourceClick(e, chapter.resources[resource.key], resource.key) : undefined}
                  >
                    <img 
                      src={resource.icon} 
                      alt={resource.label}
                      className={styles.iconImage}
                    />
                    <span className={styles.iconLabel}>{resource.label}</span>
                  </div>
                </SmallTooltip>
              );
            })}
          </div>
        </div>

        {/* Click indicator */}
        <div className={styles.clickIndicator}>
          <span>Start Reading Online</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </article>
  );
}
