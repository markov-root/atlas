// src/components/Homepage/Stats.jsx
import React from 'react';
import styles from './Stats.module.css';

const StatCard = ({ number, label, description }) => (
  <div className={styles.statCard}>
    <div className={styles.statNumber}>{number}</div>
    <div className={styles.statLabel}>{label}</div>
    <p className={styles.statDescription}>{description}</p>
  </div>
);

export default function Stats() {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Growing Impact</h2>
        
        <div className={styles.statsGrid}>
          <StatCard 
            number="400+"
            label="Students Annually"
            description=""
          />
          <StatCard 
            number="6"
            label="Major Programs"
            description=""
          />
        </div>
        
        <div className={styles.usageGrid}>
          <div className={styles.usageCard}>
            <h3 className={styles.usageTitle}>AI Safety Groups</h3>
            <p className={styles.usageDescription}>
              ML4Good, AI Safety Collab, and other dedicated AI Safety initiatives have integrated our materials 
              into their core curriculum, with strong repeat adoption across multiple cohorts.
            </p>
          </div>
          
          <div className={styles.usageCard}>
            <h3 className={styles.usageTitle}>Universities</h3>
            <p className={styles.usageDescription}>
              Academic institutions like ENS and UBC are incorporating our materials into formal curricula, 
              teaching AI Safety to computer science and machine learning students.
            </p>
          </div>
          
          <div className={styles.usageCard}>
            <h3 className={styles.usageTitle}>Independent Readers</h3>
            <p className={styles.usageDescription}>
              Study groups and individual researchers use our materials to understand core AI Safety concepts 
              and contribute to the field.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
