// src/components/Impact/Adoption.jsx
import React from 'react';
import styles from './Adoption.module.css';

export default function Adoption() {
  // Adoption groups - one image per category with combined descriptions
  const adoptionGroups = [
    {
      category: "Universities",
      description: "~150 students per year across major institutions including ENS Paris & Saclay (~100 students annually) and UBC Vancouver (30-50 students per cohort). Achieved through organic adoption with minimal marketing. Strong repeat usage across multiple semesters - institutions return semester after semester with course organizers choosing our materials based on merit.",
      image: "/img/courses/ens_paris/ens_paris_23.png",
      logo: "/img/courses/ens_paris/ens_paris_logo.png"
    },
    {
      category: "AI Safety Groups",
      description: "550+ students annually across specialized AI safety training programs. ML4Good reaches 250 students annually across regions, AI Safety Collab serves 300+ students in Q2 2025 (scaling to 1000+), and AI Safety India is starting mid-2025 with Fundamentals of Safe AI program. Organic adoption based on merit.",
      image: "/img/courses/ml4g/ml4g_france_22.png",
      logo: "/img/courses/ml4g/ml4g_logo.svg"
    },
    {
      category: "Independent Readers", 
      description: "Global reach with individual readers from Moscow, Brazil, Canada, and worldwide discovering materials organically. Cold outreach from readers globally thanking us for our work demonstrates the international impact of accessible AI safety education.",
      image: "/img/courses/independent/independent_1.jpg",
      logo: null
    }
  ];

  return (
    <div className={styles.adoptionContainer}>
      {/* Educational Adoption Section - Full Width Rows */}
      <div className={styles.adoptionSection}>
        <h3 className={styles.adoptionTitle}>Educational Adoption</h3>
        
        {adoptionGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={styles.adoptionGroup}>
            <div className={styles.adoptionGroupHeader}>
              <h4 className={styles.categoryTitle}>{group.category}</h4>
            </div>
            
            <div className={styles.adoptionGroupContent}>
              {/* Image Left */}
              <div className={styles.categoryImageContainer}>
                <img 
                  src={group.image}
                  alt={`${group.category} usage`}
                  className={styles.categoryImage}
                />
                {group.logo && (
                  <div className={styles.categoryLogo}>
                    <img 
                      src={group.logo} 
                      alt={`${group.category} logo`}
                      className={styles.categoryLogoImage}
                    />
                  </div>
                )}
              </div>
              
              {/* Content Right */}
              <div className={styles.categoryContentText}>
                <p className={styles.categoryDetailedDescription}>{group.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
