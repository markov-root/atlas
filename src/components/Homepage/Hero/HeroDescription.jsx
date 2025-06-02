// src/components/Homepage/Hero/HeroDescription.jsx
import React from 'react';
import styles from './HeroDescription.module.css';

export default function HeroDescription() {
  return (
    <div className={styles.descriptionArea}>
      <p className={styles.description}>
        The central repository of AI safety knowledge. Distilling safety research into a complete learning ecosystem: textbook, courses, guides, videos, and more.
      </p>
    </div>
  );
}
