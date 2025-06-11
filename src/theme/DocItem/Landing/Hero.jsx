// src/theme/DocItem/Landing/Hero.jsx
import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.heroContainer}>
      {/* Left side - Title and Description */}
      <div className={styles.contentSection}>
        <h1 className={styles.title}>AI SAFETY ATLAS</h1>
        <p className={styles.description}>
          Distilling safety research into a complete learning ecosystem: textbook, courses, guides, videos, and more.
        </p>
      </div>

      {/* Right side - Logo */}
      <div className={styles.logoSection}>
        <img 
          src="/img/logo_samples/01-test.png" 
          alt="AI Safety Atlas Logo" 
          className={styles.logoImage}
        />
      </div>
    </div>
  );
}
