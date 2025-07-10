// src/components/FAQ/FAQItem.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Link } from 'lucide-react';
import styles from './FAQItem.module.css';

export default function FAQItem({ id, question, shortAnswer, detailedAnswer, isExpanded: initialExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  // Check if this question should be expanded based on URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1); // Remove #
      if (hash === id) {
        setIsExpanded(true);
        // Scroll to this question after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [id]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    
    // Update URL hash when expanding
    if (!isExpanded && typeof window !== 'undefined') {
      window.history.pushState(null, null, `#${id}`);
    }
  };

  const copyLinkToClipboard = async (e) => {
    e.stopPropagation(); // Prevent the question from toggling
    
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      
      try {
        await navigator.clipboard.writeText(url);
        setShowCopyFeedback(true);
        
        // Hide feedback after 2 seconds
        setTimeout(() => setShowCopyFeedback(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
      }
    }
  };

  return (
    <div className={`${styles.faqItem} ${isExpanded ? styles.expanded : ''}`} id={id}>
      {/* Question Header */}
      <button 
        className={styles.questionButton}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className={styles.questionContent}>
          <h3 className={styles.questionText}>{question}</h3>
          <div className={styles.questionActions}>
            {/* Copy Link Button */}
            <button
              className={styles.copyLinkButton}
              onClick={copyLinkToClipboard}
              title="Copy link to this question"
              aria-label="Copy link to this question"
            >
              <Link size={16} />
              {showCopyFeedback && (
                <span className={styles.copyFeedback}>Copied!</span>
              )}
            </button>
            
            {/* Expand Icon */}
            <div className={styles.expandIcon}>
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
        </div>
      </button>

      {/* Answer Content - Show both short and detailed when expanded */}
      {isExpanded && (
        <div className={styles.answerContent}>
          {/* Short Answer */}
          <div className={styles.shortAnswer}>
            {shortAnswer}
          </div>

          {/* Detailed Answer - No toggle, show directly */}
          {detailedAnswer && (
            <div className={styles.detailedAnswer}>
              {detailedAnswer.split('\n\n').map((paragraph, index) => (
                <p key={index} dangerouslySetInnerHTML={{ 
                  __html: paragraph.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
