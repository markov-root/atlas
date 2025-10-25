// src/components/Courses/CertificateSection.jsx
// Updated to use certificate data from courses metadata with all text centralized
import React from 'react';
import styles from './CertificateSection.module.css';

export default function CertificateSection({ certificateInfo }) {
  // If no certificate info provided or not available, don't render
  if (!certificateInfo || !certificateInfo.available) return null;

  return (
    <div className={styles.certificateSection}>
      <div className={styles.certificateContainer}>
        <div className={styles.certificateContent}>
          <div className={styles.certificateText}>
            <div className={styles.certificateHeader}>
              <h2 className={styles.certificateTitle}>{certificateInfo.title}</h2>
            </div>
            
            <p className={styles.certificateDescription}>
              {certificateInfo.description}
            </p>
            
            <div className={styles.requirementsList}>
              <h3 className={styles.requirementsTitle}>{certificateInfo.requirementsTitle}</h3>
              <ul className={styles.requirements}>
                {certificateInfo.requirements.map((requirement, index) => (
                  <li key={index} className={styles.requirement}>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={styles.certificateImage}>
            <img
              src={certificateInfo.sampleImage}
              alt="Sample AI Safety Atlas Certificate"
              className={styles.certificateSample}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
