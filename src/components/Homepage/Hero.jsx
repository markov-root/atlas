// src/components/Homepage/Hero.jsx
import React, { useState, useEffect } from 'react';
import TypingAnimation from './TypingAnimation';
import styles from './Hero.module.css';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTexture, setHasTexture] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Check if texture file exists
    const img = new Image();
    img.onload = () => setHasTexture(true);
    img.onerror = () => setHasTexture(false);
    img.src = '/img/texture.jpg';
  }, []);

  const typingTexts = [
    "researchers hours of scattered reading",
    "new contributors months of confusion", 
    "policy makers weeks of technical catch-up",
    "students countless hours of piecing together understanding"
  ];

  return (
    <div className={`${styles.heroContainer} ${hasTexture ? styles.withTexture : ''}`}>
      {/* Left side - Logo */}
      <div className={styles.logoSection}>
        <div className={`${styles.logoContainer} ${isLoaded ? styles.loaded : ''}`}>
          <img 
            src="/img/logo/logo.svg" 
            alt="AI Safety Atlas Logo" 
            className={styles.logoImage}
          />
        </div>
      </div>

      {/* Right side - Content */}
      <div className={styles.contentSection}>
        <div className={styles.contentWrapper}>
          {/* Main heading */}
          <h1 className={`${styles.mainTitle} ${isLoaded ? styles.loaded : ''}`}>
            AI Safety Atlas
          </h1>

          {/* Subtitle with typing animation */}
          <div className={`${styles.subtitleContainer} ${isLoaded ? styles.loaded : ''}`}>
            <div className={styles.subtitleContent}>
              <span className={styles.subtitleStatic}>Saving </span>
              <TypingAnimation 
                texts={typingTexts}
                className={styles.typingText}
              />
            </div>
          </div>

          {/* Main description */}
          <p className={`${styles.description} ${isLoaded ? styles.loaded : ''}`}>
            Systematic explanations of AI safety concepts that accelerate understanding, 
            reduce research debt, and multiply impact across the entire community.
          </p>
        </div>
      </div>
    </div>
  );
}
