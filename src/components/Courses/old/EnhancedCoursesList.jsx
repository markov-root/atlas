// src/components/Courses/EnhancedCoursesList.jsx - Comprehensive course display with cohort information
import React, { useState } from 'react';
import { SmallTooltip } from '../UI/Tooltip';
import { Calendar, MapPin, Users, ExternalLink, Mail, GraduationCap, Globe } from 'lucide-react';
import styles from './EnhancedCoursesList.module.css';

function StatusBadge({ status, applicationStatus }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'green';
      case 'upcoming': return 'blue';
      case 'completed': return 'gray';
      default: return 'gray';
    }
  };
  
  const color = getStatusColor(status);
  
  return (
    <div className={styles.statusBadges}>
      <span className={`${styles.statusBadge} ${styles[color]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {applicationStatus === 'open' && (
        <span className={`${styles.statusBadge} ${styles.green} ${styles.pulse}`}>
          Applications Open
        </span>
      )}
    </div>
  );
}

function CohortCard({ cohort, isLatest = false }) {
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={`${styles.cohortCard} ${isLatest ? styles.latestCohort : ''}`}>
      <div className={styles.cohortHeader}>
        <h4 className={styles.cohortName}>{cohort.name}</h4>
        <StatusBadge status={cohort.status} applicationStatus={cohort.applicationStatus} />
      </div>
      
      <div className={styles.cohortDetails}>
        <div className={styles.cohortDates}>
          <Calendar size={14} />
          <span>
            {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
            {cohort.duration && ` (${cohort.duration})`}
          </span>
        </div>
        
        {cohort.location && (
          <div className={styles.cohortLocation}>
            <MapPin size={14} />
            <span>{cohort.location}</span>
          </div>
        )}
        
        {cohort.participants && (
          <div className={styles.cohortParticipants}>
            <Users size={14} />
            <span>{cohort.participants} participants</span>
          </div>
        )}
        
        {cohort.description && (
          <p className={styles.cohortDescription}>{cohort.description}</p>
        )}
      </div>
      
      {cohort.applicationLink && cohort.applicationStatus === 'open' && (
        <div className={styles.cohortActions}>
          <a 
            href={cohort.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.applyButton}
          >
            Apply Now <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

function RegionalChapter({ chapter }) {
  return (
    <div className={styles.regionalChapter}>
      <div className={styles.chapterHeader}>
        <h5 className={styles.chapterName}>{chapter.name}</h5>
        {chapter.language && (
          <span className={styles.languageBadge}>{chapter.language}</span>
        )}
      </div>
      <div className={styles.chapterDetails}>
        <div className={styles.chapterLocation}>
          <MapPin size={12} />
          <span>{chapter.location}</span>
        </div>
        {chapter.participants && (
          <div className={styles.chapterParticipants}>
            <Users size={12} />
            <span>{chapter.participants} participants</span>
          </div>
        )}
      </div>
      <div className={styles.chapterActions}>
        {chapter.website && (
          <a href={chapter.website} target="_blank" rel="noopener noreferrer" className={styles.chapterLink}>
            <Globe size={12} /> Website
          </a>
        )}
        {chapter.contact && (
          <a href={`mailto:${chapter.contact}`} className={styles.chapterLink}>
            <Mail size={12} /> Contact
          </a>
        )}
        {chapter.applicationLink && (
          <a href={chapter.applicationLink} target="_blank" rel="noopener noreferrer" className={styles.chapterLink}>
            <ExternalLink size={12} /> Apply
          </a>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program }) {
  const [showAllCohorts, setShowAllCohorts] = useState(false);
  const [showRegionalChapters, setShowRegionalChapters] = useState(false);
  
  const visibleCohorts = showAllCohorts ? program.cohorts : program.cohorts?.slice(0, 2);
  const hasMoreCohorts = program.cohorts && program.cohorts.length > 2;
  
  const latestCohort = program.cohorts?.[0];
  
  const logoSrc = program.logo || '/img/courses/placeholder_courses.svg';

  return (
    <div className={styles.programCard}>
      {/* Program Header */}
      <div className={styles.programHeader}>
        <div className={styles.programLogo}>
          <img 
            src={logoSrc}
            alt={`${program.name} logo`}
            className={styles.logoImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/img/courses/placeholder_courses.svg';
            }}
          />
        </div>
        
        <div className={styles.programInfo}>
          <div className={styles.programTitleRow}>
            <h3 className={styles.programName}>
              {program.shortName || program.name}
            </h3>
            <StatusBadge status={program.status} />
          </div>
          
          <div className={styles.programMeta}>
            <div className={styles.programLocation}>
              <MapPin size={14} />
              <span>{program.location}</span>
            </div>
            {program.totalParticipants && (
              <div className={styles.programParticipants}>
                <Users size={14} />
                <span>{program.totalParticipants} total participants</span>
              </div>
            )}
          </div>
          
          <p className={styles.programDescription}>{program.description}</p>
        </div>
        
        <div className={styles.programActions}>
          {program.website && (
            <SmallTooltip content="Visit website">
              <a 
                href={program.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                <Globe size={18} />
              </a>
            </SmallTooltip>
          )}
          
          {program.primaryContact && (
            <SmallTooltip content="Contact program">
              <a 
                href={`mailto:${program.primaryContact}`}
                className={styles.actionButton}
              >
                <Mail size={18} />
              </a>
            </SmallTooltip>
          )}
          
          {program.contact && (
            <SmallTooltip content="Contact program">
              <a 
                href={`mailto:${program.contact}`}
                className={styles.actionButton}
              >
                <Mail size={18} />
              </a>
            </SmallTooltip>
          )}
        </div>
      </div>

      {/* Academic Info (for academic programs) */}
      {program.academicInfo && (
        <div className={styles.academicInfo}>
          <div className={styles.academicHeader}>
            <GraduationCap size={16} />
            <span>Academic Program Details</span>
          </div>
          <div className={styles.academicDetails}>
            <span><strong>Program:</strong> {program.academicInfo.program}</span>
            <span><strong>Credits:</strong> {program.academicInfo.credits}</span>
            <span><strong>Format:</strong> {program.academicInfo.format}</span>
            <span><strong>Level:</strong> {program.academicInfo.level}</span>
          </div>
        </div>
      )}

      {/* Cohorts Section */}
      {program.cohorts && program.cohorts.length > 0 && (
        <div className={styles.cohortsSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Courses & Cohorts</h4>
            {hasMoreCohorts && (
              <button 
                onClick={() => setShowAllCohorts(!showAllCohorts)}
                className={styles.toggleButton}
              >
                {showAllCohorts ? 'Show Less' : `Show All (${program.cohorts.length})`}
              </button>
            )}
          </div>
          
          <div className={styles.cohortsGrid}>
            {visibleCohorts.map((cohort, index) => (
              <CohortCard 
                key={cohort.id || index} 
                cohort={cohort} 
                isLatest={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regional Chapters (for programs that have them) */}
      {program.regionalChapters && program.regionalChapters.length > 0 && (
        <div className={styles.regionalSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              Regional Chapters ({program.regionalChapters.length})
            </h4>
            <button 
              onClick={() => setShowRegionalChapters(!showRegionalChapters)}
              className={styles.toggleButton}
            >
              {showRegionalChapters ? 'Hide' : 'Show'} Chapters
            </button>
          </div>
          
          {showRegionalChapters && (
            <div className={styles.regionalGrid}>
              {program.regionalChapters.map((chapter, index) => (
                <RegionalChapter key={index} chapter={chapter} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Program Images */}
      {program.images && program.images.length > 0 && (
        <div className={styles.programImages}>
          {program.images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${program.name} ${index + 1}`}
              className={styles.programImage}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EnhancedCoursesList({ programs }) {
  if (!programs || programs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <Calendar size={48} />
        </div>
        <h3 className={styles.emptyTitle}>No Programs Found</h3>
        <p className={styles.emptyText}>
          No programs match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.programsList}>
      {programs.map(program => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
