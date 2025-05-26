// src/components/Homepage/Features.jsx
import React from 'react';
import styles from './Features.module.css';
import Link from '@docusaurus/Link';

export default function Features() {
  console.log('Features styles:', styles); // Debug log

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Learn</h3>
            <p className={styles.featureDescription}>
              Explore explanations of AI Safety concepts
            </p>
            <Link
              className={styles.featureButton}
              to="/chapters/">
              Start Learning
            </Link>
          </div>
          
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Teach</h3>
            <p className={styles.featureDescription}>
              Get materials to teach AI Safety effectively
            </p>
            <Link
              className={styles.featureButton}
              to="/chapters/01/">
              Access Resources
            </Link>
          </div>
          
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Join a Course</h3>
            <p className={styles.featureDescription}>
              Participate in structured AI Safety learning programs
            </p>
            <Link
              className={styles.featureButton}
              to="/courses">
              Find Courses
            </Link>
          </div>
          
          <div className={styles.featureCard}>
            <h3 className={styles.featureTitle}>Support</h3>
            <p className={styles.featureDescription}>
              Help build AI Safety knowledge infrastructure
            </p>
            <Link
              className={styles.featureButton}
              to="#contact">
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
