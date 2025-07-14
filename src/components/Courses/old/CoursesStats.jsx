// src/components/Courses/CoursesStats.jsx - Global statistics display
import React from 'react';
import { Users, Globe, GraduationCap, Languages } from 'lucide-react';
import styles from './CoursesStats.module.css';

export default function CoursesStats({ stats }) {
  if (!stats) return null;

  const statItems = [
    {
      icon: <GraduationCap size={24} />,
      value: stats.programs,
      label: 'Programs',
      description: 'Active course programs worldwide'
    },
    {
      icon: <Globe size={24} />,
      value: stats.countries,
      label: 'Countries',
      description: 'Countries with Atlas-based courses'
    },
    {
      icon: <Users size={24} />,
      value: stats.participants,
      label: 'Participants',
      description: 'Students who have completed courses'
    },
    {
      icon: <Languages size={24} />,
      value: stats.languages,
      label: 'Languages',
      description: 'Course languages available'
    }
  ];

  return (
    <div className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          {statItems.map((item, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon}>
                {item.icon}
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{item.value}</div>
                <div className={styles.statLabel}>{item.label}</div>
                <div className={styles.statDescription}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
