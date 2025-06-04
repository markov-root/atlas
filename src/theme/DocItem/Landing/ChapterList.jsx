// src/theme/DocItem/Landing/ChapterList.jsx - Clean implementation
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SmallTooltip } from '../../../components/UI/Tooltip';
import styles from './ChapterList.module.css';

export default function ChapterList({ chapters }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const updateScreenSize = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    if (typeof window !== 'undefined') {
      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      return () => window.removeEventListener('resize', updateScreenSize);
    }
  }, []);

  // Toggle chapter expansion
  const toggleExpanded = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  // Handle resource clicks
  const handleResourceClick = (e, url, resourceType) => {
    e.stopPropagation();
    if (url) {
      if (resourceType === 'chapter') {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    }
  };

  // Handle title clicks (go to chapter)
  const handleTitleClick = (e, chapterUrl) => {
    e.stopPropagation();
    if (chapterUrl) {
      window.location.href = chapterUrl;
    }
  };

  // Handle row clicks (expand description)
  const handleRowClick = (chapterId, hasDescription) => {
    if (hasDescription) {
      toggleExpanded(chapterId);
    }
  };

  // Resource definitions
  const resources = [
    { key: 'chapter', icon: '/img/icons/book.svg', label: 'Read', tooltip: 'Read Online' },
    { key: 'video', icon: '/img/icons/video.svg', label: 'Video', tooltip: 'Watch Video' },
    { key: 'pdf', icon: '/img/icons/pdf.svg', label: 'PDF', tooltip: 'Download PDF' },
    { key: 'audio', icon: '/img/icons/audio.svg', label: 'Audio', tooltip: 'Listen to Audio' },
    { key: 'facilitation', icon: '/img/icons/teach.svg', label: 'Teach', tooltip: 'Teaching Guide' }
  ];

  return (
    <div className={styles.container}>
      
      {/* Desktop Header */}
      {!isMobile && (
        <div className={styles.header}>
          <div className={styles.expandCol}></div>
          <div className={styles.numberCol}>#</div>
          <div className={styles.titleCol}>Chapter</div>
          {resources.map(resource => (
            <div key={resource.key} className={styles.resourceCol}>
              {resource.label}
            </div>
          ))}
        </div>
      )}

      {/* Chapter Rows */}
      <div className={styles.chapters}>
        {chapters.map(chapter => {
          const isExpanded = expandedChapters.has(chapter.id);
          const hasDescription = !!chapter.description;
          
          return (
            <div 
              key={chapter.id} 
              className={`${styles.chapterGroup} ${isExpanded ? styles.expanded : ''}`}
            >
              
              {/* Main Row */}
              <div 
                className={`${styles.row} ${isMobile ? styles.mobileRow : styles.desktopRow} ${hasDescription ? styles.clickable : ''}`}
                onClick={() => handleRowClick(chapter.id, hasDescription)}
              >
                
                {/* Expand Button (if has description) */}
                {hasDescription && (
                  <button 
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(chapter.id);
                    }}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                
                {/* Chapter Number */}
                <span className={styles.chapterNumber}>
                  {chapter.number.toString().padStart(2, '0')}
                </span>
                
                {/* Chapter Title */}
                <h3 
                  className={styles.chapterTitle}
                  onClick={(e) => handleTitleClick(e, chapter.resources.chapter)}
                >
                  {chapter.title}
                </h3>
                
                {/* Resource Buttons */}
                {isMobile ? (
                  // Mobile: Only Read button
                  <SmallTooltip content={chapter.resources.chapter ? 'Read Online' : 'Read - Coming soon'}>
                    <button
                      className={`${styles.resourceBtn} ${chapter.resources.chapter ? styles.available : styles.unavailable}`}
                      onClick={chapter.resources.chapter ? (e) => handleResourceClick(e, chapter.resources.chapter, 'chapter') : undefined}
                      disabled={!chapter.resources.chapter}
                    >
                      <img src="/img/icons/book.svg" alt="Read" className={styles.resourceIcon} />
                    </button>
                  </SmallTooltip>
                ) : (
                  // Desktop: All resource buttons
                  resources.map(resource => {
                    const isAvailable = !!chapter.resources[resource.key];
                    return (
                      <SmallTooltip 
                        key={resource.key}
                        content={isAvailable ? resource.tooltip : `${resource.label} - Coming soon`}
                      >
                        <button
                          className={`${styles.resourceBtn} ${isAvailable ? styles.available : styles.unavailable}`}
                          onClick={isAvailable ? (e) => handleResourceClick(e, chapter.resources[resource.key], resource.key) : undefined}
                          disabled={!isAvailable}
                        >
                          <img src={resource.icon} alt={resource.label} className={styles.resourceIcon} />
                        </button>
                      </SmallTooltip>
                    );
                  })
                )}
              </div>

              {/* Description (expandable) */}
              {isExpanded && chapter.description && (
                <div className={styles.descriptionRow}>
                  <div className={styles.description}>
                    {chapter.description}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
