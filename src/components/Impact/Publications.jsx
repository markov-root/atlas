// src/components/Impact/Publications.jsx
import React from 'react';
import styles from './Publications.module.css';

export default function Publications() {
  // Three main output categories - with images instead of icons
  const outputCategories = [
    {
      title: "Published Video Lectures",
      description: "YouTube video series explaining key AI safety concepts with visual aids and examples",
      image: "/img/impact/video_risks.jpg"
    },
    {
      title: "Published Research Publication",
      description: "Academic publication documenting our systematic approach to AI safety education and literature review methodology",
      image: "/img/impact/paper_evals.png"
    },
    {
      title: "Published Interactive Online Chapters",
      description: "9 comprehensive chapters featuring custom-designed figures, embedded prediction markets, interactive charts from leading sources, and curated visualizations",
      image: "/img/impact/interactive.png"
    }
  ];

  return (
    <div className={styles.publicationsContainer}>
      {/* Publications Section - Three Horizontal Columns */}
      <div className={styles.publicationsSection}>
        <h3 className={styles.publicationsTitle}>Our Publications</h3>
        
        <div className={styles.publicationsGrid}>
          {outputCategories.map((category, index) => (
            <div key={index} className={styles.publicationColumn}>
              <div className={styles.publicationImageContainer}>
                <img 
                  src={category.image} 
                  alt={category.title}
                  className={styles.publicationImage}
                />
              </div>
              
              <div className={styles.publicationContent}>
                <h4 className={styles.publicationTitle}>{category.title}</h4>
                <p className={styles.publicationDescription}>{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
