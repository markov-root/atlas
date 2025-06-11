// src/theme/DocItem/Landing/ChapterList/Header.jsx
import React from 'react';
import styles from './Header.module.css';

const resources = [
  { key: 'chapter', label: 'Read' },
  { key: 'video', label: 'Lecture' },
  { key: 'pdf', label: 'PDF' },
  { key: 'audio', label: 'Audio' },
  { key: 'facilitation', label: 'Facilitate' }
];

export default function Header() {
  return (
    <div className={styles.header}>
      <div className={styles.expandCol}></div>
      <div className={styles.numberCol}>#</div>
      <div className={styles.titleCol}>Chapter</div>
      {resources.map(resource => (
        <div key={resource.key} className={styles.resourceCol}>
          {resource.label}
        </div>
      ))}
    </div>
  );
}
