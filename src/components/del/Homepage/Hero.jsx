// src/components/Homepage/Hero.jsx - Main Hero component with optional texture
import React, { useState, useEffect } from 'react';
import HeroTitle from './Hero/HeroTitle';
import HeroDescription from './Hero/HeroDescription';
import HeroButtons from './Hero/HeroButtons';
import HeroGraph from './Hero/HeroGraph';
import styles from './Hero.module.css';

export default function Hero() {
  const [hasTexture, setHasTexture] = useState(false);

  useEffect(() => {
    // Check if texture image exists
    const img = new Image();
    img.onload = () => setHasTexture(true);
    img.onerror = () => setHasTexture(false);
    img.src = '/img/texture/home.jpg';
  }, []);

  return (
    <div className={`${styles.heroContainer} ${hasTexture ? styles.withTexture : ''}`}>
      {/* Left side - Description + Quick Links */}
      <div className={styles.leftSection}>
        <div className={styles.contentArea}>
          <div className={styles.topGroup}>
            <HeroTitle />
            <HeroDescription />
          </div>
          <HeroButtons />
        </div>
      </div>

      {/* Right side - D3 Network Graph */}
      <div className={styles.rightSection}>
        <HeroGraph />
      </div>
    </div>
  );
}
