// src/theme/DocItem/Landing/Story/Motivation.jsx
import React from 'react';
import styles from './Motivation.module.css';

export default function Motivation() {
  return (
    <div className={styles.secondarySection}>
      <div className={styles.questionContent}>
        <div className={styles.questionSide}>
          <h3 className={styles.question}>
            Stop piecing together AI safety from scattered sources.
          </h3>
        </div>
        
        <div className={styles.answerSide}>
          <p className={styles.answerText}>
            Whether you're in policy, engineering, business, or academia—the Atlas gives you 
            the complete picture. We've structured the most important knowledge in the field 
            so you can build genuine understanding instead of collecting random facts from 
            scattered sources.
          </p>
        </div>
      </div>
    </div>
  );
}
