// src/components/Homepage/What.jsx
import React from 'react';
import styles from './What.module.css';

export default function WhatIsAtlas() {
  return (
    <section className={styles.atlasSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>What is the Atlas project?</h2>
        <p className={styles.sectionDescription}>
          We transform scattered AI Safety research into clear, systematic knowledge. 
          Each explanation saves researchers hours previously spent piecing together understanding.
        </p>
      </div>
    </section>
  );
}
