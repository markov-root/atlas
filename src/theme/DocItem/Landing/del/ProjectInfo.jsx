// src/theme/DocItem/Landing/ProjectInfo.jsx
import React from 'react';
import styles from './ProjectInfo.module.css';

export default function ProjectInfo() {
  return (
    <div className={styles.projectInfoSection}>
      <div className={styles.container}>
        
        {/* Main Title */}
        <h1 className={styles.title}>AI Safety Atlas</h1>
        
        {/* Info Grid */}
        <div className={styles.infoGrid}>
          
          {/* Authors */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Authors</h3>
            <ul className={styles.infoList}>
              <li>Markov Grey</li>
              <li>Charbel-Raphael Segerie</li>
              <li>Jeanne Salle</li>
              <li>Charles Martinet</li>
            </ul>
          </div>
          
          {/* Affiliations */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Affiliations</h3>
            <p className={styles.infoText}>
              French Center for AI Safety (CeSIA)
            </p>
          </div>
          
          {/* Advisors */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Advisors</h3>
            <ul className={styles.infoList}>
              <li>Vincent Corruble</li>
              <li>Fabien Roger</li>
            </ul>
          </div>
          
          {/* Citation */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Cite this work as</h3>
            <p className={styles.citation}>
              Markov Grey and Charbel-Raphael Segerie et al. 2024. AI Safety Atlas. 
              French Center for AI Safety (CeSIA). ai-safety-atlas.com
            </p>
          </div>
          
          {/* Funding */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Project funded by</h3>
            <ul className={styles.infoList}>
              <li>Ryan Kidd (Manifund Regrant)</li>
              <li>Open Philanthropy</li>
            </ul>
          </div>
          
          {/* Acknowledgements */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Acknowledgements</h3>
            <ul className={styles.infoList}>
              <li>Jonathan Claybrough</li>
              <li>Jérémy Andréoletti</li>
              <li>Evander Hammer</li>
              <li>Josh Thorsteinson</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}
