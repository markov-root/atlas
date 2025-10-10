// src/theme/DocItem/Landing/ImpactSnapshot.jsx
import React from 'react';
import styles from './ImpactSnapshot.module.css';

export default function ImpactSnapshot() {
  // Institution logos WITH names - using SVG versions where available
  const institutions = [
    { name: 'ML4Good', logo: '/img/courses/ml4g/ml4g_logo.svg' },
    { name: 'ENS Paris', logo: '/img/courses/ens_paris/ens_paris_logo.svg' },
    { name: 'UBC Vancouver', logo: '/img/courses/ubc_vancouver/ubc_vancouver_logo.svg' },
    { name: 'ENAIS', logo: '/img/courses/enais/enais.svg' },
    { name: 'AI Safety Hungary', logo: '/img/courses/ais_hungary/ais_hungary_logo.svg' },
    { name: 'AI Safety India', logo: '/img/courses/ais_india/ais_india.svg' },
    { name: 'AI Safety Gothenburg', logo: '/img/courses/ais_gothenburg/ais_gothenburg_logo.svg' },
    { name: 'SAIL', logo: '/img/courses/sail/sail.svg' },
    { name: 'EA Norway', logo: '/img/courses/ea_norway/ea_norway_logo.svg' },
    { name: 'AIS Global Society', logo: '/img/courses/ais_global_society/ais_global_society_logo.svg' },
  ];

  return (
    <section className={styles.impactSection}>
      <div className={styles.container}>
        
        {/* Horizontal Scrolling Logos with Names - Monochrome */}
        <div className={styles.logosSection}>
          <h3 className={styles.sectionLabel}>Used By</h3>
          <div className={styles.logosScrollContainer}>
            <div className={styles.logosTrack}>
              {/* Duplicate the array to create seamless infinite scroll */}
              {[...institutions, ...institutions].map((institution, index) => (
                <div key={index} className={styles.institutionCard}>
                  <div className={styles.logoWrapper}>
                    <img 
                      src={institution.logo} 
                      alt={institution.name}
                      className={styles.institutionLogo}
                    />
                  </div>
                  <div className={styles.institutionName}>
                    {institution.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
