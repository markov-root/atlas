// src/components/Feedback/ChapterFeedback.jsx - Updated with footnote-style separator
import React, { useState, useEffect, useRef } from 'react';
import { ActionButtonTooltip } from '../UI/Tooltip';
import styles from './ChapterFeedback.module.css';

export default function ChapterFeedback({ 
  chapterNumber, 
  sectionNumber = null, 
  title,
  pathname,
  frontMatter = {}
}) {
  const [responses, setResponses] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determine if this is a conclusion section (chapter-level feedback)
  const isConclusion = frontMatter.section_type === 'conclusion' || 
                      title.toLowerCase().includes('conclusion') ||
                      pathname.endsWith('/conclusion') ||
                      pathname.endsWith('/conclusion/');
  
  // Don't show on introduction sections
  const isIntroduction = frontMatter.section_type === 'introduction' || 
                        title.toLowerCase().includes('introduction') ||
                        pathname.endsWith('/introduction') ||
                        pathname.endsWith('/introduction/') ||
                        pathname.match(/\/chapters\/\d+\/$/);

  useEffect(() => {
    const pageKey = `feedback_${chapterNumber}${sectionNumber ? `_${sectionNumber}` : ''}`;
    const submitted = localStorage.getItem(pageKey);
    if (submitted) {
      setIsSubmitted(true);
    }
  }, [chapterNumber, sectionNumber]);

  if (isIntroduction) return null;

  const pageType = sectionNumber ? 'section' : 'chapter';

  // Core questions (always shown)
  const coreQuestions = isConclusion ? [
    {
      key: 'overall_rating',
      label: 'How would you rate this entire chapter?',
      icon: 'quality.svg',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      tooltip: 'Consider overall quality, usefulness, and how well it achieved its goals'
    },
    {
      key: 'understanding',
      label: 'How well do you understand the material after reading this chapter?',
      icon: 'understanding.svg',
      lowLabel: 'Confused',
      highLabel: 'Crystal clear',
      tooltip: 'Rate your comprehension and confidence with the concepts covered'
    }
  ] : [
    {
      key: 'overall_rating',
      label: 'How would you rate this section?',
      icon: 'quality.svg',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      tooltip: 'Consider overall quality, usefulness, and how well it achieved its goals'
    },
    {
      key: 'understanding',
      label: 'How well do you understand this section\'s content?',
      icon: 'understanding.svg',
      lowLabel: 'Confused',
      highLabel: 'Crystal clear',
      tooltip: 'Rate your comprehension and confidence with the concepts covered'
    }
  ];

  // Detailed questions (shown when expanded)
  const detailQuestions = isConclusion ? [
    {
      key: 'writing_clarity',
      label: 'How clear and well-written was this chapter?',
      icon: 'clarity.svg',
      lowLabel: 'Hard to follow',
      highLabel: 'Very clear',
      tooltip: 'Rate the quality of explanations, examples, and overall writing style'
    },
    {
      key: 'conceptual_coherence',
      label: 'How well did the ideas in this chapter connect to other concepts?',
      icon: 'connections.svg',
      lowLabel: 'Disconnected',
      highLabel: 'Well integrated',
      tooltip: 'Did this chapter clearly link to other parts of the textbook and related ideas?'
    },
    {
      key: 'multimedia_desire',
      label: 'How much would more visuals and multimedia improve this chapter?',
      icon: 'multimedia.svg',
      lowLabel: 'Desperately needed',
      highLabel: 'Not needed',
      tooltip: 'Would diagrams, images, videos, or interactive elements significantly help?'
    },
    {
      key: 'reading_length',
      label: 'How was the length and pacing of this chapter?',
      icon: 'quality.svg',
      lowLabel: 'Too long/tedious',
      highLabel: 'Perfect length',
      tooltip: 'Was the chapter the right length for the concepts covered?'
    }
  ] : [
    {
      key: 'writing_clarity',
      label: 'How clear and accessible was the writing?',
      icon: 'clarity.svg',
      lowLabel: 'Hard to follow',
      highLabel: 'Very clear',
      tooltip: 'Rate the quality of explanations, examples, and overall writing style'
    },
    {
      key: 'conceptual_coherence',
      label: 'How well did the ideas in this section connect to other concepts?',
      icon: 'connections.svg',
      lowLabel: 'Isolated',
      highLabel: 'Well integrated',
      tooltip: 'Did this section clearly link to other parts of the textbook and related ideas?'
    },
    {
      key: 'multimedia_desire',
      label: 'How much would more visuals and multimedia improve this section?',
      icon: 'multimedia.svg',
      lowLabel: 'Desperately needed',
      highLabel: 'Not needed',
      tooltip: 'Would diagrams, images, videos, or interactive elements significantly help?'
    },
    {
      key: 'reading_length',
      label: 'How was the length and pacing of this section?',
      icon: 'quality.svg',
      lowLabel: 'Too long/tedious',
      highLabel: 'Perfect length',
      tooltip: 'Was the section the right length for the concepts covered?'
    }
  ];

  const handleSubmit = async () => {
    const canSubmitCore = coreQuestions.every(q => responses[q.key] !== undefined);
    if (!canSubmitCore) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const formData = {
        page_type: isConclusion ? 'chapter' : 'section',
        chapter_number: chapterNumber,
        section_number: sectionNumber || '',
        page_title: title,
        pathname: pathname,
        feedback_type: isConclusion ? 'chapter_conclusion' : 'section_targeted',
        has_detailed_feedback: showDetails && (detailQuestions.some(q => responses[q.key] !== undefined) || comments.trim()),
        comments: comments.trim() || '',
        content_version: frontMatter.content_version || '1.0',
        ...responses,
        submission_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        submission_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      };

      const response = await fetch('https://formspree.io/f/mdkzezkv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
        const pageKey = `feedback_${chapterNumber}${sectionNumber ? `_${sectionNumber}` : ''}`;
        localStorage.setItem(pageKey, 'true');
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const DragSlider = ({ question, value, onChange, disabled = false, isOptional = false }) => {
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(value);

    const handleInteraction = (clientX) => {
      if (!sliderRef.current || disabled) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(percentage * 10);
      
      setDragValue(newValue);
      if (!isDragging) {
        onChange(question.key, newValue);
      }
    };

    const handleMouseDown = (e) => {
      if (disabled) return;
      setIsDragging(true);
      handleInteraction(e.clientX);
    };

    const handleMouseMove = (e) => {
      if (!isDragging || disabled) return;
      handleInteraction(e.clientX);
    };

    const handleMouseUp = () => {
      if (isDragging && dragValue !== undefined) {
        onChange(question.key, dragValue);
      }
      setIsDragging(false);
    };

    const handleTouchStart = (e) => {
      if (disabled) return;
      setIsDragging(true);
      handleInteraction(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging || disabled) return;
      e.preventDefault();
      handleInteraction(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (isDragging && dragValue !== undefined) {
        onChange(question.key, dragValue);
      }
      setIsDragging(false);
    };

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };
      }
    }, [isDragging, dragValue]);

    const currentValue = isDragging ? dragValue : value;
    const percentage = currentValue !== undefined ? (currentValue / 10) * 100 : 0;

    return (
      <div className={styles.sliderQuestion}>
        <div className={styles.questionHeader}>
          <div className={styles.questionTitle}>
            <img src={`/img/feedback/${question.icon}`} alt="" className={styles.questionIcon} />
            <span className={styles.questionLabel}>
              {question.label}
              {isOptional && <span className={styles.optional}> (optional)</span>}
            </span>
          </div>
        </div>
        
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.sliderLabel}>{question.lowLabel}</span>
            <span className={styles.sliderLabel}>{question.highLabel}</span>
          </div>
          
          <div
            ref={sliderRef}
            className={`${styles.sliderTrack} ${disabled ? styles.disabled : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Threshold markers */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(mark => (
              <div 
                key={mark}
                className={styles.thresholdMark}
                style={{ left: `${(mark / 10) * 100}%` }}
              />
            ))}
            
            <div 
              className={styles.sliderFill}
              style={{ width: `${percentage}%` }}
            />
            
            {currentValue !== undefined && (
              <div 
                className={styles.sliderThumb}
                style={{ left: `${percentage}%` }}
              />
            )}
          </div>
          
          <div className={styles.sliderNumbers}>
            <span className={`${styles.sliderNumber} ${currentValue === 0 ? styles.active : ''}`}>
              0
            </span>
            
            <div className={styles.centerContent}>
              {currentValue !== undefined && (
                <span className={styles.ratingValue}>{currentValue}/10</span>
              )}
            </div>
            
            <span className={`${styles.sliderNumber} ${currentValue === 10 ? styles.active : ''}`}>
              10
            </span>
          </div>
        </div>
      </div>
    );
  };

  const canSubmitCore = coreQuestions.every(q => responses[q.key] !== undefined);

  if (isSubmitted) {
    return (
      <div className={styles.feedbackContainer}>
        {/* Footnote-style separator */}
        <div className={styles.separator}>
          <div className={styles.separatorLine}></div>
          <img 
            src="/img/logo_samples/01-test.svg" 
            alt="Atlas logo" 
            className={styles.separatorLogo}
          />
          <div className={styles.separatorLine}></div>
        </div>

        <div className={styles.thankYou}>
          <div className={styles.checkIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <h4>Thank you for your feedback!</h4>
            <p>Your input helps improve this {isConclusion ? 'chapter' : 'section'}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedbackContainer}>
      {/* Footnote-style separator */}
      <div className={styles.separator}>
        <div className={styles.separatorLine}></div>
        <img 
          src="/img/logo_samples/01-test.svg" 
          alt="Atlas logo" 
          className={styles.separatorLogo}
        />
        <div className={styles.separatorLine}></div>
      </div>

      <div className={styles.feedbackHeader}>
        <h3>
          {isConclusion 
            ? 'Chapter Feedback' 
            : 'Section Feedback'
          }
        </h3>
        <p>We consider this textbook a live project. Feedback helps us target our improvements.</p>
      </div>

      {/* Core Questions */}
      <div className={styles.coreSection}>
        {coreQuestions.map((question) => (
          <DragSlider
            key={question.key}
            question={question}
            value={responses[question.key]}
            onChange={(key, value) => setResponses(prev => ({ ...prev, [key]: value }))}
            disabled={isSubmitted}
          />
        ))}
      </div>

      {/* Comments Section - MOVED OUT OF DETAILS */}
      <div className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <img src="/img/feedback/comment.svg" alt="" className={styles.commentIcon} />
          <label className={styles.commentsLabel}>
            Additional feedback <span className={styles.optional}>(optional)</span>
          </label>
        </div>
        
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={`Some questions to think about:\n\nWhat background knowledge was missing? Which concepts should connect better? Where did you get confused? Any technical corrections?\n\nShare any other thoughts or suggestions...`}
          className={styles.commentsTextarea}
          rows="6"
          disabled={isSubmitted}
        />
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className={styles.detailsSection}>
          <div className={styles.detailsHeader}>
            <h4>Detailed feedback</h4>
            <button 
              className={styles.collapseButton}
              onClick={() => setShowDetails(false)}
            >
              <svg className={styles.collapseIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
          
          {detailQuestions.map((question) => (
            <DragSlider
              key={question.key}
              question={question}
              value={responses[question.key]}
              onChange={(key, value) => setResponses(prev => ({ ...prev, [key]: value }))}
              disabled={isSubmitted}
              isOptional={true}
            />
          ))}

          {/* Optional Contact Information */}
          <div className={styles.contactSection}>
            <div className={styles.contactHeader}>
              <h4>Contact information <span className={styles.optional}>(optional)</span></h4>
              <p>Feedback is 100% anonymous unless you want to help us follow up with you or understand the context better</p>
            </div>
            
            <div className={styles.contactFields}>
              <input
                type="text"
                placeholder="Your name"
                value={responses.contact_name || ''}
                onChange={(e) => setResponses(prev => ({ ...prev, contact_name: e.target.value }))}
                className={styles.contactInput}
                disabled={isSubmitted}
              />
              
              <input
                type="text"
                placeholder="University/Study Group"
                value={responses.contact_organization || ''}
                onChange={(e) => setResponses(prev => ({ ...prev, contact_organization: e.target.value }))}
                className={styles.contactInput}
                disabled={isSubmitted}
              />
              
              <input
                type="email"
                placeholder="Email address"
                value={responses.contact_email || ''}
                onChange={(e) => setResponses(prev => ({ ...prev, contact_email: e.target.value }))}
                className={styles.contactInput}
                disabled={isSubmitted}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Action Buttons - Side by Side */}
      <div className={styles.actionButtons}>
        {!showDetails && (
          <button 
            className={styles.detailsButton}
            onClick={() => setShowDetails(true)}
          >
            <svg className={styles.detailsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
            Detailed feedback
          </button>
        )}
        
        <button 
          className={`${styles.submitButton} ${!canSubmitCore ? styles.disabled : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmitCore || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit feedback'}
        </button>
      </div>
    </div>
  );
}
