// src/theme/DocItem/Landing/Hero.jsx
import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  const handleStartReading = () => {
    const chapterSection = document.querySelector('#textbook-section') || 
                          document.querySelector('#first-stream');
    
    if (chapterSection) {
      chapterSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className={styles.heroContainer}>
      {/* Left side - Logo Text, Description, and CTA */}
      <div className={styles.contentSection}>
        <img 
          src="/img/logo/logo_text.png" 
          alt="AI Safety Atlas" 
          className={styles.logoText}
        />
        
        <p className={styles.description}>
          Distilling safety research into a complete learning ecosystem
        </p>
        
        {/* Minimal Start Reading Button */}
        <button 
          onClick={handleStartReading}
          className={styles.startReadingButton}
          aria-label="Scroll to chapter list"
        >
          <span className={styles.buttonText}>Start Reading</span>
          <svg 
            className={styles.buttonArrow} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Right side - SVG Logo Image */}
      <div className={styles.logoSection}>
        <img 
          src="/img/logo/logo_image.svg" 
          alt="AI Safety Atlas Logo" 
          className={styles.logoImage}
        />
      </div>
    </div>
  );
}
