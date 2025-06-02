// src/components/Homepage/Hero/HeroGraph.jsx
import React from 'react';
import styles from './HeroGraph.module.css';

export default function HeroGraph() {
  return (
    <div className={styles.graphArea}>
      <img 
        src="/img/logo/logo.svg" 
        alt="AI Safety Atlas Logo" 
        className={styles.logoImage}
      />
    </div>
  );
}
