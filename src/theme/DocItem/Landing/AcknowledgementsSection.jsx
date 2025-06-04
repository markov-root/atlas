// src/theme/DocItem/Landing/AcknowledgementsSection.jsx - Simple acknowledgements list
import React from 'react';
import styles from './AcknowledgementsSection.module.css';

export default function AcknowledgementsSection() {
  const acknowledgements = [
    "Jonathan Claybrough",
    "Jérémy Andréoletti", 
    "Evander Hammer",
    "Josh Thorsteinson"
  ];

  return (
    <div className={styles.acknowledgementsContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.iconContainer}>
          <img src="/img/icons/acknowledgement.svg" alt="" className={styles.icon} />
        </div>
        <h2 className={styles.sectionTitle}>Acknowledgements</h2>
      </div>
      
      <div className={styles.acknowledgementsList}>
        {acknowledgements.map((person, index) => (
          <span key={index} className={styles.person}>{person}</span>
        ))}
      </div>
    </div>
  );
}
