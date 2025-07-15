// src/components/Courses/StartCourseSection.jsx - Final version with improved messaging
import React, { useState } from 'react';
import styles from './StartCourseSection.module.css';

export default function StartCourseSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    location: '',
    expectedParticipants: '',
    startDate: '',
    endDate: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://formspree.io/f/myzpgaor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          _replyto: formData.email,
          _subject: `New Course Organizer: ${formData.name} - ${formData.location}`,
          form_type: 'course_organizer'
        })
      });

      if (response.ok) {
        setStatus('sent');
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          organization: '',
          location: '',
          expectedParticipants: '',
          startDate: '',
          endDate: '',
          message: ''
        });
        
        // Clear the status after 5 seconds
        setTimeout(() => setStatus(''), 5000);
      } else {
        throw new Error('Failed to send information');
      }
    } catch (error) {
      console.error('Error sending information:', error);
      setStatus('error');
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (status === 'sent') {
    return (
      <div className={styles.startCourseSection}>
        <div className={styles.startCourseContainer}>
          <div className={styles.successMessage}>
            <div className={styles.checkIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3>Thank You!</h3>
            <p>We're excited to support your course and will be in touch soon with resources and next steps.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.startCourseSection}>
      <div className={styles.startCourseContainer}>
        <div className={styles.startCourseCard}>
          
          {/* Left Side - Information */}
          <div className={styles.leftSide}>
            <h2 className={styles.startCourseTitle}>Start Your Own Course</h2>
            <p className={styles.startCourseDescription}>
              Ready to bring AI safety education to your community? We're here to support you every step of the way.
            </p>
            
            <div className={styles.resourcesList}>
              <div className={styles.resource}>
                <img 
                  src="/img/icons/book.svg" 
                  alt="" 
                  className={styles.resourceIcon} 
                />
                <span>Open source textbook & materials</span>
              </div>
              <div className={styles.resource}>
                <img 
                  src="/img/icons/teach.svg" 
                  alt="" 
                  className={styles.resourceIcon} 
                />
                <span>Public facilitation guides & instructor resources</span>
              </div>
              <div className={styles.resource}>
                <img 
                  src="/img/icons/acknowledgements.svg" 
                  alt="" 
                  className={styles.resourceIcon} 
                />
                <span>French Center for AI Safety (CeSIA) + Atlas co-branded certificates for your participants</span>
              </div>
              <div className={styles.resource}>
                <img 
                  src="/img/icons/settings.svg" 
                  alt="" 
                  className={styles.resourceIcon} 
                />
                <span>Support for custom curriculum design for your needs</span>
              </div>
              <div className={styles.resource}>
                <img 
                  src="/img/icons/support.svg" 
                  alt="" 
                  className={styles.resourceIcon} 
                />
                <span>Any other help we can provide :)</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className={styles.rightSide}>
            <h3 className={styles.formTitle}>Tell Us About Your Course</h3>
            <p className={styles.formSubtitle}>Share your plans and we'll help you get started</p>

            <form onSubmit={handleSubmit} className={styles.courseForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.formControl}
                    placeholder="Your name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.formControl}
                    placeholder="Your email"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className={styles.formControl}
                    placeholder="University/Organization (optional)"
                  />
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={styles.formControl}
                    placeholder="Location (city, country)"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="number"
                    name="expectedParticipants"
                    value={formData.expectedParticipants}
                    onChange={handleChange}
                    className={styles.formControl}
                    placeholder="Expected participants (optional)"
                    min="1"
                    max="1000"
                  />
                </div>

                <div className={styles.formGroup}>
                  {/* Empty space for alignment */}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={styles.formControl}
                    title="Planned start date (optional)"
                  />
                  <label className={styles.dateLabel}>Start date (optional)</label>
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={styles.formControl}
                    title="Planned end date (optional)"
                  />
                  <label className={styles.dateLabel}>End date (optional)</label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="3"
                  className={styles.formControl}
                  placeholder="Tell us about your audience, format preferences, or any specific support you'd like (optional)"
                />
              </div>

              {status === 'error' && (
                <div className={styles.errorMessage}>
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button 
                type="submit" 
                className={`${styles.submitButton} ${status === 'sending' ? styles.sending : ''}`}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
