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
  const [itemsToShow, setItemsToShow] = useState(3);
  
  // Responsive items calculation
  useEffect(() => {
    const updateItemsToShow = () => {
      if (window.innerWidth <= 768) {
        setItemsToShow(1); // Mobile: show 1 testimonial
      } else if (window.innerWidth <= 996) {
        setItemsToShow(2); // Tablet: show 2 testimonials
      } else {
        setItemsToShow(3); // Desktop: show 3 testimonials
      }
    };

    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);
  
  // Automatic scrolling through testimonials - pause on mobile
  useEffect(() => {
    const shouldAutoScroll = window.innerWidth > 768;
    if (!shouldAutoScroll) return;

    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) => {
        const maxIndex = Math.max(0, testimonials.regular.length - itemsToShow);
        return (prevIndex + 1) % (maxIndex + 1);
      });
    }, 5000); // Scroll every 5 seconds
    
    return () => clearInterval(timer);
  }, [itemsToShow]);
  
  // Handle manual navigation
  const handlePrev = () => {
    setCurrentTestimonialIndex((prevIndex) => {
      const maxIndex = Math.max(0, testimonials.regular.length - itemsToShow);
      return prevIndex === 0 ? maxIndex : prevIndex - 1;
    });
  };
  
  const handleNext = () => {
    setCurrentTestimonialIndex((prevIndex) => {
      const maxIndex = Math.max(0, testimonials.regular.length - itemsToShow);
      return (prevIndex + 1) % (maxIndex + 1);
    });
  };

  // Touch handlers for mobile swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const maxIndex = Math.max(0, testimonials.regular.length - itemsToShow);
  const slideWidth = 100 / itemsToShow;
  
  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Testimonials</h2>
        
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
        
        {/* Regular testimonials carousel */}
        <div className={styles.testimonialCarouselWrapper}>
          <div 
            className={styles.testimonialCarousel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className={styles.carouselTrack}
              style={{ 
                transform: `translateX(-${currentTestimonialIndex * slideWidth}%)` 
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
        </div>
        
        {/* Navigation container with buttons and dots */}
        <div className={styles.navigationContainer}>
          <button 
            className={styles.navButton} 
            onClick={handlePrev}
            aria-label="Previous testimonials"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon}>
              <path d="M8 10L8 14L6 14L-2.62268e-07 8L6 2L8 2L8 6L16 6L16 10L8 10Z" fill="currentColor"></path>
            </svg>
          </button>
          
          {/* Pagination dots */}
          <div className={styles.paginationDots}>
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={`dot-${index}`}
                className={`${styles.paginationDot} ${currentTestimonialIndex === index ? styles.activeDot : ''}`}
                onClick={() => setCurrentTestimonialIndex(index)}
                aria-label={`Go to testimonial set ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            className={styles.navButton} 
            onClick={handleNext}
            aria-label="Next testimonials"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon}>
              <path d="M8 6L8 2L10 2L16 8L10 14L8 14L8 10L-1.74845e-07 10L-3.01991e-07 6L8 6Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
