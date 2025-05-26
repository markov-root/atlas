// src/components/Courses/CoursesHero.jsx
import React, { useState } from 'react';
import styles from './CoursesHero.module.css';
import { Rocket, X } from 'lucide-react';

export default function CoursesHero() {
  const [expandedImage, setExpandedImage] = useState(null);

  // Featured courses with images and logos
  const featuredCourses = [
    {
      id: 1,
      image: '/img/courses/ml4g/ml4g_eu_25.jpeg',
      logo: '/img/courses/ml4g/ml4g_logo.png',
      org: 'ML4Good'
    },
    {
      id: 2,
      image: '/img/courses/ubc_vancouver/ubc_feb_25.jpeg',
      logo: '/img/courses/ubc_vancouver/ubc_vancouver_logo.png',
      org: 'UBC Vancouver'
    },
    {
      id: 3,
      image: '/img/courses/ens_paris/ens_paris_23.png',
      logo: '/img/courses/ens_paris/ens_paris_logo.jpg',
      org: 'ENS Paris'
    },
    {
      id: 4,
      image: '/img/courses/ai_safety_collab/ai_safety_collab_06_24.jpg',
      logo: '/img/courses/placeholder_courses.svg',
      org: 'AI Safety Collaborative'
    }
  ];

  const handleImageClick = (course) => {
    setExpandedImage(course);
  };

  const handleCloseExpanded = () => {
    setExpandedImage(null);
  };

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left side - content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>AI Safety Courses</h1>
          <p className={styles.heroDescription}>
            Discover academic courses, reading groups, and organized programs using the 
            AI Safety Atlas materials. Join an existing course or start your own with our resources.
          </p>
          
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>12+</div>
              <div className={styles.statLabel}>Active Courses</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>600+</div>
              <div className={styles.statLabel}>Students</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>8</div>
              <div className={styles.statLabel}>Countries</div>
            </div>
          </div>

          <div className={styles.cta}>
            <a href="/teaching-resources" className={styles.ctaButton}>
              <Rocket size={18} className={styles.buttonIcon} />
              Start Facilitating
            </a>
          </div>
        </div>
        
        {/* Right side - image grid */}
        <div className={styles.heroImagesGrid}>
          {featuredCourses.map((course) => (
            <div 
              key={course.id} 
              className={styles.gridImageWrapper}
              onClick={() => handleImageClick(course)}
            >
              <img 
                src={course.image} 
                alt={`${course.org} course`} 
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

      {/* Expanded image overlay */}
      {expandedImage && (
        <div className={styles.expandedOverlay} onClick={handleCloseExpanded}>
          <button className={styles.closeButton} onClick={handleCloseExpanded}>
            <X size={24} />
          </button>
          <div className={styles.expandedImageContainer} onClick={(e) => e.stopPropagation()}>
            <img 
              src={expandedImage.image} 
              alt={`${expandedImage.org} course expanded`} 
              className={styles.expandedImage}
            />
            <div className={styles.orgLogoContainer}>
              <img 
                src={expandedImage.logo} 
                alt={`${expandedImage.org} logo`} 
                className={styles.orgLogo}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/img/courses/placeholder_courses.svg';
                }}
              />
              <span className={styles.orgName}>{expandedImage.org}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
