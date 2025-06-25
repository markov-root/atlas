// src/components/Impact/Testimonials.jsx
import React from 'react';
import styles from './Testimonials.module.css';

export default function Testimonials() {
  const testimonials = [
    {
      type: "Student",
      quote: "This was my first time reading the AI Safety Atlas and wow!!! It has so many insightful information and citations that I am looking forward to diving deeper into.",
      author: {
        role: "Vancouver Program"
      }
    },
    {
      type: "Facilitator",
      quote: "For a systematic, centralized, and concise introduction to the core topics in AI safety, this is the best and most up-to-date resource I know.",
      author: {
        name: "Josh Thorsteinson",
        role: "UBC Vancouver Course Organizer"
      }
    },
    {
      type: "Researcher",
      quote: "As an AI safety research engineer, I find it a pretty good in-depth introduction. It covers a lot in a very clear way.",
      author: {
        name: "Maxime Riche",
        role: "AI Safety Researcher"
      }
    }
  ];

  return (
    <div className={styles.testimonialsContainer}>
      {/* Testimonials Section - Clean presentation */}
      <div className={styles.testimonialsSection}>
        <h3 className={styles.testimonialsTitle}>What Students, Facilitators, and Researchers Are Saying</h3>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialType}>{testimonial.type}</div>
              <blockquote className={styles.testimonialQuote}>
                {testimonial.quote}
              </blockquote>
              <div className={styles.testimonialAuthor}>
                {testimonial.author.name && (
                  <div className={styles.authorName}>{testimonial.author.name}</div>
                )}
                <div className={styles.authorRole}>{testimonial.author.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
