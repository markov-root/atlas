// src/components/Courses/SimpleCoursesListing.jsx
// Updated to use centralized labels from courses-metadata.json for translation
import React, { useState } from 'react';
import { SmallTooltip } from '../UI/Tooltip';
import { MapPin, Users, Calendar, Globe, Mail, FileText, Edit3 } from 'lucide-react';
import styles from './SimpleCoursesListing.module.css';

function getStatusFromDates(startDate, endDate) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (!start) return 'upcoming';
  
  if (now < start) return 'upcoming';
  if (end && now > end) return 'completed';
  return 'active';
}

function StatusBadge({ status, labels }) {
  const statusConfig = {
    active: { label: labels.statusBadges.active, color: 'green' },
    upcoming: { label: labels.statusBadges.upcoming, color: 'blue' },
    completed: { label: labels.statusBadges.completed, color: 'gray' }
  };
  
  const config = statusConfig[status] || statusConfig.completed;
  
  return (
    <span className={`${styles.statusBadge} ${styles[config.color]}`}>
      {config.label}
    </span>
  );
}

function CorrectionForm({ course, organization, onClose, onSubmit, labels }) {
  const formLabels = labels.correctionForm;
  const placeholders = formLabels.placeholders;
  
  // Store original values for comparison (using new schema)
  const originalData = {
    organizationName: organization.name,
    description: course.description,
    location: course.location || '',
    startDate: course.startDate || '',
    endDate: course.endDate || '',
    enrolled: course['students-enrolled'] || '',
    applicationLink: course.links?.studentApplication || '',
    websiteLink: organization.website || '',
    contactEmail: course.links?.contact || organization.contact || ''
  };

  const [formData, setFormData] = useState({
    ...originalData,
    additionalInfo: '',
    requestRemoval: false
  });

  // Track what changed
  const getChanges = () => {
    const changes = [];
    
    if (formData.organizationName !== originalData.organizationName) {
      changes.push(`Organization Name: "${originalData.organizationName}" → "${formData.organizationName}"`);
    }
    if (formData.description !== originalData.description) {
      changes.push(`Description: "${originalData.description}" → "${formData.description}"`);
    }
    if (formData.location !== originalData.location) {
      changes.push(`Location: "${originalData.location}" → "${formData.location}"`);
    }
    if (formData.startDate !== originalData.startDate) {
      changes.push(`Start Date: "${originalData.startDate}" → "${formData.startDate}"`);
    }
    if (formData.endDate !== originalData.endDate) {
      changes.push(`End Date: "${originalData.endDate}" → "${formData.endDate}"`);
    }
    if (formData.enrolled !== originalData.enrolled) {
      changes.push(`Enrolled: "${originalData.enrolled}" → "${formData.enrolled}"`);
    }
    if (formData.applicationLink !== originalData.applicationLink) {
      changes.push(`Application Link: "${originalData.applicationLink}" → "${formData.applicationLink}"`);
    }
    if (formData.websiteLink !== originalData.websiteLink) {
      changes.push(`Website Link: "${originalData.websiteLink}" → "${formData.websiteLink}"`);
    }
    if (formData.contactEmail !== originalData.contactEmail) {
      changes.push(`Contact Email: "${originalData.contactEmail}" → "${formData.contactEmail}"`);
    }
    
    return changes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const changes = getChanges();
    
    try {
      const response = await fetch('https://formspree.io/f/mzzvplbl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: course.id,
          courseName: course.name || organization.name,
          organizationName: organization.name,
          changes: changes,
          formData: formData,
          requestRemoval: formData.requestRemoval
        })
      });

      if (response.ok) {
        onSubmit();
      } else {
        alert('Failed to submit correction. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting correction:', error);
      alert('Error submitting correction. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className={styles.correctionFormContainer}>
      <form onSubmit={handleSubmit} className={styles.correctionForm}>
        <div className={styles.correctionFormHeader}>
          <h4>{formLabels.title}</h4>
          <p>{formLabels.subtitle}</p>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.organizationName}
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.location}
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={styles.correctionFormControl}
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={styles.correctionFormControl}
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="number"
              name="enrolled"
              value={formData.enrolled}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.enrolled}
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.contactEmail}
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="url"
              name="applicationLink"
              value={formData.applicationLink}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.applicationLink}
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="url"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.website}
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.description}
              rows="2"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder={placeholders.additionalInfo}
              rows="2"
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--atlas-text, #212529)' }}>
              <input
                type="checkbox"
                name="requestRemoval"
                checked={formData.requestRemoval}
                onChange={handleChange}
              />
              {formLabels.requestRemoval}
            </label>
          </div>
        </div>

        <div className={styles.correctionFormActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.correctionCancelButton}
          >
            {labels.buttons.cancel}
          </button>
          <button
            type="submit"
            className={styles.correctionSubmitButton}
          >
            {labels.buttons.sendCorrection}
          </button>
        </div>
      </form>
    </div>
  );
}

function CourseCard({ course, organization, labels }) {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };

  const status = getStatusFromDates(course.startDate, course.endDate);
  const logoSrc = organization.logo || '/img/courses/placeholder_courses.svg';
  
  // Get student counts from new schema
  const enrolled = course['students-enrolled'];
  const expected = course['students-expected'];
  const completed = course['students-completed'];
  const applied = course['students-applied'];
  
  // Determine which count to show
  const hasStudentData = enrolled || expected || applied;
  
  // Get count labels
  const countLabels = labels.studentCounts;

  const handleCorrectionSubmit = () => {
    setCorrectionSubmitted(true);
    setShowCorrectionForm(false);
    // Reset after 3 seconds
    setTimeout(() => setCorrectionSubmitted(false), 3000);
  };

  if (correctionSubmitted) {
    return (
      <div className={styles.courseCard}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: 'var(--atlas-success, #2b8a3e)',
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          ✓ {labels.correctionForm.successMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.courseCard}>
      {/* Line 1: Logo + Name + Status */}
      <div className={styles.headerLine}>
        <div className={styles.logoAndName}>
          <div className={styles.logoSection}>
            <img 
              src={logoSrc}
              alt={`${organization.name} logo`}
              className={styles.courseLogo}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/courses/placeholder_courses.svg';
              }}
            />
          </div>
          <h3 className={styles.organizationName}>{organization.name}</h3>
        </div>
        <StatusBadge status={status} labels={labels} />
      </div>

      {/* Line 2: Description + Metadata */}
      <div className={styles.detailsLine}>
        <p className={styles.courseDescription}>{course.description}</p>
        
        <div className={styles.metadata}>
          {course.location && (
            <div className={styles.metaItem}>
              <MapPin size={14} />
              <span>{course.location}</span>
            </div>
          )}
          
          {(course.startDate || course.endDate) && (
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>
                {formatDate(course.startDate) || 'TBD'} - {formatDate(course.endDate) || 'TBD'}
              </span>
            </div>
          )}
          
          {hasStudentData && (
            <div className={styles.metaItem}>
              <Users size={14} />
              <span>
                {enrolled 
                  ? `${enrolled} ${countLabels.enrolled}` 
                  : expected 
                    ? `~${expected} ${countLabels.expected}` 
                    : `${applied} ${countLabels.applied}`}
                {completed && ` • ${completed} ${countLabels.completed}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Line 3: Action Buttons */}
      <div className={styles.actionsLine}>
        {/* Student Application - only show if link exists and not completed */}
        {course.links?.studentApplication && status !== 'completed' && (
          <button
            onClick={() => window.open(course.links.studentApplication, '_blank')}
            className={styles.actionButton}
          >
            <FileText size={16} />
            <span>{labels.buttons.applyStudent}</span>
          </button>
        )}
        
        {/* Facilitator Application - only show if link exists and not completed */}
        {course.links?.facilitatorApplication && status !== 'completed' && (
          <button
            onClick={() => window.open(course.links.facilitatorApplication, '_blank')}
            className={styles.actionButton}
          >
            <Users size={16} />
            <span>{labels.buttons.applyFacilitator}</span>
          </button>
        )}
        
        {organization.website && (
          <button
            onClick={() => window.open(organization.website, '_blank')}
            className={styles.actionButton}
          >
            <Globe size={16} />
            <span>{labels.buttons.website}</span>
          </button>
        )}
        
        {(course.links?.contact || organization.contact) && (
          <button
            onClick={() => window.open(`mailto:${course.links?.contact || organization.contact}`, '_blank')}
            className={styles.actionButton}
          >
            <Mail size={16} />
            <span>{labels.buttons.contact}</span>
          </button>
        )}

        <button
          onClick={() => setShowCorrectionForm(!showCorrectionForm)}
          className={styles.suggestButton}
        >
          <Edit3 size={14} />
          <span>{labels.buttons.suggestCorrection}</span>
        </button>
      </div>

      {/* Correction Form */}
      {showCorrectionForm && (
        <CorrectionForm
          course={course}
          organization={organization}
          onClose={() => setShowCorrectionForm(false)}
          onSubmit={handleCorrectionSubmit}
          labels={labels}
        />
      )}
    </div>
  );
}

function CoursesSection({ title, courses, description, sectionType, labels }) {
  if (!courses || courses.length === 0) return null;

  return (
    <div className={styles.coursesSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description && (
          <p className={styles.sectionDescription}>{description}</p>
        )}
      </div>
      
      <div className={styles.coursesList}>
        {courses.map(courseData => (
          <CourseCard 
            key={courseData.course.id} 
            course={courseData.course} 
            organization={courseData.organization}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
}

export default function SimpleCoursesListing({ coursesData }) {
  const labels = coursesData.metadata?.labels || coursesData.labels;
  const sections = coursesData.metadata?.sections || coursesData.sections;
  
  if (!coursesData || !coursesData.organizations) {
    return (
      <div className={styles.emptyState}>
        <Calendar size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>{labels.emptyState.title}</h3>
        <p className={styles.emptyText}>
          {labels.emptyState.description}
        </p>
      </div>
    );
  }

  // Flatten all courses with their organizations and calculate status
  const allCourses = [];
  coursesData.organizations.forEach(org => {
    if (org.courses) {
      org.courses.forEach(course => {
        const status = getStatusFromDates(course.startDate, course.endDate);
        allCourses.push({
          course,
          organization: org,
          status,
          sortDate: new Date(course.startDate || course.endDate || '1970-01-01')
        });
      });
    }
  });

  // Sort courses by relevance: active -> upcoming -> completed (by date)
  allCourses.sort((a, b) => {
    const statusPriority = { active: 3, upcoming: 2, completed: 1 };
    const priorityA = statusPriority[a.status] || 0;
    const priorityB = statusPriority[b.status] || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    if (a.status === 'completed') {
      return b.sortDate - a.sortDate;
    } else {
      return a.sortDate - b.sortDate;
    }
  });

  // Group courses by status
  const activeCourses = allCourses.filter(c => c.status === 'active');
  const upcomingCourses = allCourses.filter(c => c.status === 'upcoming');
  const completedCourses = allCourses.filter(c => c.status === 'completed');

  return (
    <div className={styles.coursesContainer}>
      <CoursesSection 
        title={sections.active.title}
        courses={activeCourses}
        description={sections.active.description}
        sectionType="active"
        labels={labels}
      />
      
      <CoursesSection 
        title={sections.upcoming.title}
        courses={upcomingCourses}
        description={sections.upcoming.description}
        sectionType="upcoming"
        labels={labels}
      />
      
      <CoursesSection 
        title={sections.completed.title}
        courses={completedCourses}
        description={sections.completed.description}
        sectionType="completed"
        labels={labels}
      />
    </div>
  );
}
