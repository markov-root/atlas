// src/theme/DocItem/Landing/ProjectInfo.jsx - Organized into separate components
import React from 'react';
import AuthorsSection from './ProjectInfo/AuthorsSection';
import AdvisorsSection from './ProjectInfo/AdvisorsSection';
import CitationSection from './ProjectInfo/CitationSection';
import styles from './ProjectInfo.module.css';

export default function ProjectInfo() {
  return (
    <div className={styles.projectInfoContainer}>
      <div className={styles.projectContent}>
        
        {/* Two-column grid for better organization */}
        <div className={styles.sectionsGrid}>
          
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <AuthorsSection />
          </div>
          
          {/* Right Column */}
          <div className={styles.rightColumn}>
            <AdvisorsSection />
            <CitationSection />
          </div>
          
        </div>
      </div>
    </div>
  );
}
