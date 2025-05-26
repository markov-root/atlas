// src/components/chapters/Audio/MinimalAudioPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import styles from './InlineAudioPlayer.module.css';

const MinimalAudioPlayer = ({ 
  chapterNumber,
  audioFiles = {},
  onClose
}) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  // Audio state
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1
  });
  
  const [activeTrack, setActiveTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Build audio file URLs
  const getAudioUrl = (filename) => {
    if (!filename) return null;
    return `/chapters/${chapterNumber.toString().padStart(2, '0')}/${filename}`;
  };

  // Available tracks
  const tracks = [];
  if (audioFiles.podcast) {
    tracks.push({
      id: 'podcast',
      name: 'Podcast',
      url: getAudioUrl(audioFiles.podcast)
    });
  }
  if (audioFiles.transcript) {
    tracks.push({
      id: 'transcript', 
      name: 'Reading',
      url: getAudioUrl(audioFiles.transcript)
    });
  }

  // Load and play a track
  const loadTrack = (track) => {
    if (!track || !track.url) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Stop current playback
    if (audioState.isPlaying) {
      audio.pause();
    }

    setActiveTrack(track);
    setIsLoading(true);
    setHasError(false);
    
    audio.src = track.url;
    audio.load();
  };

  // Initialize audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setAudioState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
      }
    };

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    const handleVolumeChange = () => {
      setAudioState(prev => ({ ...prev, volume: audio.volume }));
    };

    const handleRateChange = () => {
      setAudioState(prev => ({ ...prev, playbackRate: audio.playbackRate }));
    };

    // Set up event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('ratechange', handleRateChange);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ratechange', handleRateChange);
    };
  }, [isDragging]);

  // Auto-load first available track
  useEffect(() => {
    if (tracks.length > 0 && !activeTrack) {
      loadTrack(tracks[0]);
    }
  }, [tracks.length]);

  // Handle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || isLoading || hasError || !activeTrack) return;

    if (audioState.isPlaying) {
      audio.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().then(() => {
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      }).catch((error) => {
        console.error('Playback failed:', error);
        setHasError(true);
      });
    }
  };

  // Handle skip backward/forward
  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setAudioState(prev => ({ ...prev, currentTime: newTime }));
  };

  // Handle progress bar interaction
  const handleProgressInteraction = (e) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !audioState.duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioState.duration;

    audio.currentTime = newTime;
    setAudioState(prev => ({ ...prev, currentTime: newTime }));
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  };

  // Handle speed change
  const handleSpeedChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newRate = parseFloat(e.target.value);
    audio.playbackRate = newRate;
    setAudioState(prev => ({ ...prev, playbackRate: newRate }));
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.volume > 0) {
      audio.volume = 0;
      setAudioState(prev => ({ ...prev, volume: 0 }));
    } else {
      audio.volume = 1;
      setAudioState(prev => ({ ...prev, volume: 1 }));
    }
  };

  // Handle close - mute and close
  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.volume = 0;
    }
    setAudioState(prev => ({ ...prev, isPlaying: false, volume: 0 }));
    onClose();
  };

  // Format time display
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0;

  return (
    <div className={styles.audioPlayer}>
      <audio ref={audioRef} preload="metadata" />
      
      <div className={styles.playerRow}>
        {/* Track buttons (if multiple tracks) */}
        {tracks.length > 1 && (
          <div className={styles.trackButtons}>
            {tracks.map(track => (
              <button
                key={track.id}
                className={`${styles.trackButton} ${activeTrack?.id === track.id ? styles.activeTrack : ''}`}
                onClick={() => loadTrack(track)}
                title={track.name}
              >
                {track.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Controls */}
        <div className={styles.mainControls}>
          <button 
            className={styles.controlButton}
            onClick={() => skip(-15)}
            disabled={isLoading || hasError}
            title="Skip back 15s"
          >
            <SkipBack size={16} />
          </button>

          <button 
            className={styles.playButton}
            onClick={togglePlayPause}
            disabled={isLoading || hasError}
            title={audioState.isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner} />
            ) : hasError ? (
              <span>!</span>
            ) : audioState.isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>

          <button 
            className={styles.controlButton}
            onClick={() => skip(30)}
            disabled={isLoading || hasError}
            title="Skip forward 30s"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        {!isLoading && !hasError && (
          <div className={styles.progressContainer}>
            <span className={styles.timeDisplay}>{formatTime(audioState.currentTime)}</span>
            <div 
              ref={progressRef}
              className={styles.progressBar}
              onClick={handleProgressInteraction}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
            >
              <div 
                className={styles.progressFill}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className={styles.timeDisplay}>{formatTime(audioState.duration)}</span>
          </div>
        )}

        {/* Volume Control */}
        <div className={styles.volumeControl}>
          <button 
            onClick={toggleMute}
            className={styles.controlButton}
            title={audioState.volume === 0 ? 'Unmute' : 'Mute'}
          >
            {audioState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioState.volume}
            onChange={handleVolumeChange}
            className={styles.slider}
            title="Volume"
          />
        </div>

        {/* Speed Control */}
        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>{audioState.playbackRate}×</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={audioState.playbackRate}
            onChange={handleSpeedChange}
            className={styles.slider}
            title="Playback speed"
          />
        </div>

        {/* Close Button */}
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          title="Close audio player"
        >
          <X size={16} />
        </button>
      </div>

      {/* Error State */}
      {hasError && (
        <div className={styles.errorMessage}>
          Failed to load audio
        </div>
      )}
    </div>
  );
};

export default MinimalAudioPlayer;
