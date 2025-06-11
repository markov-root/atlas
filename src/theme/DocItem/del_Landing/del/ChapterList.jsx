// src/theme/DocItem/Landing/ChapterList.jsx - Clean version with fixed audio detection and PDF utils
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SmallTooltip } from '../../../components/UI/Tooltip';
import { buildAudioFiles, hasAudioFiles, getAudioUrl } from '../../../utils/audioUtils';
import { buildPdfFile, hasPdfFile, getPdfUrl } from '../../../utils/pdfUtils';
import styles from './ChapterList.module.css';

export default function ChapterList({ chapters }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [expandedAudio, setExpandedAudio] = useState(new Set());
  const [expandedVideo, setExpandedVideo] = useState(new Set());
  const [verifiedAudioFiles, setVerifiedAudioFiles] = useState(new Map());
  const [verifiedPdfFiles, setVerifiedPdfFiles] = useState(new Map());
  const [isMobile, setIsMobile] = useState(false);

  // Check if audio file actually exists
  const checkAudioExists = async (audioUrl) => {
    if (!audioUrl) return false;
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Build verified audio files (only include files that actually exist)
  const buildVerifiedAudioFiles = async (chapter, chapterNumber) => {
    const audioFiles = buildAudioFiles(chapter, chapterNumber);
    const verifiedFiles = {};
    
    for (const [trackType, filename] of Object.entries(audioFiles)) {
      const audioUrl = getAudioUrl(chapterNumber, filename);
      const exists = await checkAudioExists(audioUrl);
      if (exists) {
        verifiedFiles[trackType] = filename;
      }
    }
    
    return verifiedFiles;
  };

  // Build verified PDF files (only include files that actually exist)
  const buildVerifiedPdfFiles = async (chapter, chapterNumber) => {
    try {
      const pdfData = await buildPdfFile(chapter, chapterNumber);
      return pdfData;
    } catch (error) {
      console.error(`PDF verification failed for chapter ${chapterNumber}:`, error);
      return {
        type: 'none',
        url: null,
        isActive: false
      };
    }
  };

  // Responsive detection and file verification
  useEffect(() => {
    const updateScreenSize = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    if (typeof window !== 'undefined') {
      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      
      // Verify audio and PDF files for all chapters
      const verifyAllFiles = async () => {
        const audioMap = new Map();
        const pdfMap = new Map();
        
        for (const chapter of chapters) {
          // Verify audio files
          const hasExplicitAudio = !!(
            chapter.audio_podcast || 
            chapter.audio_transcript || 
            chapter.audio_discussion ||
            chapter.resources?.audio
          );
          
          if (hasExplicitAudio) {
            const verifiedFiles = await buildVerifiedAudioFiles(chapter, chapter.number);
            audioMap.set(chapter.id, verifiedFiles);
          } else {
            const audioFiles = buildAudioFiles(chapter, chapter.number);
            const verifiedFiles = {};
            
            for (const [trackType, filename] of Object.entries(audioFiles)) {
              const audioUrl = getAudioUrl(chapter.number, filename);
              const exists = await checkAudioExists(audioUrl);
              if (exists) {
                verifiedFiles[trackType] = filename;
              }
            }
            audioMap.set(chapter.id, verifiedFiles);
          }

          // Verify PDF files
          const pdfData = await buildVerifiedPdfFiles(chapter, chapter.number);
          pdfMap.set(chapter.id, pdfData);
        }
        
        setVerifiedAudioFiles(audioMap);
        setVerifiedPdfFiles(pdfMap);
      };
      
      verifyAllFiles();
      
      return () => window.removeEventListener('resize', updateScreenSize);
    }
  }, [chapters]);

  // Toggle chapter expansion
  const toggleExpanded = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      // Close other sections when opening description
      setExpandedAudio(new Set());
      setExpandedVideo(new Set());
    }
    setExpandedChapters(newExpanded);
  };

  // Toggle audio expansion
  const toggleAudioExpanded = (chapterId) => {
    const newExpanded = new Set(expandedAudio);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      // Close other sections when opening audio
      setExpandedChapters(new Set());
      setExpandedVideo(new Set());
    }
    setExpandedAudio(newExpanded);
  };

  // Toggle video expansion
  const toggleVideoExpanded = (chapterId) => {
    const newExpanded = new Set(expandedVideo);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      // Close other sections when opening video
      setExpandedChapters(new Set());
      setExpandedAudio(new Set());
    }
    setExpandedVideo(newExpanded);
  };

  // Handle resource clicks - prevent propagation to avoid expanding
  const handleResourceClick = (e, url, resourceType, chapterId, hasVerifiedAudio, hasVerifiedPdf) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle audio and video as expandable sections
    if (resourceType === 'audio' && hasVerifiedAudio) {
      toggleAudioExpanded(chapterId);
      return;
    }
    
    if (resourceType === 'video' && url) {
      toggleVideoExpanded(chapterId);
      return;
    }
    
    // Handle PDF with verified URL
    if (resourceType === 'pdf' && hasVerifiedPdf) {
      const pdfData = verifiedPdfFiles.get(chapterId);
      const pdfUrl = getPdfUrl(pdfData);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      }
      return;
    }
    
    // Handle other resources normally
    if (url) {
      if (resourceType === 'chapter') {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    }
  };

  // Handle title clicks - prevent propagation and go to chapter
  const handleTitleClick = (e, chapterUrl) => {
    e.preventDefault();
    e.stopPropagation();
    if (chapterUrl) {
      window.location.href = chapterUrl;
    }
  };

  // Handle row clicks - expand/collapse description
  const handleRowClick = (chapterId, hasDescription) => {
    if (hasDescription) {
      toggleExpanded(chapterId);
    }
  };

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Simple Audio Player Component
  const SimpleAudioPlayer = ({ audioUrl, trackType, chapterNumber, chapterTitle }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = React.useRef(null);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    }, []);

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    };

    const handleSeek = (e) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * duration;
    };

    const skipTime = (seconds) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    };

    const formatTime = (time) => {
      if (!time || !isFinite(time)) return '0:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `Chapter-${chapterNumber}-${trackType}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className={styles.simpleAudioPlayer}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* Main controls row */}
        <div className={styles.audioMainRow}>
          <button className={styles.controlButton} onClick={() => skipTime(-10)} title="Rewind 10 seconds">
            <img src="/img/audio_player/rewind_10_seconds.svg" alt="Rewind" className={styles.controlIcon} />
          </button>
          
          <button className={styles.playButton} onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            <img 
              src={isPlaying ? "/img/audio_player/pause.svg" : "/img/audio_player/play.svg"} 
              alt={isPlaying ? "Pause" : "Play"} 
              className={styles.playIcon} 
            />
          </button>
          
          <button className={styles.controlButton} onClick={() => skipTime(10)} title="Forward 10 seconds">
            <img src="/img/audio_player/forward_10_seconds.svg" alt="Forward" className={styles.controlIcon} />
          </button>
          
          <div className={styles.progressContainer} onClick={handleSeek}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Settings row */}
        <div className={styles.audioSettingsRow}>
          <div className={styles.volumeControl}>
            <img src="/img/audio_player/audio.svg" alt="Volume" className={styles.settingIcon} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                if (audioRef.current) audioRef.current.volume = newVolume;
              }}
              className={styles.volumeSlider}
              title="Volume"
            />
          </div>
          
          <div className={styles.speedControl}>
            <img src="/img/audio_player/speed.svg" alt="Speed" className={styles.settingIcon} />
            <select
              value={playbackRate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                setPlaybackRate(newRate);
                if (audioRef.current) audioRef.current.playbackRate = newRate;
              }}
              className={styles.speedSelect}
              title="Playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
          
          <button className={styles.downloadButton} onClick={handleDownload} title="Download audio">
            <img src="/img/audio_player/download.svg" alt="Download" className={styles.settingIcon} />
          </button>
        </div>
      </div>
    );
  };

  // Resource definitions
  const resources = [
    { key: 'chapter', icon: '/img/icons/book.svg', label: 'Read', tooltip: 'Read Online' },
    { key: 'video', icon: '/img/icons/video.svg', label: 'Video', tooltip: 'Watch Video' },
    { key: 'pdf', icon: '/img/icons/pdf.svg', label: 'PDF', tooltip: 'Download PDF' },
    { key: 'audio', icon: '/img/icons/audio.svg', label: 'Audio', tooltip: 'Listen to Audio' },
    { key: 'facilitation', icon: '/img/icons/teach.svg', label: 'Teach', tooltip: 'Teaching Guide' }
  ];

  return (
    <div className={styles.container}>
      
      {/* Desktop Header */}
      {!isMobile && (
        <div className={styles.header}>
          <div className={styles.expandCol}></div>
          <div className={styles.numberCol}>#</div>
          <div className={styles.titleCol}>Chapter</div>
          {resources.map(resource => (
            <div key={resource.key} className={styles.resourceCol}>
              {resource.label}
            </div>
          ))}
        </div>
      )}

      {/* Chapter Rows */}
      <div className={styles.chapters}>
        {chapters.map(chapter => {
          const isExpanded = expandedChapters.has(chapter.id);
          const isAudioExpanded = expandedAudio.has(chapter.id);
          const isVideoExpanded = expandedVideo.has(chapter.id);
          const hasDescription = !!chapter.description;
          
          // Get verified audio files for this chapter
          const chapterAudioFiles = verifiedAudioFiles.get(chapter.id) || {};
          const hasVerifiedAudio = Object.keys(chapterAudioFiles).length > 0;
          
          // Get verified PDF files for this chapter
          const chapterPdfData = verifiedPdfFiles.get(chapter.id);
          const hasVerifiedPdf = chapterPdfData ? hasPdfFile(chapterPdfData) : false;
          
          const hasVideo = !!chapter.resources.video;
          const videoId = getYouTubeVideoId(chapter.resources.video);
          
          return (
            <div 
              key={chapter.id} 
              className={`${styles.chapterGroup} ${isExpanded || isAudioExpanded || isVideoExpanded ? styles.expanded : ''}`}
            >
              
              {/* Main Row */}
              <div 
                className={`${styles.row} ${isMobile ? styles.mobileRow : styles.desktopRow} ${hasDescription ? styles.clickable : ''}`}
                onClick={() => handleRowClick(chapter.id, hasDescription)}
                role={hasDescription ? "button" : undefined}
                tabIndex={hasDescription ? 0 : undefined}
                onKeyDown={hasDescription ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpanded(chapter.id);
                  }
                } : undefined}
              >
                
                {/* Expand Button (if has description) */}
                {hasDescription && (
                  <button 
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(chapter.id);
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${chapter.title} description`}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                
                {/* Empty space if no description */}
                {!hasDescription && <div className={styles.expandBtn}></div>}
                
                {/* Chapter Number */}
                <span className={styles.chapterNumber}>
                  {chapter.number.toString().padStart(2, '0')}
                </span>
                
                {/* Chapter Title - clickable to go to chapter */}
                <div className={styles.titleWrapper}>
                  <h3 
                    className={styles.chapterTitle}
                    onClick={(e) => handleTitleClick(e, chapter.resources.chapter)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (chapter.resources.chapter) {
                          window.location.href = chapter.resources.chapter;
                        }
                      }
                    }}
                  >
                    {chapter.title}
                  </h3>
                </div>
                
              </div>
              
              {/* Mobile Resource Buttons Row - Shows all buttons on mobile */}
              {isMobile && (
                <div className={styles.mobileResourcesRow}>
                  {resources.map(resource => {
                    // Determine availability based on resource type
                    let isAvailable = false;
                    if (resource.key === 'audio') {
                      isAvailable = hasVerifiedAudio;
                    } else if (resource.key === 'pdf') {
                      isAvailable = hasVerifiedPdf;
                    } else {
                      isAvailable = !!chapter.resources[resource.key];
                    }
                    
                    const isExpandable = (resource.key === 'audio' && hasVerifiedAudio) || (resource.key === 'video' && hasVideo);
                    const isCurrentlyExpanded = (resource.key === 'audio' && isAudioExpanded) || (resource.key === 'video' && isVideoExpanded);
                    
                    return (
                      <SmallTooltip 
                        key={resource.key}
                        content={
                          isAvailable 
                            ? isExpandable 
                              ? `${isCurrentlyExpanded ? 'Hide' : 'Show'} ${resource.tooltip}` 
                              : resource.tooltip
                            : `${resource.label} - Coming soon`
                        }
                      >
                        <button
                          className={`${styles.mobileResourceBtn} ${isAvailable ? styles.available : styles.unavailable} ${isCurrentlyExpanded ? styles.active : ''}`}
                          onClick={isAvailable ? (e) => handleResourceClick(e, chapter.resources[resource.key], resource.key, chapter.id, hasVerifiedAudio, hasVerifiedPdf) : undefined}
                          disabled={!isAvailable}
                          aria-label={`${resource.label} ${chapter.title}`}
                          aria-expanded={isExpandable ? isCurrentlyExpanded : undefined}
                        >
                          <img src={resource.icon} alt={resource.label} className={styles.mobileResourceIcon} />
                          <span className={styles.mobileResourceLabel}>{resource.label}</span>
                        </button>
                      </SmallTooltip>
                    );
                  })}
                </div>
              )}
              
              {/* Desktop Resource Buttons - In the main row */}
              {!isMobile && (
                <div className={styles.desktopResourceButtons}>
                  {resources.map(resource => {
                    // Determine availability based on resource type
                    let isAvailable = false;
                    if (resource.key === 'audio') {
                      isAvailable = hasVerifiedAudio;
                    } else if (resource.key === 'pdf') {
                      isAvailable = hasVerifiedPdf;
                    } else {
                      isAvailable = !!chapter.resources[resource.key];
                    }
                    
                    const isExpandable = (resource.key === 'audio' && hasVerifiedAudio) || (resource.key === 'video' && hasVideo);
                    const isCurrentlyExpanded = (resource.key === 'audio' && isAudioExpanded) || (resource.key === 'video' && isVideoExpanded);
                    
                    return (
                      <SmallTooltip 
                        key={resource.key}
                        content={
                          isAvailable 
                            ? isExpandable 
                              ? `${isCurrentlyExpanded ? 'Hide' : 'Show'} ${resource.tooltip}` 
                              : resource.tooltip
                            : `${resource.label} - Coming soon`
                        }
                      >
                        <button
                          className={`${styles.resourceBtn} ${isAvailable ? styles.available : styles.unavailable} ${isCurrentlyExpanded ? styles.active : ''}`}
                          onClick={isAvailable ? (e) => handleResourceClick(e, chapter.resources[resource.key], resource.key, chapter.id, hasVerifiedAudio, hasVerifiedPdf) : undefined}
                          disabled={!isAvailable}
                          aria-label={`${resource.label} ${chapter.title}`}
                          aria-expanded={isExpandable ? isCurrentlyExpanded : undefined}
                        >
                          <img src={resource.icon} alt={resource.label} className={styles.resourceIcon} />
                        </button>
                      </SmallTooltip>
                    );
                  })}
                </div>
              )}

              {/* Description (expandable) */}
              {isExpanded && chapter.description && (
                <div className={styles.descriptionRow}>
                  <div className={styles.description}>
                    {chapter.description}
                  </div>
                </div>
              )}

              {/* Audio Player (expandable) */}
              {isAudioExpanded && hasVerifiedAudio && (
                <div className={styles.mediaRow}>
                  <div className={styles.mediaHeader}>
                    <h4 className={styles.mediaTitle}>
                      <img src="/img/icons/audio.svg" alt="" className={styles.mediaTitleIcon} />
                      Audio Content
                    </h4>
                    <button 
                      className={styles.closeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudioExpanded(chapter.id);
                      }}
                      aria-label="Close audio player"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.mediaContent}>
                    {/* Render audio players for each verified audio file */}
                    {Object.entries(chapterAudioFiles).map(([trackType, filename]) => {
                      const audioUrl = getAudioUrl(chapter.number, filename);
                      const trackDisplayName = trackType === 'podcast' ? 'Podcast' : 
                                               trackType === 'transcript' ? 'Reading' : 
                                               trackType === 'discussion' ? 'Discussion' : 'Audio';
                      
                      return (
                        <div key={trackType} className={styles.audioTrack}>
                          {Object.keys(chapterAudioFiles).length > 1 && (
                            <div className={styles.trackLabel}>{trackDisplayName}</div>
                          )}
                          <SimpleAudioPlayer 
                            audioUrl={audioUrl}
                            trackType={trackDisplayName}
                            chapterNumber={chapter.number}
                            chapterTitle={chapter.title}
                          />
                        </div>
                      );
                    })}
                    <div className={styles.mediaDescription}>
                      Listen to the audio content for Chapter {chapter.number}: {chapter.title}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Player (expandable) */}
              {isVideoExpanded && hasVideo && videoId && (
                <div className={styles.mediaRow}>
                  <div className={styles.mediaHeader}>
                    <h4 className={styles.mediaTitle}>
                      <img src="/img/icons/video.svg" alt="" className={styles.mediaTitleIcon} />
                      Video Lecture
                    </h4>
                    <button 
                      className={styles.closeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoExpanded(chapter.id);
                      }}
                      aria-label="Close video player"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.mediaContent}>
                    <div className={styles.videoWrapper}>
                      <iframe
                        className={styles.videoPlayer}
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title={`${chapter.title} - Video Lecture`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className={styles.mediaDescription}>
                      Watch the video lecture for Chapter {chapter.number}: {chapter.title}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
