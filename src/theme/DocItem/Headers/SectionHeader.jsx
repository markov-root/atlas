// src/theme/DocItem/Headers/SectionHeader.jsx
import React, { useState, useEffect } from 'react';
import styles from './SectionHeader.module.css';

/**
 * Section Header Component - Simplified version of ChapterHeader
 * Features: Texture background, section numbering, minimal metadata
 */
export default function SectionHeader({ frontMatter, title, chapterNumber, sectionNumber, boundWidth, metadata }) {
  const [isVisible, setIsVisible] = useState(false);

  // Debug logging to see what frontmatter we're getting
  console.log('🔍 SectionHeader frontMatter debug:', {
    frontMatter,
    reading_time_core: frontMatter?.reading_time_core,
    reading_time_optional: frontMatter?.reading_time_optional,
    hasReadingTime: !!(frontMatter?.reading_time_core || frontMatter?.reading_time_optional)
  });

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate fewer, subtler particles for sections
  const generateParticles = () => {
    const count = 5; // Fewer than chapter header
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 1.2,
      duration: 10 + Math.random() * 4
    }));
  };

  const particles = generateParticles();

  return (
    <header className={`${styles.sectionContainer} ${isVisible ? styles.visible : ''}`}>
      {/* Texture background with subtle overlay */}
      <div className={styles.backgroundLayers}>
        <div className={styles.textureOverlay} />
        
        {/* Subtle floating particles */}
        <div className={styles.particleLayer}>
          {particles.map(particle => (
            <div
              key={particle.id}
              className={styles.particle}
              style={{
                '--size': `${particle.size}px`,
                '--x': `${particle.x}%`,
                '--y': `${particle.y}%`,
                '--delay': `${particle.delay}s`,
                '--duration': `${particle.duration}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={styles.sectionContent}>
        <div className={styles.mainLayout}>
          
          {/* LEFT SIDE - Core content */}
          <div className={styles.leftSection}>
            {/* Section number + title */}
            <div className={styles.titleSection}>
              <div className={styles.titleRow}>
                <span className={styles.sectionNumber}>
                  {chapterNumber}.{sectionNumber}
                </span>
                <h1 className={styles.sectionTitle}>{title}</h1>
              </div>
            </div>
            
            {/* Description */}
            {frontMatter.section_description && (
              <p className={styles.sectionDescription}>
                {frontMatter.section_description}
              </p>
            )}
          </div>
          
          {/* RIGHT SIDE - Breadcrumbs + metadata */}
          <div className={styles.rightSection}>
            {/* Breadcrumbs at top of right side - same as chapter header */}
            <nav className={styles.sectionNavigation}>
              <a href="/" className={styles.breadcrumbLink} title="AI Safety Atlas Home">
                <svg className={styles.breadcrumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9,22 9,12 15,12 15,22"></polyline>
                </svg>
              </a>
              <span className={styles.breadcrumbSeparator}>›</span>
              <a href="/chapters/" className={styles.breadcrumbLink} title="All Chapters">
                <svg className={styles.breadcrumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </a>
              <span className={styles.breadcrumbSeparator}>›</span>
              <a href={`/chapters/${String(chapterNumber).padStart(2, '0')}/`} className={styles.breadcrumbLink}>
                Chapter {chapterNumber}
              </a>
              <span className={styles.breadcrumbSeparator}>›</span>
              <span className={styles.breadcrumbCurrent}>{title}</span>
            </nav>

            {/* Metadata section */}
            <div className={styles.metadataSection}>
              {/* Reading time breakdown - same format as chapter header */}
              {(frontMatter.reading_time_core || frontMatter.reading_time_optional) && (
                <div className={styles.metaCard}>
                  <div className={styles.metaIcon}>
                    <img src="/img/icons/reading-time.svg" alt="" className={styles.iconImage} />
                  </div>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>Reading Time</span>
                    <div className={styles.readingBreakdown}>
                      {frontMatter.reading_time_core && (
                        <span className={styles.timeSegment}>
                          <span className={styles.timeValue}>{frontMatter.reading_time_core}</span>
                          <span className={styles.timeLabel}>core</span>
                        </span>
                      )}
                      {frontMatter.reading_time_optional && (
                        <span className={styles.timeSegment}>
                          <span className={styles.timeValue}>{frontMatter.reading_time_optional}</span>
                          <span className={styles.timeLabel}>optional</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}
