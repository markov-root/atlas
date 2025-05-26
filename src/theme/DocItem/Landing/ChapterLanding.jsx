// src/theme/DocItem/Landing/ChapterLanding.jsx
import React from 'react';
import Layout from '@theme/Layout';
import styles from './ChapterLanding.module.css';

/**
 * Simple placeholder for the main chapters landing page
 * This will replace the complex BranchingChapterIndex for now
 */
export default function ChapterLanding() {
  return (
    <div className={styles.landingContainer}>
      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle}>AI Safety Atlas</h1>
        <p className={styles.landingDescription}>
          A comprehensive guide to AI safety and alignment research
        </p>
        
        <div className={styles.placeholder}>
          <h2>📚 Chapter Landing Page</h2>
          <p>This is a clean placeholder for the chapters overview.</p>
          <p>Future: Chapter grid, progress tracking, etc.</p>
        </div>
      </div>
    </div>
  );
}
