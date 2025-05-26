// src/components/Courses/StartOwnCourse.jsx
import React from 'react';
import styles from './StartOwnCourse.module.css';
import { Rocket, FileText, Book, Users } from 'lucide-react';

export default function StartOwnCourse() {
  return (
    <div className={styles.startCourseSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Start Your Own Course</h2>
          <p className={styles.sectionDescription}>
            Want to run your own AI Safety course or reading group? We provide all the materials
            you need to get started, including syllabi, reading lists, and discussion guides.
          </p>
        </div>
        
        <div className={styles.resourcesGrid}>
          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <FileText size={24} />
            </div>
            <h3 className={styles.resourceTitle}>Teaching Materials</h3>
            <p className={styles.resourceDescription}>
              Access ready-to-use slide decks, lecture notes, and teaching guides for all chapters.
            </p>
          </div>
          
          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <Book size={24} />
            </div>
            <h3 className={styles.resourceTitle}>Reading Lists</h3>
            <p className={styles.resourceDescription}>
              Curated reading lists for different AI safety topics, from beginner to advanced levels.
            </p>
          </div>
          
          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <Users size={24} />
            </div>
            <h3 className={styles.resourceTitle}>Discussion Guides</h3>
            <p className={styles.resourceDescription}>
              Structured discussion questions and activities to facilitate engaging sessions.
            </p>
          </div>
        </div>
        
        <div className={styles.startCourseActions}>
          <a href="/teaching-resources" className={styles.primaryButton}>
            <Rocket size={18} className={styles.buttonIcon} />
            Access Teaching Resources
          </a>
          <a href="#contact" className={styles.secondaryButton}>
            Get Support
          </a>
        </div>
      </div>
    </div>
  );
}
