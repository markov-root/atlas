// src/components/Impact/Summary.jsx
import React from 'react';
import styles from './Summary.module.css';

export default function Summary() {
  // Real impact metrics
  const impactMetrics = [
    {
      number: "1000+",
      label: "Students Reached",
      description: "Across universities and AI safety programs"
    },
    {
      number: "300+",
      label: "Papers Integrated",
      description: "Insights from hundreds of research papers systematically reviewed and synthesized"
    },
    {
      number: "9",
      label: "Chapters Written", 
      description: "Thorough literature reviews covering major AI safety topics"
    },
    {
      number: "500+",
      label: "Visual Explanations",
      description: "Custom visualizations, embedded charts, prediction markets, and curated figures"
    },
    {
      number: "4",
      label: "Video Lectures",
      description: "YouTube explanations of key concepts"
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
