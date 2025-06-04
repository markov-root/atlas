// src/theme/DocItem/Landing/QuotesSection.jsx
import React, { useState, useEffect } from 'react';
import quotesData from '../../../data/quotes.json';
import styles from './QuotesSection.module.css';

export default function QuotesSection() {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => 
        (prev + 1) % quotesData.carousel.length
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentQuote = quotesData.carousel[currentCarouselIndex];

  return (
    <div className={styles.quotesSection}>
      <div className={styles.container}>
        
        {/* Godfathers Section */}
        <div className={styles.godfathersSection}>
          <h2 className={styles.sectionTitle}>What the Godfathers of AI Say</h2>
          
          <div className={styles.godfathersGrid}>
            {quotesData.godfathers.map((godfather, index) => (
              <div key={index} className={styles.godfatherCard}>
                <blockquote className={styles.godfatherQuote}>
                  "{godfather.quote}"
                </blockquote>
                <div className={styles.godfatherInfo}>
                  <div className={styles.godfatherName}>{godfather.name}</div>
                  <div className={styles.godfatherTitle}>{godfather.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Section */}
        <div className={styles.carouselSection}>
          <h3 className={styles.carouselTitle}>More Expert Voices</h3>
          
          <div className={styles.carouselContainer}>
            <div className={styles.carouselQuote}>
              <blockquote className={styles.quote}>
                "{currentQuote.quote}"
              </blockquote>
              <div className={styles.quoteAuthor}>
                <div className={styles.authorName}>{currentQuote.name}</div>
                <div className={styles.authorTitle}>{currentQuote.title}</div>
              </div>
            </div>
            
            {/* Carousel Dots */}
            <div className={styles.carouselDots}>
              {quotesData.carousel.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentCarouselIndex ? styles.activeDot : ''}`}
                  onClick={() => setCurrentCarouselIndex(index)}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
