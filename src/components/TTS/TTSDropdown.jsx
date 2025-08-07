// src/components/TTS/TTSDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { getTtsDisplayTitle } from '../../utils/ttsUtils';
import { getAudioUrl, getTrackDisplayName } from '../../utils/audioUtils';
import styles from './TTSDropdown.module.css';

export default function TTSDropdown({ isOpen, onClose, triggerRef, ttsData, audioControls, chapterAudio }) {
  const dropdownRef = useRef(null);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Determine available tabs
  const hasTts = !!(ttsData && ttsData.isActive && ttsData.url);
  const hasPodcast = !!(chapterAudio && chapterAudio.isActive);
  
  // Default to TTS tab if available, otherwise Podcast
  const [activeTab, setActiveTab] = useState(hasTts ? 'tts' : 'podcast');
  
  // Use appropriate audio controls based on active tab
  const currentAudioControls = activeTab === 'tts' ? audioControls : chapterAudio.audioControls;
  
  console.log('🎵 TTSDropdown render:', { 
    hasTts, 
    hasPodcast, 
    activeTab, 
    currentAudioControls: !!currentAudioControls 
  });

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

  const { isPlaying, currentTime, duration, play, pause, stop, seek, setVolume: setAudioVolume, setPlaybackRate: setAudioPlaybackRate } = currentAudioControls;

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
      return `Chapter ${chapterAudio?.chapterNumber || '?'} Podcast`;
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={styles.dropdown}
      role="menu"
      aria-label="Audio controls"
    >
      {/* Header with tabs */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <img 
            src={activeTab === 'tts' ? "/img/icons/tts.svg" : "/img/icons/podcast.svg"}
            alt="" 
            className={styles.headerIcon}
          />
          <div className={styles.headerText}>
            <h3 className={styles.title}>Audio Player</h3>
            <span className={styles.subtitle}>{getCurrentTabTitle()}</span>
          </div>
        </div>
        <button 
          onClick={stop}
          className={styles.stopButton}
          aria-label="Stop audio"
          title="Stop"
        >
          <img src="/img/audio_player/stop.svg" alt="" className={styles.stopIcon} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab('tts')}
          className={`${styles.tabButton} ${activeTab === 'tts' ? styles.tabActive : ''} ${!hasTts ? styles.tabDisabled : ''}`}
          disabled={!hasTts}
        >
          <img src="/img/icons/tts.svg" alt="" className={styles.tabIcon} />
          Read Aloud
        </button>
        <button
          onClick={() => setActiveTab('podcast')}
          className={`${styles.tabButton} ${activeTab === 'podcast' ? styles.tabActive : ''} ${!hasPodcast ? styles.tabDisabled : ''}`}
          disabled={!hasPodcast}
        >
          <img src="/img/icons/podcast.svg" alt="" className={styles.tabIcon} />
          Podcast
        </button>
      </div>

      <div className={styles.content}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressContainer} onClick={handleProgressClick}>
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

        {/* Main Controls */}
        <div className={styles.controlsSection}>
          <div className={styles.playbackControls}>
            <button 
              onClick={() => skipTime(-10)} 
              className={styles.controlButton}
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <img src="/img/audio_player/rewind_10_seconds.svg" alt="" className={styles.controlIcon} />
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
              className={styles.controlButton}
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <img src="/img/audio_player/forward_10_seconds.svg" alt="" className={styles.controlIcon} />
            </button>
          </div>
        </div>

        {/* Settings Controls */}
        <div className={styles.settingsSection}>
          {/* Speed Control */}
          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>
              <img src="/img/audio_player/speed.svg" alt="" className={styles.settingIcon} />
              <span className={styles.labelText}>Speed</span>
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderWrapper}>
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
                  className={styles.sliderFill}
                  style={{ width: `${((playbackRate - 0.5) / (2 - 0.5)) * 100}%` }}
                />
              </div>
              <span className={styles.valueLabel}>{playbackRate}×</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>
              <img src={getVolumeIcon()} alt="" className={styles.settingIcon} />
              <span className={styles.labelText}>Volume</span>
            </div>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderWrapper}>
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
                  className={styles.sliderFill}
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span className={styles.valueLabel}>{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Download Button */}
          <div className={styles.downloadSection}>
            <button 
              onClick={handleDownload}
              className={styles.downloadButton}
              aria-label={`Download ${activeTab === 'tts' ? 'TTS' : 'podcast'} audio`}
              title="Download"
            >
              <img src="/img/audio_player/download.svg" alt="" className={styles.downloadIcon} />
              <span className={styles.downloadLabel}>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
