// src/theme/DocItem/Landing/ChaptersHero.jsx - Simple hero for chapters landing page
import React from 'react';
import styles from './ChaptersHero.module.css';

export default function ChaptersHero() {
  return (
    <div className={styles.heroContainer}>
      {/* Left side - Title and Description */}
      <div className={styles.contentSection}>
        <h1 className={styles.title}>AI SAFETY ATLAS</h1>
        <p className={styles.description}>
          The central repository of AI safety knowledge. Distilling safety research into a complete learning ecosystem: textbook, courses, guides, videos, and more.
        </p>
      </div>

      {/* Right side - Logo */}
      <div className={styles.logoSection}>
        <img 
          src="/img/logo_samples/01.svg" 
          alt="AI Safety Atlas Logo" 
          className={styles.logoImage}
        />
      </div>
    </div>
  );
}
