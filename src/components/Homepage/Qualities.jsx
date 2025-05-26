// src/components/Homepage/Qualities.jsx
import React from 'react';
import styles from './Qualities.module.css';

const QualityCard = ({ title, description }) => (
  <div className={styles.qualityCard}>
    <h3 className={styles.qualityTitle}>{title}</h3>
    <p className={styles.qualityDescription}>{description}</p>
  </div>
);

export default function ProjectQualities() {
  const qualities = [
    {
      title: 'Multi-Format Learning',
      description: 'Clear learning paths from fundamentals to advanced topics, for every skill level.'
    },
    {
      title: 'Progressive Learning',
      description: 'Complex research distilled into clear, interconnected explanations.'
    },
    {
      title: 'Interactive Learning',
      description: 'Learn through text, video, interactive exercises, and discussion guides.'
    },
    {
      title: 'Proven Impact',
      description: 'Used by leading AI Safety programs with strong repeat adoption.'
    },
    {
      title: 'Community Driven',
      description: 'Open-source content improved by researchers and educators worldwide.'
    },
    {
      title: 'Time Efficient',
      description: 'Save research hours with well-structured explanations.'
    }
  ];

  return (
    <section className={styles.qualitiesSection}>
      <div className="container">
        <div className={styles.qualitiesGrid}>
          {qualities.map((quality, index) => (
            <QualityCard 
              key={index}
              title={quality.title}
              description={quality.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
