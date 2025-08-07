// src/components/TTS/TTSButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import TTSDropdown from './TTSDropdown';
import { ActionButtonTooltip } from '../UI/Tooltip';
import { buildAudioFiles, hasAudioFiles, getAudioUrl } from '../../utils/audioUtils';
import styles from './TTSButton.module.css';

export default function TTSButton({ ttsData, chapterNumber, onAudioStateChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  
  const buttonRef = useRef(null);
  const audioRef = useRef(null);
  const podcastAudioRef = useRef(null);
  const dropdownWrapperRef = useRef(null);

  // Determine if we have TTS or chapter audio
  const hasTts = !!(ttsData && ttsData.isActive && ttsData.url);
  const ttsUrl = hasTts ? ttsData.url : null;
  
  // Build chapter audio files
  const audioFiles = chapterNumber ? buildAudioFiles({}, chapterNumber) : {};
  const hasPodcast = hasAudioFiles(audioFiles);
  const podcastUrl = hasPodcast ? getAudioUrl(chapterNumber, audioFiles.podcast) : null;
  
  // Determine if button should be available (either TTS or podcast exists)
  const hasAnyAudio = hasTts || hasPodcast;
  
  // Determine which icon to show: podcast.svg when podcast playing, tts.svg otherwise
  const getCurrentIcon = () => {
    if (isPlayingPodcast) return '/img/icons/podcast.svg';
    return '/img/icons/audio.svg'; // Default to TTS icon
  };

  console.log('🎵 TTSButton state:', { 
    hasTts, 
    hasPodcast, 
    hasAnyAudio, 
    isPlayingTts, 
    isPlayingPodcast, 
    chapterNumber 
  });

  // TTS Audio element setup
  useEffect(() => {
    if (!hasTts || !ttsUrl) {
      return;
    }

    // Create TTS audio element
    const audio = new Audio(ttsUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      console.log('🎵 TTS: Audio ended');
      setIsPlayingTts(false);
    };
    const handlePlay = () => {
      console.log('🎵 TTS: Audio started playing');
      setIsPlayingTts(true);
      // Pause podcast if it's playing
      if (podcastAudioRef.current && !podcastAudioRef.current.paused) {
        podcastAudioRef.current.pause();
      }
    };
    const handlePause = () => {
      console.log('🎵 TTS: Audio paused');
      setIsPlayingTts(false);
    };
    const handleError = (e) => {
      console.error('🎵 TTS: Audio error:', e);
      setIsPlayingTts(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [hasTts, ttsUrl]);

  // Podcast Audio element setup
  useEffect(() => {
    if (!hasPodcast || !podcastUrl) {
      return;
    }

    // Create podcast audio element
    const audio = new Audio(podcastUrl);
    audio.preload = 'metadata';
    podcastAudioRef.current = audio;

    const updateTime = () => setPodcastCurrentTime(audio.currentTime);
    const updateDuration = () => setPodcastDuration(audio.duration);
    const handleEnded = () => {
      console.log('🎵 Podcast: Audio ended');
      setIsPlayingPodcast(false);
    };
    const handlePlay = () => {
      console.log('🎵 Podcast: Audio started playing');
      setIsPlayingPodcast(true);
      // Pause TTS if it's playing
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    const handlePause = () => {
      console.log('🎵 Podcast: Audio paused');
      setIsPlayingPodcast(false);
    };
    const handleError = (e) => {
      console.error('🎵 Podcast: Audio error:', e);
      setIsPlayingPodcast(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [hasPodcast, podcastUrl]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && 
          dropdownWrapperRef.current && 
          !dropdownWrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleButtonClick = () => {
    if (!hasAnyAudio) return; // Do nothing if no audio available
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

  // TTS audio control functions
  const ttsAudioControls = hasTts ? {
    audio: audioRef.current,
    isPlaying: isPlayingTts,
    currentTime,
    duration,
    play: () => {
      if (audioRef.current && !isPlayingTts) {
        audioRef.current.play().catch(error => {
          console.error('🎵 TTS: Error playing audio:', error);
          setIsPlayingTts(false);
        });
      }
    },
    pause: () => {
      if (audioRef.current && isPlayingTts) {
        audioRef.current.pause();
      }
    },
    stop: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    },
    seek: (time) => {
      if (audioRef.current && duration) {
        audioRef.current.currentTime = Math.max(0, Math.min(duration, time));
      }
    },
    setVolume: (volume) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume));
      }
    },
    setPlaybackRate: (rate) => {
      if (audioRef.current) {
        audioRef.current.playbackRate = Math.max(0.25, Math.min(4, rate));
      }
    }
  } : null;

  // Podcast audio control functions
  const podcastAudioControls = hasPodcast ? {
    audio: podcastAudioRef.current,
    isPlaying: isPlayingPodcast,
    currentTime: podcastCurrentTime,
    duration: podcastDuration,
    play: () => {
      if (podcastAudioRef.current && !isPlayingPodcast) {
        podcastAudioRef.current.play().catch(error => {
          console.error('🎵 Podcast: Error playing audio:', error);
          setIsPlayingPodcast(false);
        });
      }
    },
    pause: () => {
      if (podcastAudioRef.current && isPlayingPodcast) {
        podcastAudioRef.current.pause();
      }
    },
    stop: () => {
      if (podcastAudioRef.current) {
        podcastAudioRef.current.pause();
        podcastAudioRef.current.currentTime = 0;
      }
    },
    seek: (time) => {
      if (podcastAudioRef.current && podcastDuration) {
        podcastAudioRef.current.currentTime = Math.max(0, Math.min(podcastDuration, time));
      }
    },
    setVolume: (volume) => {
      if (podcastAudioRef.current) {
        podcastAudioRef.current.volume = Math.max(0, Math.min(1, volume));
      }
    },
    setPlaybackRate: (rate) => {
      if (podcastAudioRef.current) {
        podcastAudioRef.current.playbackRate = Math.max(0.25, Math.min(4, rate));
      }
    }
  } : null;

  // Chapter audio data for dropdown
  const chapterAudio = hasPodcast ? {
    isActive: true,
    url: podcastUrl,
    chapterNumber,
    audioControls: podcastAudioControls
  } : null;

  // Determine tooltip content
  const getTooltipContent = () => {
    if (hasAnyAudio) {
      const playingStatus = isPlayingTts || isPlayingPodcast;
      return playingStatus ? 'Audio playing - click for controls' : 'Audio player';
    }
    return 'Audio coming soon';
  };

  // Determine if currently playing any audio
  const isPlaying = isPlayingTts || isPlayingPodcast;

  return (
    <div className={styles.ttsButtonWrapper} ref={dropdownWrapperRef}>
      <ActionButtonTooltip 
        content={getTooltipContent()}
        placement="left"
        disabled={isDropdownOpen}
      >
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className={`${styles.ttsButton} ${!hasAnyAudio ? styles.inactive : ''} ${isPlaying ? styles.playing : ''} ${isDropdownOpen ? styles.active : ''}`}
          aria-label={hasAnyAudio ? 'Audio player controls' : 'Audio not available'}
          aria-expanded={isDropdownOpen}
        >
          <img 
            src={getCurrentIcon()}
            alt="" 
            className={styles.buttonIcon}
          />
        </button>
      </ActionButtonTooltip>

      {/* Audio Dropdown - positioned relative to button */}
      {isDropdownOpen && hasAnyAudio && (
        <TTSDropdown
          isOpen={isDropdownOpen}
          onClose={handleDropdownClose}
          triggerRef={buttonRef}
          ttsData={ttsData}
          audioControls={ttsAudioControls}
          chapterAudio={chapterAudio}
        />
      )}
    </div>
  );
}
