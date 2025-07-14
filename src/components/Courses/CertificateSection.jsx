// src/components/Courses/CertificateSection.jsx - Certificate information display with your SVGs
import React from 'react';
import styles from './CertificateSection.module.css';

export default function CertificateSection({ certificateInfo }) {
  if (!certificateInfo || !certificateInfo.available) return null;

  return (
    <div className={styles.certificateSection}>
      <div className={styles.certificateContainer}>
        <div className={styles.certificateContent}>
          <div className={styles.certificateText}>
            <div className={styles.certificateHeader}>
              <div className={styles.certificateIconWrapper}>
                <img 
                  src="/img/icons/acknowledgements.svg" 
                  alt="" 
                  className={styles.certificateIcon} 
                />
              </div>
              <h2 className={styles.certificateTitle}>Official Certificates</h2>
            </div>
            
            <p className={styles.certificateDescription}>
              {certificateInfo.description}
            </p>
            
            {certificateInfo.requirements && (
              <div className={styles.requirementsList}>
                <h3 className={styles.requirementsTitle}>Certificate Requirements:</h3>
                <ul className={styles.requirements}>
                  {certificateInfo.requirements.map((requirement, index) => (
                    <li key={index} className={styles.requirement}>
                      <img 
                        src="/img/icons/info.svg" 
                        alt="" 
                        className={styles.checkIcon} 
                      />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
