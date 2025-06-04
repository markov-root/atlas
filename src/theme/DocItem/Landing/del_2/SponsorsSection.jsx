// src/theme/DocItem/Landing/SponsorsSection.jsx - Our sponsors with logos
import React from 'react';
import styles from './SponsorsSection.module.css';

export default function SponsorsSection() {
  const sponsors = [
    {
      name: "French Center for AI Safety (CeSIA)",
      logo: "/img/supporters/cesia.svg",
      alt: "CeSIA"
    },
    {
      name: "Manifund Regrant",
      logo: "/img/supporters/manifund.svg",
      alt: "Manifund"
    },
    {
      name: "Open Philanthropy",
      logo: "/img/supporters/open-philanthropy.svg",
      alt: "Open Philanthropy"
    }
  ];

  return (
    <div className={styles.sponsorsContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.iconContainer}>
          <img src="/img/icons/support.svg" alt="" className={styles.icon} />
        </div>
        <h2 className={styles.sectionTitle}>Our Sponsors</h2>
      </div>
      
      <div className={styles.sponsorsList}>
        {sponsors.map((sponsor, index) => (
          <div key={index} className={styles.sponsorItem}>
            <div className={styles.sponsorLogoContainer}>
              <img 
                src={sponsor.logo} 
                alt={sponsor.alt} 
                className={styles.sponsorLogo} 
              />
            </div>
            <span className={styles.sponsorName}>{sponsor.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
