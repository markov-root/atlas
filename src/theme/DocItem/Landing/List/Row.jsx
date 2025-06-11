// src/theme/DocItem/Landing/ChapterList/Row.jsx
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Buttons from './Buttons';
import Expandable from './Expandable';
import { hasPdfFile } from '../../../../utils/pdfUtils';
import styles from './Row.module.css';
import containerStyles from './ChapterList.module.css';

export default function Row({
  chapter,
  isMobile,
  isExpanded,
  isAudioExpanded,
  isVideoExpanded,
  verifiedAudioFiles,
  verifiedPdfData,
  onToggleExpanded,
  onToggleAudio,
  onToggleVideo
}) {
  const hasDescription = !!chapter.description;
  const hasVerifiedAudio = Object.keys(verifiedAudioFiles).length > 0;
  const hasVerifiedPdf = verifiedPdfData ? hasPdfFile(verifiedPdfData) : false;
  const hasVideo = !!chapter.resources.video;

  // Handle title clicks
  const handleTitleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (chapter.resources.chapter) {
      window.location.href = chapter.resources.chapter;
    }
  };

  // Handle row clicks for description expansion
  const handleRowClick = () => {
    if (hasDescription) {
      onToggleExpanded();
    }
  };

  return (
    <div className={`${containerStyles.chapterGroup} ${(isExpanded || isAudioExpanded || isVideoExpanded) ? containerStyles.expanded : ''}`}>
      
      {/* Main Row */}
      <div 
        className={`${containerStyles.row} ${isMobile ? containerStyles.mobileRow : containerStyles.desktopRow} ${hasDescription ? containerStyles.clickable : ''}`}
        onClick={handleRowClick}
        role={hasDescription ? "button" : undefined}
        tabIndex={hasDescription ? 0 : undefined}
      >
        
        {/* Expand Button */}
        {hasDescription ? (
          <button 
            className={styles.expandBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpanded();
            }}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className={styles.expandBtn}></div>
        )}
        
        {/* Chapter Number */}
        <span className={styles.chapterNumber}>
          {chapter.number.toString().padStart(2, '0')}
        </span>
        
        {/* Chapter Title */}
        <div className={styles.titleWrapper}>
          <h3 
            className={styles.chapterTitle}
            onClick={handleTitleClick}
            role="link"
            tabIndex={0}
          >
            {chapter.title}
          </h3>
        </div>
        
        {/* Resource Buttons - Desktop only (in grid) */}
        {!isMobile && (
          <Buttons
            chapter={chapter}
            hasVerifiedAudio={hasVerifiedAudio}
            hasVerifiedPdf={hasVerifiedPdf}
            hasVideo={hasVideo}
            isAudioExpanded={isAudioExpanded}
            isVideoExpanded={isVideoExpanded}
            verifiedPdfData={verifiedPdfData}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            isMobile={false}
          />
        )}
      </div>

      {/* Mobile Resource Buttons Row */}
      {isMobile && (
        <div className={containerStyles.mobileResourcesRow}>
          <Buttons
            chapter={chapter}
            hasVerifiedAudio={hasVerifiedAudio}
            hasVerifiedPdf={hasVerifiedPdf}
            hasVideo={hasVideo}
            isAudioExpanded={isAudioExpanded}
            isVideoExpanded={isVideoExpanded}
            verifiedPdfData={verifiedPdfData}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            isMobile={true}
          />
        </div>
      )}

      {/* Expandable Content */}
      <Expandable
        chapter={chapter}
        isExpanded={isExpanded}
        isAudioExpanded={isAudioExpanded}
        isVideoExpanded={isVideoExpanded}
        verifiedAudioFiles={verifiedAudioFiles}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
      />
    </div>
  );
}
