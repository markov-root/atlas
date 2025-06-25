// src/components/Courses/OngoingCourses.jsx
import React from 'react';
import CoursesList from './CoursesList';
import styles from './CourseSections.module.css';
import { BookOpen } from 'lucide-react';

export default function OngoingCourses({ courses, onOpenCourse }) {
  return (
    <div className={styles.courseSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconWrapper}>
              <BookOpen size={24} />
            </div>
            <h2 className={styles.sectionTitle}>Ongoing Courses</h2>
          </div>
          <p className={styles.sectionDescription}>
            Currently active courses and programs using AI Safety Atlas materials
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
