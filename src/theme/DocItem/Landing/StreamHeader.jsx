// src/theme/DocItem/Landing/StreamHeader.jsx - Clean stream header without texture/animations
import React from 'react';
import styles from './StreamHeader.module.css';

export default function StreamHeader({ title, description }) {
  return (
    <div className={styles.streamHeaderContainer}>
      <div className={styles.streamContent}>
        <h2 className={styles.streamTitle}>{title}</h2>
        <p className={styles.streamDescription}>{description}</p>
      </div>
    </div>
  );
}
