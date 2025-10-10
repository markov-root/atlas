// src/theme/DocItem/Landing/Tagline.jsx
import React from 'react';
import styles from './Tagline.module.css';

export default function Tagline() {
  return (
    <section className={styles.taglineSection}>
      <div className={styles.taglineContent}>
        <h2 className={styles.taglineTitle}>
          Stop piecing together AI safety from scattered sources.
        </h2>
        <p className={styles.taglineText}>
          Whether you're in policy, engineering, business, or academia—the Atlas gives you 
          the complete picture. We've structured the most important knowledge in the field 
          so you can build genuine understanding instead of collecting random facts from 
          scattered sources.
        </p>
      </div>
    </section>
  );
}
