// src/components/Courses/CourseDetailModal.jsx
import React from 'react';
import styles from './CourseDetailModal.module.css';
import { X, Calendar, Users, MapPin, FileText, ExternalLink, Mail } from 'lucide-react';

export default function CourseDetailModal({ course, onClose }) {
  if (!course) return null;

  // Format dates
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "Date not specified";
    }
  };

  // Check if logo exists, otherwise use placeholder
  const logoSrc = course.logo || '/img/courses/placeholder_courses.svg';

  // Handle the modal click safely
  const handleModalContentClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={handleModalContentClick}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close details">
          <X size={24} />
        </button>

        <div className={styles.courseHeader}>
          <div className={styles.headerContent}>
            <span className={styles.typeTag}>{course.type || "Course"}</span>
            <h2 className={styles.courseTitle}>{course.name}</h2>
            <div className={styles.organization}>{course.organization}</div>
          </div>
          
          <div className={styles.logoContainer}>
            <img 
              src={logoSrc} 
              alt={`${course.organization} logo`} 
              className={styles.courseLogo}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
        </div>

        <div className={styles.courseInfo}>
          <div className={styles.infoGrid}>
            {course.startDate && course.endDate && (
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Calendar size={20} />
                </div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoTitle}>Dates</h3>
                  <p className={styles.infoValue}>
                    {formatDate(course.startDate)} - {formatDate(course.endDate)}
                  </p>
                </div>
              </div>
            )}
            
            {course.students && (
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Users size={20} />
                </div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoTitle}>Enrollment</h3>
                  <p className={styles.infoValue}>{course.students} students</p>
                </div>
              </div>
            )}
            
            {course.location && (
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <MapPin size={20} />
                </div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoTitle}>Location</h3>
                  <p className={styles.infoValue}>{course.location}</p>
                </div>
              </div>
            )}
            
            {course.format && (
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <FileText size={20} />
                </div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoTitle}>Format</h3>
                  <p className={styles.infoValue}>{course.format}</p>
                </div>
              </div>
            )}
          </div>

          {course.description && (
            <div className={styles.contentSection}>
              <h3 className={styles.sectionTitle}>About This Course</h3>
              <div className={styles.courseDescription}>
                {course.description}
              </div>
            </div>
          )}

          {course.curriculum && course.curriculum.length > 0 && (
            <div className={styles.contentSection}>
              <h3 className={styles.sectionTitle}>Curriculum</h3>
              <ul className={styles.curriculumList}>
                {course.curriculum.map((item, index) => (
                  <li key={index} className={styles.curriculumItem}>
                    <span className={styles.curriculumNumber}>{index + 1}</span>
                    <span className={styles.curriculumText}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.registrationSection}>
            <h3 className={styles.sectionTitle}>Registration</h3>
            <p className={styles.registrationInfo}>
              {course.registrationInfo || "For more information about registration, please contact the course organizers directly."}
            </p>
            
            <div className={styles.actionButtons}>
              {course.registrationLink && (
                <a 
                  href={course.registrationLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.registrationButton}
                >
                  Register Now
                  <ExternalLink size={16} className={styles.buttonIcon} />
                </a>
              )}
              
              {course.contactEmail && (
                <a 
                  href={`mailto:${course.contactEmail}`} 
                  className={styles.contactButton}
                >
                  Contact Organizers
                  <Mail size={16} className={styles.buttonIcon} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
