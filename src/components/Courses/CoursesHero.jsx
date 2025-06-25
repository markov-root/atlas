// src/components/Courses/CoursesHero.jsx
import React from 'react';
import styles from './CoursesHero.module.css';
import { Rocket } from 'lucide-react';

export default function CoursesHero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left side - Content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>AI Safety Courses</h1>
          <p className={styles.heroDescription}>
            Discover academic courses, reading groups, and organized programs using the 
            AI Safety Atlas materials. Join an existing course or start your own with our resources.
          </p>
          



        </div>
        
        {/* Right side - Image grid */}
        <div className={styles.heroImagesGrid}>
          <div className={styles.gridImageWrapper}>
            <img 
              src="/img/courses/ml4g/ml4g_eu_25.jpeg" 
              alt="ML4Good course" 
              className={styles.gridImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
          <div className={styles.gridImageWrapper}>
            <img 
              src="/img/courses/ubc_vancouver/ubc_feb_25.jpeg" 
              alt="UBC Vancouver course" 
              className={styles.gridImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
          <div className={styles.gridImageWrapper}>
            <img 
              src="/img/courses/ens_paris/ens_paris_23.png" 
              alt="ENS Paris course" 
              className={styles.gridImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
          <div className={styles.gridImageWrapper}>
            <img 
              src="/img/courses/ai_safety_collab/ai_safety_collab_06_24.jpg" 
              alt="AI Safety Collaborative course" 
              className={styles.gridImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
