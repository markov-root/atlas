// src/theme/DocItem/Landing/Info/Advisors.jsx
import React from 'react';
import styles from './Advisors.module.css';

export default function Advisors() {
  const advisors = [
    {
      name: "Vincent Corruble",
      description: "Professor at Sorbonne University and research fellow at CHAI."
    },
    {
      name: "Fabien Roger",
      description: "Previously worked at Redwood Research, now at Anthropic."
    }
  ];

  return (
    <div className={styles.advisorsContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.iconContainer}>
          <img src="/img/icons/advisor.svg" alt="" className={styles.icon} />
        </div>
        <h2 className={styles.sectionTitle}>Advisors</h2>
      </div>
      
      <div className={styles.advisorsList}>
        {advisors.map((advisor, index) => (
          <div key={index} className={styles.advisorItem}>
            <h3 className={styles.advisorName}>{advisor.name}</h3>
            <p className={styles.advisorDescription}>{advisor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
