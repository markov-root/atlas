// src/components/Homepage/Testimonials.jsx
import React, { useState, useEffect } from 'react';
import styles from './Testimonials.module.css';
import testimonials from '@site/src/data/testimonials.json';
import { Quote } from 'lucide-react';

function TestimonialCard({ quote, name, position, image, featured = false }) {
  // Use placeholder image if none is provided
  const imageSrc = image || 'img/testimonials/placeholder.jpg';
  
  return (
    <div className={`${styles.testimonialCard} ${featured ? styles.featuredCard : ''}`}>
      <div className={styles.quoteIconWrapper}>
        <Quote size={24} className={styles.quoteIcon} />
      </div>
      
      <blockquote className={styles.quote}>
        {quote}
      </blockquote>
      
      <div className={styles.testimonialFooter}>
        <div className={styles.avatarWrapper}>
          <img src={imageSrc} alt={name} className={styles.avatar} />
        </div>
        
        <div className={styles.testimonialAuthor}>
          <div className={styles.name}>{name}</div>
          {position && <div className={styles.position}>{position}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const itemsToShow = 3; // Number of testimonials to show at once
  
  // Automatic scrolling through testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) => 
        (prevIndex + 1) % (testimonials.regular.length - itemsToShow + 1)
      );
    }, 5000); // Scroll every 5 seconds
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle manual navigation
  const handlePrev = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.regular.length - itemsToShow : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      (prevIndex + 1) % (testimonials.regular.length - itemsToShow + 1)
    );
  };
  
  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Quotes</h2>
        
        {/* Featured testimonials at the top - only render if there are any */}
        {testimonials.featured && testimonials.featured.length > 0 && (
          <div className={styles.featuredTestimonials}>
            {testimonials.featured.map((testimonial, index) => (
              <TestimonialCard
                key={`featured-${index}`}
                quote={testimonial.quote}
                name={testimonial.name}
                position={testimonial.position}
                image={testimonial.image}
                featured={true}
              />
            ))}
          </div>
        )}
        
        {/* Regular testimonials in scrolling carousel */}
        <div className={styles.testimonialCarouselWrapper}>
          <button 
            className={`${styles.carouselButton} ${styles.prevButton}`} 
            onClick={handlePrev}
            aria-label="Previous testimonials"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon}>
              <path d="M8 10L8 14L6 14L-2.62268e-07 8L6 2L8 2L8 6L16 6L16 10L8 10Z" fill="currentColor"></path>
            </svg>
          </button>
          
          <div className={styles.testimonialCarousel}>
            <div 
              className={styles.carouselTrack}
              style={{ 
                transform: `translateX(-${currentTestimonialIndex * 33.33}%)` 
              }}
            >
              {testimonials.regular.map((testimonial, index) => (
                <div className={styles.carouselItem} key={`regular-${index}`}>
                  <TestimonialCard
                    quote={testimonial.quote}
                    name={testimonial.name}
                    position={testimonial.position}
                    image={testimonial.image}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className={`${styles.carouselButton} ${styles.nextButton}`} 
            onClick={handleNext}
            aria-label="Next testimonials"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon}>
              <path d="M8 6L8 2L10 2L16 8L10 14L8 14L8 10L-1.74845e-07 10L-3.01991e-07 6L8 6Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
        
        {/* Pagination dots */}
        <div className={styles.paginationDots}>
          {Array.from({ length: testimonials.regular.length - itemsToShow + 1 }).map((_, index) => (
            <button
              key={`dot-${index}`}
              className={`${styles.paginationDot} ${currentTestimonialIndex === index ? styles.activeDot : ''}`}
              onClick={() => setCurrentTestimonialIndex(index)}
              aria-label={`Go to testimonial set ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
