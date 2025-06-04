// src/theme/DocItem/Landing/ImpactSection.jsx - Updated with images and vertical layout
import React, { useState, useEffect } from 'react';
import styles from './ImpactSection.module.css';

export default function ImpactSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Real impact metrics
  const impactMetrics = [
    {
      number: "700+",
      label: "Students Reached",
      description: "Across universities and AI safety programs"
    },
    {
      number: "300+",
      label: "Papers Integrated",
      description: "Research papers systematically reviewed and synthesized"
    },
    {
      number: "9",
      label: "State-of-the-Art Reviews", 
      description: "Comprehensive literature reviews per topic"
    },
    {
      number: "100s",
      label: "Interactive Features",
      description: "From leading AI safety resources"
    },
    {
      number: "4+",
      label: "Video Lectures",
      description: "YouTube explanations of key concepts"
    }
  ];

  // Three main output categories - with images instead of icons
  const outputCategories = [
    {
      title: "Published Video Lectures",
      description: "YouTube video series explaining key AI safety concepts with visual aids and examples",
      image: "/img/impact/video_risks.jpg",
      links: [
        { name: "Introduction to AI Safety", url: "https://www.youtube.com/watch?v=J_iMeH1hb9M" },
        { name: "AI Capabilities & Risks", url: "https://www.youtube.com/watch?v=dhr4u-w75aQ" },
        { name: "Alignment Challenges", url: "https://www.youtube.com/watch?v=iO7Jl4xders" },
        { name: "Technical Safety Approaches", url: "https://www.youtube.com/watch?v=FSKuDqze9es" }
      ]
    },
    {
      title: "Published Research Papers",
      description: "Academic publications documenting our systematic approach to AI safety education and literature review methodology",
      image: "/img/impact/paper_evals.png",
      links: [
        { name: "AI Safety Atlas: arXiv Paper", url: "https://arxiv.org/abs/2505.05541" }
      ]
    },
    {
      title: "Published Interactive Online Chapters",
      description: "9 comprehensive online chapters with hundreds of interactive features from AI Safety Digest, Our World in Data, and AI Safety Info",
      image: "/img/courses/featured/ens_paris_23.png", // Using existing image as placeholder
      links: [
        { name: "Browse All Chapters", url: "/chapters/" }
      ]
    }
  ];

  // Adoption groups - one image per category with combined descriptions
  const adoptionGroups = [
    {
      category: "Universities",
      description: "~150 students per year across major institutions including ENS Paris & Saclay (~100 students annually) and UBC Vancouver (30-50 students per cohort). Strong repeat usage across multiple semesters with course organizers choosing our materials based on merit.",
      image: "/img/courses/ens_paris/ens_paris_23.png",
      logo: "/img/courses/ens_paris/ens_paris_logo.png"
    },
    {
      category: "AI Safety Groups",
      description: "550+ students annually across specialized AI safety training programs. ML4Good reaches 250 students annually across regions, AI Safety Collab serves 300+ students in Q2 2025 (scaling to 1000+), and AI Safety India is starting mid-2025 with Fundamentals of Safe AI program. Organic adoption based on merit.",
      image: "/img/courses/ml4g/ml4g_eu_25.jpeg",
      logo: "/img/courses/ml4g/ml4g_logo.svg"
    },
    {
      category: "Independent Readers", 
      description: "Global reach with individual readers from Moscow, Brazil, Canada, and worldwide discovering materials organically. Cold outreach from readers thanking us for our work demonstrates the international impact of accessible AI safety education.",
      image: "/img/courses/independent/independent_1.jpg",
      logo: null
    }
  ];

  // Cycling images effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.impactContainer}>
      
      {/* Header */}
      <div className={styles.impactHeader}>
        <h2 className={styles.impactTitle}>Impact</h2>
        <p className={styles.impactDescription}>
          Measurable outcomes from systematic AI safety education and research contributions.
        </p>
      </div>
      
      {/* Impact Metrics */}
      <div className={styles.metricsGrid}>
        {impactMetrics.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.metricNumber}>{metric.number}</div>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricDescription}>{metric.description}</div>
          </div>
        ))}
      </div>

      {/* Three Horizontal Columns - Publications */}
      <div className={styles.publicationsSection}>
        <h3 className={styles.publicationsTitle}>Our Publications</h3>
        
        <div className={styles.publicationsGrid}>
          {outputCategories.map((category, index) => (
            <div key={index} className={styles.publicationColumn}>
              <div className={styles.publicationImageContainer}>
                <img 
                  src={category.image} 
                  alt={category.title}
                  className={styles.publicationImage}
                />
              </div>
              
              <div className={styles.publicationContent}>
                <h4 className={styles.publicationTitle}>{category.title}</h4>
                <p className={styles.publicationDescription}>{category.description}</p>
                
                <div className={styles.publicationLinks}>
                  {category.links.map((link, linkIndex) => (
                    <a 
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.publicationLink}
                    >
                      {link.name} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Vertical Adoption Groups - Image Left, Content Right */}
      <div className={styles.adoptionSection}>
        <h3 className={styles.adoptionTitle}>Educational Adoption</h3>
        
        {adoptionGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={styles.adoptionGroup}>
            <div className={styles.adoptionGroupHeader}>
              <h4 className={styles.categoryTitle}>{group.category}</h4>
              <p className={styles.categoryDescription}>{group.description}</p>
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
