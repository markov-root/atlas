// src/theme/DocItem/Landing/ChapterList.jsx - Clean aligned layout without table styling
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SmallTooltip } from '../../../components/UI/Tooltip';
import styles from './ChapterList.module.css';

export default function ChapterList({ chapters }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  const toggleExpanded = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleResourceClick = (url, resourceType) => {
    if (url) {
      if (resourceType === 'chapter') {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const resources = [
    { key: 'chapter', icon: '/img/icons/book.svg', label: 'Read', tooltip: 'Read Online' },
    { key: 'video', icon: '/img/icons/video.svg', label: 'Video', tooltip: 'Watch Video' },
    { key: 'pdf', icon: '/img/icons/pdf.svg', label: 'PDF', tooltip: 'Download PDF' },
    { key: 'audio', icon: '/img/icons/audio.svg', label: 'Audio', tooltip: 'Listen to Audio' },
    { key: 'facilitation', icon: '/img/icons/teach.svg', label: 'Teach', tooltip: 'Teaching Guide' },
    { key: 'arxiv_link', icon: '/img/icons/arxiv.svg', label: 'arXiv', tooltip: 'arXiv Paper' },
    { key: 'alignment_forum_link', icon: '/img/icons/lesswrong.svg', label: 'Forum', tooltip: 'Alignment Forum' }
  ];

  return (
    <div className={styles.listContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.expandHeader}></div>
        <div className={styles.numberHeader}>#</div>
        <div className={styles.titleHeader}>Chapter</div>
        {resources.map(resource => (
          <div key={resource.key} className={styles.resourceHeader}>
            {resource.label}
          </div>
        ))}
      </div>

      {/* Chapter Rows */}
      <div className={styles.chaptersContainer}>
        {chapters.map(chapter => {
          const isExpanded = expandedChapters.has(chapter.id);
          return (
            <div key={chapter.id} className={styles.chapterGroup}>
              <div className={styles.chapterRow}>
                {/* Mobile layout */}
                <div className={styles.mobileTopRow}>
                  <div className={styles.numberCell}>
                    <span className={styles.chapterNumber}>
                      {chapter.number.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className={styles.titleCell}>
                    <div className={styles.titleContent}>
                      <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                      {chapter.subtitle && (
                        <p className={styles.chapterSubtitle}>{chapter.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.expandCell}>
                    {chapter.description && (
                      <button 
                        className={styles.expandButton}
                        onClick={() => toggleExpanded(chapter.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Resources row - will be repositioned on mobile */}
                <div className={styles.mobileResourcesRow}>
                  {resources.map(resource => {
                    const isAvailable = !!chapter.resources[resource.key];
                    return (
                      <div key={resource.key} className={styles.resourceCell}>
                        <SmallTooltip 
                          content={isAvailable ? resource.tooltip : `${resource.label} - Coming soon`}
                        >
                          <button
                            className={`${styles.resourceButton} ${isAvailable ? styles.available : styles.unavailable}`}
                            onClick={isAvailable ? () => handleResourceClick(chapter.resources[resource.key], resource.key) : undefined}
                            disabled={!isAvailable}
                          >
                            <img 
                              src={resource.icon} 
                              alt={resource.label}
                              className={styles.resourceIcon}
                            />
                          </button>
                        </SmallTooltip>
                        <span className={styles.resourceLabel}>{resource.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
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
