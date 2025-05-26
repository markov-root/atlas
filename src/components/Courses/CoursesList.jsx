// src/components/Courses/CoursesList.jsx
import React from 'react';
import CourseCard from './CourseCard';
import styles from './CoursesList.module.css';

export default function CoursesList({ courses, onOpenCourse }) {
  if (!courses || courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg className={styles.emptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
          <path d="M12 12h.01"></path>
          <path d="M17 12h.01"></path>
          <path d="M7 12h.01"></path>
        </svg>
        <h3 className={styles.emptyTitle}>No Courses Available</h3>
        <p className={styles.emptyText}>
          No courses are currently listed in this category. 
          Check back later or consider starting your own course.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.coursesGrid}>
      {courses.map(course => (
        <CourseCard 
          key={course.id} 
          course={course} 
          onClick={onOpenCourse}
        />
      ))}
    </div>
  );
}
