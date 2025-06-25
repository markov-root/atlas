// src/components/Courses/UpcomingCourses.jsx
import React from 'react';
import CoursesList from './CoursesList';
import styles from './CourseSections.module.css';
import { Calendar } from 'lucide-react';

export default function UpcomingCourses({ courses, onOpenCourse }) {
  return (
    <div className={`${styles.courseSection} ${styles.altBackground}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconWrapper}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.sectionTitle}>Upcoming Courses</h2>
          </div>
          <p className={styles.sectionDescription}>
            Programs scheduled to start soon that you can register for today
          </p>
        </div>
        
        <CoursesList 
          courses={courses} 
          onOpenCourse={onOpenCourse}
        />
      </div>
    </div>
  );
}
