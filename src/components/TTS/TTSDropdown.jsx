// src/components/TTS/TTSDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { getTtsDisplayTitle } from '../../utils/ttsUtils';
import { getAudioUrl, getTrackDisplayName } from '../../utils/audioUtils';
import styles from './TTSDropdown.module.css';

export default function TTSDropdown({ 
  isOpen, 
  onClose, 
  triggerRef, 
  ttsData, 
  audioControls, 
  chapterAudio,
  initialVolume = 1,
  initialPlaybackRate = 1
}) {
  const dropdownRef = useRef(null);
  
  // Initialize state with persistent values from parent
  const [volume, setVolume] = useState(initialVolume);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  
  // Determine available tabs
  const hasTts = !!(ttsData && ttsData.isActive && ttsData.url);
  const hasPodcast = !!(chapterAudio && chapterAudio.isActive);
  
  // Default to TTS tab if available, otherwise Podcast
  const [activeTab, setActiveTab] = useState(hasTts ? 'tts' : 'podcast');
  
  // Sync with parent's persistent state when dropdown opens
  useEffect(() => {
    setVolume(initialVolume);
    setPlaybackRate(initialPlaybackRate);
  }, [initialVolume, initialPlaybackRate, isOpen]);
  
  // Use appropriate audio controls based on active tab
  const currentAudioControls = activeTab === 'tts' ? audioControls : chapterAudio?.audioControls;
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentAudioControls) return null;

  const { 
    isPlaying, 
    currentTime, 
    duration, 
    play, 
    pause, 
    seek, 
    setVolume: setAudioVolume, 
    setPlaybackRate: setAudioPlaybackRate 
  } = currentAudioControls;

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seek(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setAudioVolume(newVolume);
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    setAudioPlaybackRate(newRate);
  };

  const handleDownload = () => {
    if (activeTab === 'tts' && ttsData?.url) {
      const link = document.createElement('a');
      link.href = ttsData.url;
      link.download = `${getTtsDisplayTitle(ttsData)}-TTS.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'podcast' && chapterAudio?.url) {
      const link = document.createElement('a');
      link.href = chapterAudio.url;
      link.download = `Chapter-${chapterAudio.chapterNumber}-Podcast.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const skipTime = (seconds) => {
    if (duration) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seek(newTime);
    }
  };

  // Get dynamic volume icon based on volume level
  const getVolumeIcon = () => {
    if (volume === 0) {
      return "/img/audio_player/volume_mute.svg";
    } else if (volume <= 0.33) {
      return "/img/audio_player/volume_low.svg";
    } else if (volume <= 0.66) {
      return "/img/audio_player/volume_medium.svg";
    } else {
      return "/img/audio_player/volume_max.svg";
    }
  };

  // Get current tab title
  const getCurrentTabTitle = () => {
    if (activeTab === 'tts') {
      return getTtsDisplayTitle(ttsData);
    } else {
      return `Chapter ${chapterAudio?.chapterNumber || '?'}`;
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={styles.dropdown}
      role="menu"
      aria-label="Audio controls"
    >
      {/* Clean Header - No stop button */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>Audio Player</h3>
            <span className={styles.subtitle}>{getCurrentTabTitle()}</span>
          </div>
        </div>
      </div>

      {/* Sleek Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab('tts')}
          className={`${styles.tabButton} ${activeTab === 'tts' ? styles.tabActive : ''} ${!hasTts ? styles.tabDisabled : ''}`}
          disabled={!hasTts}
        >
          <img src="/img/icons/tts.svg" alt="" className={styles.tabIcon} />
          <span className={styles.tabLabel}>Read Aloud</span>
        </button>
        <button
          onClick={() => setActiveTab('podcast')}
          className={`${styles.tabButton} ${activeTab === 'podcast' ? styles.tabActive : ''} ${!hasPodcast ? styles.tabDisabled : ''}`}
          disabled={!hasPodcast}
        >
          <img src="/img/icons/podcast.svg" alt="" className={styles.tabIcon} />
          <span className={styles.tabLabel}>Podcast</span>
        </button>
      </div>

      <div className={styles.content}>
        {/* Clean Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressContainer} onClick={handleProgressClick}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill}
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div 
                className={styles.progressThumb}
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Main Playback Controls - Centered and clean */}
        <div className={styles.playbackSection}>
          <button 
            onClick={() => skipTime(-10)} 
            className={styles.skipButton}
            aria-label="Rewind 10 seconds"
            title="Rewind 10s"
          >
            <img src="/img/audio_player/rewind_10_seconds.svg" alt="" className={styles.skipIcon} />
          </button>
          
          <button 
            onClick={isPlaying ? pause : play} 
            className={styles.playButton}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            <img 
              src={isPlaying ? "/img/audio_player/pause.svg" : "/img/audio_player/play.svg"} 
              alt={isPlaying ? "Pause" : "Play"} 
              className={styles.playIcon} 
            />
          </button>
          
          <button 
            onClick={() => skipTime(10)} 
            className={styles.skipButton}
            aria-label="Forward 10 seconds"
            title="Forward 10s"
          >
            <img src="/img/audio_player/forward_10_seconds.svg" alt="" className={styles.skipIcon} />
          </button>
        </div>

        {/* Compact Settings Row - Fixed layout */}
        <div className={styles.settingsRow}>
          {/* Speed Control */}
          <div className={styles.compactControl}>
            <div className={styles.controlLabel}>
              <img src="/img/audio_player/speed.svg" alt="" className={styles.controlIcon} />
              <span className={styles.labelText}>Speed</span>
            </div>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className={styles.slider}
                aria-label="Playback speed"
              />
              <div 
                className={styles.sliderTrack}
                style={{ width: `${((playbackRate - 0.5) / (2 - 0.5)) * 100}%` }}
              />
            </div>
            <span className={styles.valueDisplay}>{playbackRate}×</span>
          </div>

          {/* Volume Control */}
          <div className={styles.compactControl}>
            <div className={styles.controlLabel}>
              <img src={getVolumeIcon()} alt="" className={styles.controlIcon} />
              <span className={styles.labelText}>Volume</span>
            </div>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.slider}
                aria-label="Volume"
              />
              <div 
                className={styles.sliderTrack}
                style={{ width: `${volume * 100}%` }}
              />
            </div>
            <span className={styles.valueDisplay}>{Math.round(volume * 100)}%</span>
          </div>

          {/* Download Button - Separate section */}
          <div className={styles.downloadSection}>
            <button 
              onClick={handleDownload}
              className={styles.downloadButton}
              aria-label={`Download ${activeTab === 'tts' ? 'TTS' : 'podcast'} audio`}
              title="Download Audio"
            >
              <img src="/img/audio_player/download.svg" alt="" className={styles.downloadIcon} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
