// src/pages/faq.jsx
import React from 'react';
import Layout from '@theme/Layout';
import FAQSection from '../components/FAQ/FAQSection';
import faqData from '../data/faq.json';
import styles from './faq.module.css';

export default function FAQPage() {
  // Scroll to footer contact form
  const scrollToContact = () => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout
      title="FAQ - AI Safety Atlas"
      description="Frequently asked questions about AI Safety Atlas, our approach, and how we compare to other educational resources">
      
      <div className={styles.faqPageContainer}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContainer}>
            <div className={styles.contentSection}>
              <h1 className={styles.title}>FAQ</h1>
              <div className={styles.lastUpdated}>
                Last updated {new Date(faqData.meta.lastUpdated).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <div className={styles.logoSection}>
              <img 
                src="/img/logo_samples/01-test.png" 
                alt="AI Safety Atlas Logo" 
                className={styles.logoImage}
              />
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className={styles.faqContent}>
          {faqData.categories.map((category) => (
            <FAQSection
              key={category.id}
              id={category.id}
              title={category.title}
              description={category.description}
              questions={category.questions}
            />
          ))}
        </div>

        {/* Contact Section */}
        <div className={styles.contactSection}>
          <h2 className={styles.contactTitle}>Still have questions?</h2>
          <p className={styles.contactDescription}>
            Feel free to reach out to us directly using the contact form below.
          </p>
        </div>
      </div>
    </Layout>
  );
}
