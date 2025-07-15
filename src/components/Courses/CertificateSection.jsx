// src/components/Courses/CertificateSection.jsx - Self-contained with own data
import React from 'react';
import styles from './CertificateSection.module.css';

// Certificate data lives in the component
const certificateData = {
  available: true,
  sampleImage: "/img/courses/certificate.png",
  description: "Official LinkedIn certificates available for participants who complete course requirements. The specific requirements vary by the course provider.",
  requirements: [
    "Attend at least 80% of the sessions",
    "Read the textbook, and participate actively in group discussions", 
    "Submit final projects or equivalent contribution"
  ]
};

export default function CertificateSection() {
  if (!certificateData.available) return null;

  return (
    <div className={styles.certificateSection}>
      <div className={styles.certificateContainer}>
        <div className={styles.certificateContent}>
          <div className={styles.certificateText}>
            <div className={styles.certificateHeader}>
              <h2 className={styles.certificateTitle}>Official Certificates</h2>
            </div>
            
            <p className={styles.certificateDescription}>
              {certificateData.description}
            </p>
            
            <div className={styles.requirementsList}>
              <h3 className={styles.requirementsTitle}>Common Certificate Requirements:</h3>
              <ul className={styles.requirements}>
                {certificateData.requirements.map((requirement, index) => (
                  <li key={index} className={styles.requirement}>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={styles.certificateImage}>
            <img
              src={certificateData.sampleImage}
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
