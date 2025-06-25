// src/components/Impact/Hero.jsx
import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left side - Title and Description */}
        <div className={styles.contentSection}>
          <h1 className={styles.title}>IMPACT</h1>
          <p className={styles.description}>
            Measurable outcomes from systematic AI safety education and research contributions.
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
    </div>
  );
}
