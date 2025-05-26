// src/components/Courses/CourseCard.jsx
import React from 'react';
import styles from './CourseCard.module.css';
import clsx from 'clsx';

export default function CourseCard({ course, onClick }) {
  // Format dates
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "Date not specified";
    }
  };

  // Determine card border color based on course type
  const getTypeClass = () => {
    if (!course.type) return '';
    
    switch (course.type.toLowerCase()) {
      case 'university course':
        return styles.universityType;
      case 'organized ai safety group':
        return styles.organizedType;
      case 'independent reading group':
        return styles.independentType;
      default:
        return '';
    }
  };

  // Check if logo exists, otherwise use placeholder
  const logoSrc = course.logo || '/img/courses/placeholder_courses.svg';

  // Safely handle the click event
  const handleCardClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick(course);
    }
  };

  return (
    <div 
      className={clsx(styles.courseCard, getTypeClass())}
      onClick={handleCardClick}
    >
      <div className={styles.logoContainer}>
        <img 
          src={logoSrc} 
          alt={`${course.organization} logo`} 
          className={styles.courseLogo}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/img/courses/placeholder_courses.svg';
          }}
        />
      </div>
      
      <div className={styles.courseContent}>
        <div className={styles.typeTag}>{course.type || "Course"}</div>
        <h3 className={styles.courseName}>{course.name}</h3>
        <div className={styles.organization}>{course.organization}</div>
        
        <div className={styles.courseDetails}>
          {course.startDate && course.endDate && (
            <div className={styles.detailItem}>
              <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>
                {formatDate(course.startDate)} - {formatDate(course.endDate)}
              </span>
            </div>
          )}
          
          {course.students && (
            <div className={styles.detailItem}>
              <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>{course.students} students</span>
            </div>
          )}
          
          {course.location && (
            <div className={styles.detailItem}>
              <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{course.location}</span>
            </div>
          )}
        </div>
        
        <div className={styles.viewDetailsWrapper}>
          <button className={styles.viewDetailsButton}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
