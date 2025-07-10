// src/components/Impact/Summary.jsx
import React from 'react';
import { 
  loadAnalyticsData, 
  calculateYearlyProjection, 
  getCountriesReached,
  debugAnalyticsData 
} from '../../utils/analyticsUtils';
import styles from './Summary.module.css';

export default function Summary() {
  // Load analytics data safely with fallbacks
  const analyticsData = loadAnalyticsData();
  
  // Debug in development
  debugAnalyticsData(analyticsData);
  
  // Calculate key metrics using utility functions
  const yearlyReaders = calculateYearlyProjection(analyticsData.timeline);
  const countriesReached = getCountriesReached(analyticsData.geography);

  // Updated impact metrics with analytics integration
  const impactMetrics = [
    {
      number: "1000+",
      label: "Students Directly Reached",
      description: "Across universities and AI safety programs globally"
    },
    {
      number: yearlyReaders,
      label: "Independent Readers",
      description: "Projected yearly independent learners and students based on current analytics"
    },
    {
      number: "650+",
      label: "Academic Sources Integrated",
      description: "Ideas from hudreds of research papers synthesized into a single curriculum across chapters"
    }
  ];

  return (
    <div className={styles.summaryContainer}>
      {/* Impact Metrics */}
      <div className={styles.metricsSection}>
        <h3 className={styles.metricsSubheader}>Our Impact at a Glance</h3>
        <div className={styles.metricsGrid}>
          {impactMetrics.map((metric, index) => (
            <div key={index} className={styles.metricCard}>
              <div className={styles.metricNumber}>{metric.number}</div>
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.metricDescription}>{metric.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
