// src/theme/DocItem/Landing/ProjectStory.jsx - Flipped Framework with Bold Claims
import React, { useState, useEffect } from 'react';
import styles from './ProjectStory.module.css';

// Single rotating expert quote data
const EXPERT_QUOTES = [
  {
    quote: "We have agency. It's not too late to steer the evolution of societies and humanity in a positive direction. But for that, we need enough people who understand both the advantages and the risks.",
    name: "Yoshua Bengio",
    title: "Most cited computer scientist globally, Turing Award Winner",
    image: "/img/quotes/yoshua_bengio.jpg",
    source: "CNBC Interview",
    year: "2024",
    url: "https://www.cnbc.com/2024/11/21/will-ai-replace-humans-yoshua-bengio-warns-of-artificial-intelligence-risks.html"
  },
  {
    quote: "We're dealing with things we've never dealt with before. And normally, the first time you deal with something totally novel, you get it wrong. And we can't afford to get it wrong.",
    name: "Geoffrey Hinton",
    title: "Turing Award Winner 2018, \"Godfather of AI\"",
    image: "/img/quotes/geoffrey_hinton.jpg",
    source: "CBS 60 Minutes Interview",
    year: "2023",
    url: "https://www.cbsnews.com/news/geoffrey-hinton-ai-dangers-60-minutes-transcript/"
  },
  {
    quote: "It's obviously important that any superintelligence anyone builds does not go rogue... It's an unsolved problem.",
    name: "Ilya Sutskever",
    title: "Co-Founder Safe Superintelligence Inc., former Chief Scientist at OpenAI",
    image: "/img/quotes/ilya_sutskever.jpg",
    source: "MIT Technology Review",
    year: "2023",
    url: "https://www.technologyreview.com/2023/10/26/1082398/exclusive-ilya-sutskever-openais-chief-scientist-on-his-hopes-and-fears-for-the-future-of-ai/"
  }
];

export default function ProjectStory() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Auto-rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % EXPERT_QUOTES.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const currentQuote = EXPERT_QUOTES[currentQuoteIndex];

  return (
    <div className={styles.storyContainer}>
      <div className={styles.storyContent}>
        
        {/* Primary Message: Bold claim and solution */}
        <div className={styles.primarySection}>
          <div className={styles.primaryContent}>
            <h2 className={styles.primaryTitle}>
              The field that will determine humanity's future, explained systematically.
            </h2>
            
            <div className={styles.primaryDescription}>
              <p>
                Some of the <a href="https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=label%3Aartificial_intelligence+OR+label%3AAI&btnG=" target="_blank" rel="noopener noreferrer" className={styles.credibilityLink}>most cited AI researchers</a> are 
                sounding urgent warnings about the path ahead. But the knowledge you need to understand 
                AI safety is scattered across hundreds of research papers, blog posts, and technical discussions.
              </p>
              
              <p className={styles.solutionStatement}>
                <strong>That's why we created the AI Safety Atlas.</strong> We perform the essential <a href="https://distill.pub/2017/research-debt/" target="_blank" rel="noopener noreferrer" className={styles.credibilityLink}>interpretive labor</a>—transforming scattered AI
                safety research into systematic, connected learning paths.
                Hundreds of students globally across multiple universities now use the
                Atlas to go from curious to well-informed in weeks, not years.
              </p>
            </div>
          </div>
          
          {/* Single rotating expert quote - redesigned like testimonials */}
          <div className={styles.expertQuoteContainer}>
            <div className={styles.quoteCard}>
              {/* Quote icon */}
              <div className={styles.quoteIconWrapper}>
                <svg className={styles.quoteIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" fill="currentColor"/>
                </svg>
              </div>
              
              <blockquote className={styles.quote}>
                {currentQuote.quote}
              </blockquote>
              
              <div className={styles.quoteFooter}>
                <div className={styles.avatarWrapper}>
                  <img 
                    src={currentQuote.image} 
                    alt={currentQuote.name} 
                    className={styles.avatar}
                  />
                </div>
                
                <div className={styles.authorInfo}>
                  <div className={styles.expertName}>{currentQuote.name}</div>
                  <div className={styles.expertTitle}>{currentQuote.title}</div>
                  <div className={styles.quoteSource}>
                    <a href={currentQuote.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                      {currentQuote.source}, {currentQuote.year}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quote rotation indicators */}
            <div className={styles.quoteIndicators}>
              {EXPERT_QUOTES.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === currentQuoteIndex ? styles.activeIndicator : ''}`}
                  onClick={() => setCurrentQuoteIndex(index)}
                  aria-label={`View quote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Q&A: Who this is for */}
        <div className={styles.secondarySection}>
          <div className={styles.questionContent}>
            <div className={styles.questionSide}>
              <h3 className={styles.question}>
                Stop piecing together AI safety from scattered sources.
              </h3>
            </div>
            
            <div className={styles.answerSide}>
              <p className={styles.answerText}>
                Whether you're in policy, engineering, business, or academia—the Atlas gives you 
                the complete picture. We've structured the most important knowledge in the field 
                so you can build genuine understanding instead of collecting random facts from 
                scattered sources.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
