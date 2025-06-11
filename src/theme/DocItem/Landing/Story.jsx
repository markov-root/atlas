// src/theme/DocItem/Landing/Story.jsx
import React from 'react';
import Description from './Story/Description';
import Quotes from './Story/Quotes';
import Motivation from './Story/Motivation';
import styles from './Story.module.css';

export default function Story() {
  return (
    <div className={styles.storyContainer}>
      <div className={styles.storyContent}>
        
        {/* Primary Section: Bold claim and solution + Expert Quotes */}
        <div className={styles.primarySection}>
          <Description />
          <Quotes />
        </div>

        {/* Secondary Section: Who this is for */}
        <Motivation />
        
      </div>
    </div>
  );
}
