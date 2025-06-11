// src/theme/DocItem/Landing/Info.jsx
import React from 'react';
import Authors from './Info/Authors';
import Advisors from './Info/Advisors';
import Citation from './Info/Citation';
import styles from './Info.module.css';

export default function Info() {
  return (
    <div className={styles.projectInfoContainer}>
      <div className={styles.projectContent}>
        
        {/* Two-column grid for better organization */}
        <div className={styles.sectionsGrid}>
          
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <Authors />
          </div>
          
          {/* Right Column */}
          <div className={styles.rightColumn}>
            <Advisors />
            <Citation />
          </div>
          
        </div>
      </div>
    </div>
  );
}
