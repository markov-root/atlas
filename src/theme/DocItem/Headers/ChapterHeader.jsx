// src/theme/DocItem/Headers/ChapterHeader.jsx - Updated with inline audio/video players
import React, { useState, useEffect } from 'react';
import { ActionButtonTooltip } from '../../../components/UI/Tooltip';
import styles from './ChapterHeader.module.css';
import InlineAudioPlayer from '@site/src/components/chapters/Audio/InlineAudioPlayer';
import InlineVideoPlayer from '@site/src/components/chapters/Video/InlineVideoPlayer';
import { 
  buildAudioFiles, 
  hasAudioFiles, 
  debugAudioFiles
} from '@site/src/utils/audioUtils';
import { 
  buildPdfFile, 
  hasPdfFile, 
  getPdfUrl, 
  debugPdfFiles 
} from '@site/src/utils/pdfUtils';

// Action Button Component - Updated with centralized Tippy
function ActionButton({ href, iconPath, label, description, active, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine tooltip content
  const tooltipContent = description || label;

  // If it has onClick (audio or video buttons), render as button
  if (onClick) {
    return (
      <ActionButtonTooltip content={tooltipContent}>
        <button
          onClick={onClick}
          className={`${styles.actionButton} ${!active ? styles.inactive : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: active ? 'pointer' : 'not-allowed' 
          }}
          disabled={!active}
        >
          <div className={styles.buttonIcon}>
            <img src={iconPath} alt="" className={styles.buttonIconImage} />
          </div>
          
          <div className={styles.buttonContent}>
            <span className={styles.buttonLabel}>{label}</span>
          </div>
        </button>
      </ActionButtonTooltip>
    );
  }

  // Regular link buttons
  return (
    <ActionButtonTooltip content={active ? tooltipContent : `${label} (Not available)`}>
      <a
        href={active && href ? href : '#'}
        target={active && href ? "_blank" : undefined}
        rel={active && href ? "noopener noreferrer" : undefined}
        className={`${styles.actionButton} ${!active ? styles.inactive : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={!active || !href ? (e) => e.preventDefault() : undefined}
        aria-disabled={!active}
      >
        <div className={styles.buttonIcon}>
          <img src={iconPath} alt="" className={styles.buttonIconImage} />
        </div>
        
        <div className={styles.buttonContent}>
          <span className={styles.buttonLabel}>{label}</span>
        </div>
      </a>
    </ActionButtonTooltip>
  );
}

/**
 * Complete Chapter Header Component with Inline Audio/Video Players
 * Features: Texture background, horizontal button strip, collapsible media players
 */
export default function ChapterHeader({ frontMatter, title, chapterNumber, boundWidth, metadata }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // PDF availability check - async
  useEffect(() => {
    async function checkPdfAvailability() {
      setPdfLoading(true);
      
      console.log(`🔍 Checking PDF for chapter ${chapterNumber}...`);
      
      try {
        const result = await buildPdfFile(frontMatter, chapterNumber);
        
        console.log(`📄 PDF check result for chapter ${chapterNumber}:`, result);
        
        setPdfData(result);
        
        debugPdfFiles('ChapterHeader (async)', {
          chapterNumber,
          localFileChecked: `/chapters/${String(chapterNumber).padStart(2, '0')}/pdf/main.pdf`,
          asyncResult: result
        });
      } catch (error) {
        console.error(`❌ PDF availability check failed for chapter ${chapterNumber}:`, error);
        // Set to inactive if check fails
        setPdfData({
          type: 'none',
          url: null,
          isActive: false
        });
      } finally {
        setPdfLoading(false);
      }
    }
    
    checkPdfAvailability();
  }, [frontMatter, chapterNumber]);

  // Use actual PDF data once loaded, or show as inactive while loading
  const hasPdf = pdfData ? hasPdfFile(pdfData) : false;
  const pdfUrl = (pdfData && pdfData.isActive) ? getPdfUrl(pdfData) : null;
  
  console.log(`🎯 Chapter ${chapterNumber} PDF status:`, {
    pdfLoading,
    pdfData,
    hasPdf,
    pdfUrl
  });

  // Build audio files object
  const audioFiles = buildAudioFiles(frontMatter, chapterNumber);
  const hasAudio = hasAudioFiles(audioFiles);

  // Debug logging for audio detection
  debugAudioFiles('ChapterHeader', {
    chapterNumber,
    frontMatterAudio: {
      audio_podcast: frontMatter.audio_podcast,
      audio_transcript: frontMatter.audio_transcript,
      audio_discussion: frontMatter.audio_discussion,
      audio_link: frontMatter.audio_link
    },
    processedAudioFiles: audioFiles,
    hasAudio
  });

  // Debug logging for PDF detection
  if (pdfData) {
    debugPdfFiles('ChapterHeader (final)', {
      chapterNumber,
      localFileChecked: `/chapters/${String(chapterNumber).padStart(2, '0')}/pdf/main.pdf`,
      finalPdfData: pdfData,
      pdfUrl,
      hasPdf,
      pdfLoading
    });
  }

  // Handle audio button click
  const handleAudioToggle = () => {
    if (hasAudio) {
      setShowAudioPlayer(!showAudioPlayer);
      // Close video player if open
      if (showVideoPlayer) {
        setShowVideoPlayer(false);
      }
    }
  };

  // Handle video button click
  const handleVideoToggle = () => {
    if (frontMatter.video_link) {
      setShowVideoPlayer(!showVideoPlayer);
      // Close audio player if open
      if (showAudioPlayer) {
        setShowAudioPlayer(false);
      }
    }
  };

  // Handle audio player close
  const handleAudioClose = () => {
    setShowAudioPlayer(false);
  };

  // Handle video player close
  const handleVideoClose = () => {
    setShowVideoPlayer(false);
  };

  // Generate flowing particles with better distribution
  const generateParticles = () => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1.5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.8,
      duration: 8 + Math.random() * 4
    }));
  };

  const particles = generateParticles();

  return (
    <header className={`${styles.chapterContainer} ${isVisible ? styles.visible : ''}`}>
      {/* Texture background with subtle overlay */}
      <div className={styles.backgroundLayers}>
        <div className={styles.textureOverlay} />
        
        {/* Subtle floating particles */}
        <div className={styles.particleLayer}>
          {particles.map(particle => (
            <div
              key={particle.id}
              className={styles.particle}
              style={{
                '--size': `${particle.size}px`,
                '--x': `${particle.x}%`,
                '--y': `${particle.y}%`,
                '--delay': `${particle.delay}s`,
                '--duration': `${particle.duration}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content with new layout */}
      <div className={styles.chapterContent}>
        <div className={styles.mainSplit}>
          
          {/* TOP SECTION - Title/metadata horizontal split */}
          <div className={styles.topSection}>
            
            {/* LEFT SIDE - Core content */}
            <div className={styles.leftSection}>
              {/* Chapter number + title */}
              <div className={styles.titleSection}>
                <div className={styles.titleRow}>
                  <span className={styles.chapterNumber}>
                    {String(frontMatter.chapter_number || chapterNumber).padStart(2, '0')}
                  </span>
                  <h1 className={styles.chapterTitle}>{title}</h1>
                </div>
              </div>
              
              {/* Description */}
              {frontMatter.chapter_description && (
                <p className={styles.chapterDescription}>
                  {frontMatter.chapter_description}
                </p>
              )}
            </div>
            
            {/* RIGHT SIDE - Breadcrumbs + Metadata only */}
            <div className={styles.rightSection}>
              {/* Breadcrumbs at top of right side */}
              <nav className={styles.chapterNavigation}>
                <ActionButtonTooltip content="AI Safety Atlas Home">
                  <a href="/" className={styles.breadcrumbLink}>
                    <svg className={styles.breadcrumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                  </a>
                </ActionButtonTooltip>
                <span className={styles.breadcrumbSeparator}>›</span>
                <ActionButtonTooltip content="All Chapters">
                  <a href="/chapters/" className={styles.breadcrumbLink}>
                    <svg className={styles.breadcrumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </a>
                </ActionButtonTooltip>
                <span className={styles.breadcrumbSeparator}>›</span>
                <a href={`/chapters/${String(frontMatter.chapter_number || chapterNumber).padStart(2, '0')}/`} className={styles.breadcrumbLink}>
                  Chapter {frontMatter.chapter_number || chapterNumber}
                </a>
                <span className={styles.breadcrumbSeparator}>›</span>
                <span className={styles.breadcrumbCurrent}>{title}</span>
              </nav>

              {/* Metadata section */}
              <div className={styles.metadataSection}>
                {/* Authors */}
                {frontMatter.authors && frontMatter.authors.length > 0 && (
                  <div className={styles.metaCard}>
                    <div className={styles.metaIcon}>
                      <img src="/img/icons/author.svg" alt="" className={styles.iconImage} />
                    </div>
                    <div className={styles.metaContent}>
                      <span className={styles.metaLabel}>Authors</span>
                      <span className={styles.metaValue}>
                        {frontMatter.authors.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Affiliations */}
                {frontMatter.affiliations && frontMatter.affiliations.length > 0 && (
                  <div className={styles.metaCard}>
                    <div className={styles.metaIcon}>
                      <img src="/img/icons/affiliation.svg" alt="" className={styles.iconImage} />
                    </div>
                    <div className={styles.metaContent}>
                      <span className={styles.metaLabel}>Affiliation</span>
                      <span className={styles.metaValue}>
                        {frontMatter.affiliations.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reading time breakdown */}
                {(frontMatter.reading_time_core || frontMatter.reading_time_optional || frontMatter.reading_time_appendix) && (
                  <div className={styles.metaCard}>
                    <div className={styles.metaIcon}>
                      <img src="/img/icons/reading-time.svg" alt="" className={styles.iconImage} />
                    </div>
                    <div className={styles.metaContent}>
                      <span className={styles.metaLabel}>Reading Time</span>
                      <div className={styles.readingBreakdown}>
                        {frontMatter.reading_time_core && (
                          <span className={styles.timeSegment}>
                            <span className={styles.timeValue}>{frontMatter.reading_time_core}</span>
                            <span className={styles.timeLabel}>core</span>
                          </span>
                        )}
                        {frontMatter.reading_time_optional && (
                          <span className={styles.timeSegment}>
                            <span className={styles.timeValue}>{frontMatter.reading_time_optional}</span>
                            <span className={styles.timeLabel}>optional</span>
                          </span>
                        )}
                        {frontMatter.reading_time_appendix && (
                          <span className={styles.timeSegment}>
                            <span className={styles.timeValue}>{frontMatter.reading_time_appendix}</span>
                            <span className={styles.timeLabel}>appendix</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
          
          {/* BOTTOM SECTION - Action buttons in horizontal line */}
          <div className={styles.buttonsSection}>
            <ActionButton
              href={frontMatter.arxiv_link}
              iconPath="/img/icons/arxiv.svg"
              label="Paper"
              description="View on arXiv"
              active={!!frontMatter.arxiv_link}
            />
            
            <ActionButton
              href={frontMatter.google_docs_link}
              iconPath="/img/icons/google.svg"
              label="Docs"
              description="Comment directly on Google Docs"
              active={!!frontMatter.google_docs_link}
            />
            
            <ActionButton
              href={frontMatter.alignment_forum_link}
              iconPath="/img/icons/lesswrong.svg"
              label="Discuss"
              description="Discuss on Lesswrong and Alignment Forum"
              active={!!frontMatter.alignment_forum_link}
            />
            
            {/* Video button - Now with inline playback */}
            <ActionButton
              onClick={handleVideoToggle}
              iconPath="/img/icons/video.svg"
              label="Lecture"
              description={frontMatter.video_link ? "Watch the video lecture" : "Video not available"}
              active={!!frontMatter.video_link}
            />
            
            {/* Audio button - with click functionality */}
            <ActionButton
              onClick={handleAudioToggle}
              iconPath="/img/icons/audio.svg"
              label="Audio"
              description={hasAudio ? "Listen to the podcast" : "Audio not available"}
              active={hasAudio}
            />
            
            {/* PDF Download button - Only active when local file confirmed to exist */}
            <ActionButton
              href={hasPdf ? pdfUrl : null}
              iconPath="/img/icons/pdf.svg"
              label="PDF"
              description={hasPdf ? "Download PDF version" : "PDF not available"}
              active={hasPdf}
            />
            
            {/* Excalidraw button */}
            <ActionButton
              href={frontMatter.excalidraw_link}
              iconPath="/img/icons/excalidraw.svg"
              label="Diagrams"
              description="View and edit source SVGs"
              active={!!frontMatter.excalidraw_link}
            />
            
            <ActionButton
              href={frontMatter.teach_link}
              iconPath="/img/icons/teach.svg"
              label="Teach"
              description="Access Facilitation Resources"
              active={!!frontMatter.teach_link}
            />
          </div>
          
          {/* AUDIO PLAYER SECTION - Only shows when audio button is clicked */}
          {showAudioPlayer && hasAudio && (
            <InlineAudioPlayer
              chapterNumber={frontMatter.chapter_number || chapterNumber}
              audioFiles={audioFiles}
              onClose={handleAudioClose}
            />
          )}

          {/* VIDEO PLAYER SECTION - Only shows when video button is clicked */}
          {showVideoPlayer && frontMatter.video_link && (
            <InlineVideoPlayer
              videoUrl={frontMatter.video_link}
              title={title}
              onClose={handleVideoClose}
            />
          )}
          
        </div>
      </div>
    </header>
  );
}
