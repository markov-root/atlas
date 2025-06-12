// src/theme/DocItem/Landing/Info/Acknowledgements.jsx
import React from 'react';
import styles from './Acknowledgements.module.css';

export default function Acknowledgements() {
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
          <img src="/img/icons/acknowledgements.svg" alt="" className={styles.icon} />
        </div>
        <h2 className={styles.sectionTitle}>Acknowledgements</h2>
      </div>
      
      <div className={styles.acknowledgementsContent}>
        <p className={styles.acknowledgementsText}>
          We thank {acknowledgements.slice(0, -1).join(', ')}, and {acknowledgements[acknowledgements.length - 1]} for their valuable feedback and contributions to this project.
        </p>
      </div>
    </div>
  );
}
