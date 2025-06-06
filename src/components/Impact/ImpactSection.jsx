// src/components/Impact/ImpactSection.jsx - Updated with better framing and testimonials
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

  // Visual content breakdown - new section to highlight different types of content
  const visualContentTypes = [
    {
      type: "Custom Figures",
      description: "Original diagrams and visual explanations designed from scratch to clarify complex AI safety concepts",
      count: "80+"
    },
    {
      type: "Embedded Predictions",
      description: "Live prediction markets from Metaculus showing expert forecasts on AI development timelines",
      count: "15+"
    },
    {
      type: "Interactive Charts",
      description: "Data visualizations from AI Safety Digest, Our World in Data, and other leading sources",
      count: "50+"
    },
    {
      type: "Curated Visualizations",
      description: "Carefully selected figures, graphs, and infographics from research papers and reports",
      count: "200+"
    }
  ];

  // Three main output categories - with images instead of icons
  const outputCategories = [
    {
      title: "Published Video Lectures",
      description: "YouTube video series explaining key AI safety concepts with visual aids and examples",
      image: "/img/impact/video_risks.jpg"
    },
    {
      title: "Published Research Publication",
      description: "Academic publication documenting our systematic approach to AI safety education and literature review methodology",
      image: "/img/impact/paper_evals.png"
    },
    {
      title: "Published Interactive Online Chapters",
      description: "9 comprehensive chapters featuring custom-designed figures, embedded prediction markets, interactive charts from leading sources, and curated visualizations",
      image: "/img/impact/interactive.png"
    }
  ];

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
        <h1 className={styles.impactTitle}>Impact</h1>
        <p className={styles.impactDescription}>
          Measurable outcomes from systematic AI safety education and research contributions.
        </p>
      </div>
      
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

      {/* Testimonials Section - Clean presentation */}
      <div className={styles.testimonialsSection}>
        <h3 className={styles.testimonialsTitle}>What Students, Facilitators, and Researchers Are Saying</h3>
        <div className={styles.testimonialsGrid}>
          {/* Student */}
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialType}>Student</div>
            <blockquote className={styles.testimonialQuote}>
              "This was my first time reading the AI Safety Atlas and wow!!! It has so many insightful information and citations that I am looking forward to diving deeper into."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorRole}>Vancouver Program</div>
            </div>
          </div>

          {/* Facilitator */}
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialType}>Facilitator</div>
            <blockquote className={styles.testimonialQuote}>
              "For a systematic, centralized, and concise introduction to the core topics in AI safety, this is the best and most up-to-date resource I know."
            </blockquote>
            <div className={styles.testimonialAuthor}>

              <div className={styles.authorName}>Josh Thorsteinson</div>
              <div className={styles.authorRole}>UBC Vancouver Course Organizer</div>
            </div>
          </div>

          {/* Researcher */}
          <div className={styles.testimonialCard}>

            <div className={styles.testimonialType}>Researcher</div>
            <blockquote className={styles.testimonialQuote}>
              "As an AI safety research engineer, I find it a pretty good in-depth introduction. It covers a lot in a very clear way."
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorName}>Maxime Riche</div>
              <div className={styles.authorRole}>AI Safety Researcher</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Content Breakdown - Commented out for now
      <div className={styles.visualContentSection}>
        <h3 className={styles.visualContentTitle}>Rich Visual Learning Experience</h3>
        <p className={styles.visualContentDescription}>
          Our chapters combine multiple types of visual content to make complex AI safety concepts accessible and engaging.
        </p>
        
        <div className={styles.visualContentGrid}>
          {visualContentTypes.map((content, index) => (
            <div key={index} className={styles.visualContentCard}>
              <div className={styles.visualContentCount}>{content.count}</div>
              <h4 className={styles.visualContentType}>{content.type}</h4>
              <p className={styles.visualContentDesc}>{content.description}</p>
            </div>
          ))}
        </div>
      </div>
      */}

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
