// src/theme/DocItem/Landing/ProjectInfo.jsx - Organized into separate components
import React from 'react';
import AuthorsSection from './AuthorsSection';
import AdvisorsSection from './AdvisorsSection';
import SponsorsSection from './SponsorsSection';
import CitationSection from './CitationSection';
import AcknowledgementsSection from './AcknowledgementsSection';
import styles from './ProjectInfo.module.css';

export default function ProjectInfo() {
  return (
    <div className={styles.projectInfoContainer}>
      <div className={styles.projectContent}>
        
        {/* Main Title */}
        <h1 className={styles.projectTitle}>Project Information</h1>
        
        {/* Two-column grid for better organization */}
        <div className={styles.sectionsGrid}>
          
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <AuthorsSection />
            <SponsorsSection />
            <AcknowledgementsSection />
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
