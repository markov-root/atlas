// src/theme/DocItem/Landing/Story/Motivation.jsx
import React from 'react';
import styles from './Motivation.module.css';

export default function Motivation() {
  return (
    <div className={styles.secondarySection}>
      <div className={styles.questionContent}>
        <div className={styles.questionSide}>
          <h3 className={styles.question}>
           Textbook, courses, guides, videos, and more.          </h3>
        </div>
        
        <div className={styles.answerSide}>
          <p className={styles.answerText}>
            Whether you're in policy, engineering, business, or academia—the Atlas gives you 
            the complete picture. We've gathered the most important knowledge in the field from hundreds of sources, and structured it
            so that you can build genuine understanding instead of collecting random facts from scattered sources.
          </p>
        </div>
      </div>
    </div>
  );
}
