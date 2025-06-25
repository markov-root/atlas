// src/components/Courses/CoursesList.jsx
import React from 'react';
import { SmallTooltip } from '../UI/Tooltip';
import styles from './CoursesList.module.css';

function CourseRow({ course }) {
  // Format dates
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString || "—";
    }
  };

  // Check if logo exists, otherwise use placeholder
  const logoSrc = course.logo || '/img/courses/placeholder_courses.svg';

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (course.website) {
      window.open(course.website, '_blank');
    }
  };

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (course.applicationLink) {
      window.open(course.applicationLink, '_blank');
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    if (course.contactEmail) {
      window.open(`mailto:${course.contactEmail}`, '_blank');
    }
  };

  return (
    <div className={styles.courseRow}>
      {/* Organization Logo - clickable to org website */}
      <SmallTooltip content={course.website ? `Visit ${course.name} website` : course.name}>
        <div className={styles.logoContainer} onClick={handleLogoClick}>
          <img 
            src={logoSrc}
            alt={`${course.name} logo`}
            className={styles.orgLogo}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/img/courses/placeholder_courses.svg';
            }}
          />
        </div>
      </SmallTooltip>

      {/* Start Date */}
      <div className={styles.startDateColumn}>
        {course.startDate ? formatDate(course.startDate) : "—"}
      </div>

      {/* End Date */}
      <div className={styles.endDateColumn}>
        {course.endDate ? formatDate(course.endDate) : "—"}
      </div>

      {/* Location */}
      <div className={styles.locationColumn}>
        {course.location ? (
          <div className={styles.columnContent}>
            <img src="/img/icons/location.svg" alt="" className={styles.columnIcon} />
            <span>{course.location}</span>
          </div>
        ) : (
          <span className={styles.columnEmpty}>—</span>
        )}
      </div>

      {/* Apply Button */}
      <div className={styles.applyColumn}>
        {course.applicationLink ? (
          <SmallTooltip content="Apply to this course">
            <button 
              className={styles.applyButton}
              onClick={handleApplyClick}
              title="Apply"
            >
              <img src="/img/icons/apply.svg" alt="Apply" className={styles.buttonIcon} />
            </button>
          </SmallTooltip>
        ) : (
          <span className={styles.columnEmpty}>—</span>
        )}
      </div>

      {/* Contact Button */}
      <div className={styles.contactColumn}>
        {course.contactEmail ? (
          <SmallTooltip content="Contact course organizers">
            <button 
              className={styles.contactButton}
              onClick={handleContactClick}
              title="Contact"
            >
              <img src="/img/icons/contact.svg" alt="Contact" className={styles.buttonIcon} />
            </button>
          </SmallTooltip>
        ) : (
          <span className={styles.columnEmpty}>—</span>
        )}
      </div>
    </div>
  );
}

export default function CoursesList({ courses }) {
  if (!courses || courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <img src="/img/icons/calendar.svg" alt="" width="48" height="48" />
        </div>
        <h3 className={styles.emptyTitle}>No Courses Available</h3>
        <p className={styles.emptyText}>
          No courses are currently listed. Check back later or consider starting your own course.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.coursesContainer}>
      {/* Header */}
      <div className={styles.coursesHeader}>
        <div className={styles.logoCol}>Organization</div>
        <div className={styles.startDateCol}>Start Date</div>
        <div className={styles.endDateCol}>End Date</div>
        <div className={styles.locationCol}>Location</div>
        <div className={styles.applyCol}>Apply</div>
        <div className={styles.contactCol}>Contact</div>
      </div>

      {/* Course Rows */}
      <div className={styles.coursesList}>
        {courses.map(course => (
          <CourseRow key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
