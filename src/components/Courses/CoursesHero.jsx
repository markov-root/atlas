// src/components/Courses/CoursesHero.jsx
// Updated to use hero data from courses metadata
import React from 'react';
import styles from './CoursesHero.module.css';

export default function CoursesHero({ heroData }) {
  // Fallback to defaults if no hero data provided
  const title = heroData?.title || "AI Safety Courses";
  const description = heroData?.description || "Discover academic courses, reading groups, and organized programs using the AI Safety Atlas materials.";
  const images = heroData?.images || [
    "/img/courses/ml4g/ml4g_eu_25.jpeg",
    "/img/courses/ubc_vancouver/ubc_feb_25.jpeg",
    "/img/courses/ens_paris/ens_paris_23.png",
    "/img/courses/ml4g/ml4g_brasil.jpg"
  ];

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left side - Content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroDescription}>
            {description}
          </p>
        </div>
        
        {/* Right side - Image grid */}
        <div className={styles.heroImagesGrid}>
          {images.map((imageSrc, index) => (
            <div key={index} className={styles.gridImageWrapper}>
              <img 
                src={imageSrc} 
                alt={`Course ${index + 1}`} 
                className={styles.gridImage}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/img/courses/placeholder_courses.svg';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
