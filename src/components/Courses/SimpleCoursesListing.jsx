// src/components/Courses/SimpleCoursesListing.jsx - Minimal style matching your aesthetic
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

function StatusBadge({ status }) {
  const statusConfig = {
    active: { label: 'Active', color: 'green' },
    upcoming: { label: 'Upcoming', color: 'blue' },
    completed: { label: 'Completed', color: 'gray' }
  };
  
  const config = statusConfig[status] || statusConfig.completed;
  
  return (
    <span className={`${styles.statusBadge} ${styles[config.color]}`}>
      {config.label}
    </span>
  );
}

function CorrectionForm({ course, organization, onClose, onSubmit }) {
  // Store original values for comparison
  const originalData = {
    organizationName: organization.name,
    description: course.description,
    location: course.location || '',
    startDate: course.startDate || '',
    endDate: course.endDate || '',
    participants: course.participants || course.estimatedParticipants || '',
    applicationLink: course.applicationLink || '',
    websiteLink: organization.website || '',
    contactEmail: organization.primaryContact || ''
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
    if (formData.participants !== originalData.participants) {
      changes.push(`Participants: "${originalData.participants}" → "${formData.participants}"`);
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
          // Current data
          organizationName: formData.organizationName,
          description: formData.description,
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
          participants: formData.participants,
          applicationLink: formData.applicationLink,
          websiteLink: formData.websiteLink,
          contactEmail: formData.contactEmail,
          additionalInfo: formData.additionalInfo,
          requestRemoval: formData.requestRemoval,
          
          // Original data for reference
          original_organizationName: originalData.organizationName,
          original_description: originalData.description,
          original_location: originalData.location,
          original_startDate: originalData.startDate,
          original_endDate: originalData.endDate,
          original_participants: originalData.participants,
          original_applicationLink: originalData.applicationLink,
          original_websiteLink: originalData.websiteLink,
          original_contactEmail: originalData.contactEmail,
          
          // Summary of changes for easy review
          changes_summary: changes.length > 0 ? changes.join('\n') : 'No field changes, see additional info',
          number_of_changes: changes.length,
          
          // Metadata
          courseId: course.id,
          _subject: `Course Correction: ${originalData.organizationName} (${changes.length} changes)`,
          form_type: 'course_correction'
        })
      });

      if (response.ok) {
        onSubmit();
      } else {
        throw new Error('Failed to submit correction');
      }
    } catch (error) {
      console.error('Error submitting correction:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className={styles.correctionForm}>
      <h4>Suggest Correction</h4>
      <form onSubmit={handleSubmit}>
        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Organization name"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Location"
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
              placeholder="Start date"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="End date"
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="number"
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Participants"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="url"
              name="applicationLink"
              value={formData.applicationLink}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Application link"
            />
          </div>
        </div>

        <div className={styles.correctionFormRow}>
          <div className={styles.correctionFormGroup}>
            <input
              type="url"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Website link"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Contact email"
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
              placeholder="Description"
              rows="2"
            />
          </div>
          <div className={styles.correctionFormGroup}>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              className={styles.correctionFormControl}
              placeholder="Additional information or corrections"
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
              Request to remove this listing entirely
            </label>
          </div>
        </div>

        <div className={styles.correctionFormActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.correctionCancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.correctionSubmitButton}
          >
            Send Correction
          </button>
        </div>
      </form>
    </div>
  );
}

function CourseCard({ course, organization }) {
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
  const enrolledCount = course.enrolled || course.estimatedParticipants; // fallback for existing data
  
  // Determine if apply button should be active (not completed + has application link)
  const canApplyStudent = status !== 'completed' && course.studentApplicationLink;

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
          ✓ Correction submitted. Thank you for helping us keep information accurate!
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
        <StatusBadge status={status} />
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
          
          {enrolledCount && (
            <div className={styles.metaItem}>
              <Users size={14} />
              <span>
                {course.enrolled ? `${course.enrolled} enrolled` : `~${course.estimatedParticipants} expected`}
                {course.completed && ` • ${course.completed} completed`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Line 3: Action Buttons */}
      <div className={styles.actionsLine}>
        {/* Student Application - only show if link exists and not completed */}
        {course.studentApplicationLink && status !== 'completed' && (
          <button
            onClick={() => window.open(course.studentApplicationLink, '_blank')}
            className={styles.actionButton}
          >
            <FileText size={16} />
            <span>Apply as Student</span>
          </button>
        )}
        
        {/* Facilitator Application - only show if link exists and not completed */}
        {course.facilitatorApplicationLink && status !== 'completed' && (
          <button
            onClick={() => window.open(course.facilitatorApplicationLink, '_blank')}
            className={styles.actionButton}
          >
            <Users size={16} />
            <span>Apply as Facilitator</span>
          </button>
        )}
        
        {organization.website && (
          <button
            onClick={() => window.open(organization.website, '_blank')}
            className={styles.actionButton}
          >
            <Globe size={16} />
            <span>Website</span>
          </button>
        )}
        
        {organization.primaryContact && (
          <button
            onClick={() => window.open(`mailto:${organization.primaryContact}`, '_blank')}
            className={styles.actionButton}
          >
            <Mail size={16} />
            <span>Contact</span>
          </button>
        )}

        <button
          onClick={() => setShowCorrectionForm(!showCorrectionForm)}
          className={styles.suggestButton}
        >
          <Edit3 size={14} />
          <span>Suggest Correction</span>
        </button>
      </div>

      {/* Correction Form */}
      {showCorrectionForm && (
        <CorrectionForm
          course={course}
          organization={organization}
          onClose={() => setShowCorrectionForm(false)}
          onSubmit={handleCorrectionSubmit}
        />
      )}
    </div>
  );
}

function CoursesSection({ title, courses, description, sectionType }) {
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
          />
        ))}
      </div>
    </div>
  );
}

export default function SimpleCoursesListing({ coursesData }) {
  if (!coursesData || !coursesData.organizations) {
    return (
      <div className={styles.emptyState}>
        <Calendar size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No Courses Available</h3>
        <p className={styles.emptyText}>
          No courses are currently listed. Check back later or consider starting your own course.
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
        title="Current Courses" 
        courses={activeCourses}
        description="Courses currently accepting students or in progress"
        sectionType="active"
      />
      
      <CoursesSection 
        title="Upcoming Courses" 
        courses={upcomingCourses}
        description="Future courses with applications opening soon"
        sectionType="upcoming"
      />
      
      <CoursesSection 
        title="Past Courses" 
        courses={completedCourses}
        description="Successfully completed courses using Atlas materials"
        sectionType="completed"
      />
    </div>
  );
}
