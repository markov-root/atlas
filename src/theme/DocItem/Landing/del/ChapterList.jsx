// src/theme/DocItem/Landing/ChapterList.jsx - Minimal chapters list section
import React from 'react';
import ChapterList from './ChapterList';
import chaptersData from '../../../data/chapters.json';
import styles from './ChapterList.module.css';

export default function ChapterList() {
  return (
    <section className={styles.chaptersSection}>
      <div className={styles.chaptersContainer}>
        
        <h2 className={styles.sectionTitle}>Chapters</h2>

        {/* Chapter Streams */}
        {chaptersData.streams.map(stream => (
          <div key={stream.id} className={styles.streamSection}>
            
            <h3 className={styles.streamTitle}>{stream.title}</h3>
            <p className={styles.streamDescription}>{stream.description}</p>

            <ChapterList chapters={stream.chapters} />
          </div>
        ))}
      </div>
    </section>
  );
}
