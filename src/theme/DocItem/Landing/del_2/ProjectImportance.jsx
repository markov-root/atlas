// src/theme/DocItem/Landing/ProjectImportance.jsx
import React from 'react';
import styles from './ProjectImportance.module.css';

export default function ProjectImportance() {
  return (
    <div className={styles.importanceContainer}>
      <div className={styles.importanceContent}>
        
        {/* Section Header */}
        <div className={styles.headerSection}>
          <h2 className={styles.question}>
            Why do you need to understand AI Safety?
          </h2>
          
          <p className={styles.contextText}>
            We're living through the most consequential technological transition in human history. 
            AI systems are rapidly approaching and potentially surpassing human capabilities across 
            domains that were unthinkable just years ago. The people who built these systems—the 
            most cited researchers in the field—are now sounding urgent warnings about the path ahead.
          </p>
          
          <p className={styles.contextText}>
            Whether you're a policymaker shaping regulations, an engineer building AI systems, 
            a business leader deploying these technologies, or simply someone who wants to understand 
            the forces reshaping our world—you need to act on information that's currently scattered 
            across hundreds of research papers, blog posts, and technical discussions.
          </p>
          
          <p className={styles.contextText}>
            <strong>That's why we created the AI Safety Atlas.</strong> We transform this scattered 
            knowledge into systematic explanations with clear, connected pathways through complex research. 
            Instead of spending months piecing together the landscape, you can understand the critical 
            challenges and solutions that will determine whether advanced AI becomes humanity's greatest 
            tool or greatest threat.
          </p>
        </div>
        
        {/* Expert Quotes in testimonial style */}
        <div className={styles.quotesGrid}>
          
          <div className={styles.quoteCard}>
            <div className={styles.quoteHeader}>
              <img 
                src="/img/quotes/yoshua_bengio.jpg" 
                alt="Yoshua Bengio" 
                className={styles.expertPhoto}
              />
              <div className={styles.expertInfo}>
                <div className={styles.expertName}>Yoshua Bengio</div>
                <div className={styles.expertTitle}>Most cited computer scientist globally (946,428 citations), Turing Award Winner 2018, Scientific Director of Mila</div>
              </div>
            </div>
            <blockquote className={styles.expertQuote}>
              "We have agency. It's not too late to steer the evolution of societies and humanity in a positive and beneficial direction. But for that, we need enough people who understand both the advantages and the risks, and we need enough people to work on the solutions. And the solutions can be technological, they could be political... policy, but we need enough effort in those directions right now."
            </blockquote>
            <div className={styles.quoteMeta}>
              <span className={styles.quoteDate}>2024</span>
              <a href="https://www.cnbc.com/2024/11/21/will-ai-replace-humans-yoshua-bengio-warns-of-artificial-intelligence-risks.html" target="_blank" rel="noopener noreferrer" className={styles.quoteSource}>
                CNBC Interview
              </a>
            </div>
          </div>
          
          <div className={styles.quoteCard}>
            <div className={styles.quoteHeader}>
              <img 
                src="/img/quotes/geoffrey_hinton.jpg" 
                alt="Geoffrey Hinton" 
                className={styles.expertPhoto}
              />
              <div className={styles.expertInfo}>
                <div className={styles.expertName}>Geoffrey Hinton</div>
                <div className={styles.expertTitle}>Second most cited computer scientist (927,095 citations), Turing Award Winner 2018, "Godfather of AI"</div>
              </div>
            </div>
            <blockquote className={styles.expertQuote}>
              "We're entering a period of great uncertainty where we're dealing with things we've never dealt with before. And normally, the first time you deal with something totally novel, you get it wrong. And we can't afford to get it wrong with these things."
            </blockquote>
            <div className={styles.quoteMeta}>
              <span className={styles.quoteDate}>2023</span>
              <a href="https://www.cbsnews.com/news/geoffrey-hinton-ai-dangers-60-minutes-transcript/" target="_blank" rel="noopener noreferrer" className={styles.quoteSource}>
                CBS 60 Minutes Interview
              </a>
            </div>
          </div>
          
          <div className={styles.quoteCard}>
            <div className={styles.quoteHeader}>
              <img 
                src="/img/quotes/ilya_sutskever.jpg" 
                alt="Ilya Sutskever" 
                className={styles.expertPhoto}
              />
              <div className={styles.expertInfo}>
                <div className={styles.expertName}>Ilya Sutskever</div>
                <div className={styles.expertTitle}>Co-Founder and Chief Scientist at Safe Superintelligence Inc. (642,750 citations), former Chief Scientist at OpenAI</div>
              </div>
            </div>
            <blockquote className={styles.expertQuote}>
              "It's obviously important that any superintelligence anyone builds does not go rogue. Obviously... I'm doing it for my own self-interest. It's an unsolved problem."
            </blockquote>
            <div className={styles.quoteMeta}>
              <span className={styles.quoteDate}>2023</span>
              <a href="https://www.technologyreview.com/2023/10/26/1082398/exclusive-ilya-sutskever-openais-chief-scientist-on-his-hopes-and-fears-for-the-future-of-ai/" target="_blank" rel="noopener noreferrer" className={styles.quoteSource}>
                MIT Technology Review
              </a>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
