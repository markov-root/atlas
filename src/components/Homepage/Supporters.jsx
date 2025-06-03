// src/components/Homepage/Supporters.jsx - Clean, minimal supporters section
import React from 'react';
import styles from './Supporters.module.css';

function SupporterCard({ name, logo, website }) {
  const handleCardClick = () => {
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`${styles.supporterCard} ${website ? styles.clickable : ''}`}
      onClick={handleCardClick}
      role={website ? "button" : "presentation"}
      tabIndex={website ? 0 : -1}
      onKeyDown={(e) => {
        if (website && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <img 
        src={logo || '/img/supporters/placeholder.svg'} 
        alt={`${name} logo`} 
        className={styles.logo}
      />
      <span className={styles.supporterName}>{name}</span>
    </div>
  );
}

export default function Supporters() {
  const supporters = [
    {
      name: "Open Philanthropy",
      logo: "/img/supporters/open-philanthropy.svg",
      website: "https://www.openphilanthropy.org/"
    },
    {
      name: "Manifund",
      logo: "/img/supporters/manifund.svg",
      website: "https://manifund.org/"
    },
    {
      name: "French Center for AI Safety",
      logo: "/img/supporters/cesia.svg",
      website: "https://cesia.fr/"
    }
  ];

  return (
    <section className={styles.supportersSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Supported by</h2>
        <div className={styles.supportersGrid}>
          {supporters.map((supporter, index) => (
            <SupporterCard
              key={index}
              name={supporter.name}
              logo={supporter.logo}
              website={supporter.website}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
