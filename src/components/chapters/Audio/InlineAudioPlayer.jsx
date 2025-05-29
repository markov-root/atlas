import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Download
} from 'lucide-react';
import { AudioControlTooltip } from '../../UI/Tooltip';
import { getAudioUrl, getTrackDisplayName, debugAudioFiles } from '../../../utils/audioUtils';
import styles from './InlineAudioPlayer.module.css';

const InlineAudioPlayer = ({ 
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

  // Build audio file URLs - Updated for new folder structure
  const buildAudioUrl = (filename) => {
    return getAudioUrl(chapterNumber, filename);
  };

  // Available tracks
  const tracks = [];
  if (audioFiles.podcast) {
    tracks.push({
      id: 'podcast',
      name: getTrackDisplayName('podcast'),
      url: buildAudioUrl(audioFiles.podcast)
    });
  }
  if (audioFiles.transcript) {
    tracks.push({
      id: 'transcript', 
      name: getTrackDisplayName('transcript'),
      url: buildAudioUrl(audioFiles.transcript)
    });
  }
  if (audioFiles.discussion) {
    tracks.push({
      id: 'discussion',
      name: getTrackDisplayName('discussion'), 
      url: buildAudioUrl(audioFiles.discussion)
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

    const handleError = (e) => {
      console.error('Audio loading error:', e);
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

  // Handle close - fixed function name
  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
    onClose();
  };

  // Handle download
  const handleDownload = () => {
    if (!activeTrack || !activeTrack.url) return;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = activeTrack.url;
    link.download = `Chapter_${chapterNumber}_${activeTrack.name}.mp3`;
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Debug logging for audio file paths
  debugAudioFiles('InlineAudioPlayer', {
    chapterNumber,
    audioFiles,
    tracks: tracks.map(t => ({ name: t.name, url: t.url })),
    activeTrack: activeTrack?.name
  });

  return (
    <div className={styles.audioPlayer}>
      <audio ref={audioRef} preload="metadata" />
      
      <div className={styles.playerRow}>
        {/* Track buttons (if multiple tracks) */}
        {tracks.length > 1 && (
          <div className={styles.trackButtons}>
            {tracks.map(track => (
              <AudioControlTooltip 
                key={track.id}
                content={`Switch to ${track.name}`}
              >
                <button
                  className={`${styles.trackButton} ${activeTrack?.id === track.id ? styles.activeTrack : ''}`}
                  onClick={() => loadTrack(track)}
                >
                  {track.name}
                </button>
              </AudioControlTooltip>
            ))}
          </div>
        )}

        {/* Main Controls */}
        <div className={styles.mainControls}>
          <AudioControlTooltip content="Skip back 15 seconds">
            <button 
              className={styles.controlButton}
              onClick={() => skip(-15)}
              disabled={isLoading || hasError}
            >
              <SkipBack size={16} />
            </button>
          </AudioControlTooltip>

          <AudioControlTooltip 
            content={
              isLoading ? 'Loading...' : 
              hasError ? 'Error loading audio' : 
              audioState.isPlaying ? 'Pause' : 'Play'
            }
          >
            <button 
              className={styles.playButton}
              onClick={togglePlayPause}
              disabled={isLoading || hasError}
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
          </AudioControlTooltip>

          <AudioControlTooltip content="Skip forward 30 seconds">
            <button 
              className={styles.controlButton}
              onClick={() => skip(30)}
              disabled={isLoading || hasError}
            >
              <SkipForward size={16} />
            </button>
          </AudioControlTooltip>
        </div>

        {/* Progress Bar */}
        {!isLoading && !hasError && (
          <div className={styles.progressContainer}>
            <span className={styles.timeDisplay}>{formatTime(audioState.currentTime)}</span>
            <AudioControlTooltip content="Click to seek">
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
            </AudioControlTooltip>
            <span className={styles.timeDisplay}>{formatTime(audioState.duration)}</span>
          </div>
        )}

        {/* Volume Control */}
        <div className={styles.volumeControl}>
          <AudioControlTooltip content={audioState.volume === 0 ? 'Unmute' : 'Mute'}>
            <button 
              onClick={toggleMute}
              className={styles.controlButton}
            >
              {audioState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </AudioControlTooltip>
          <AudioControlTooltip content="Adjust volume">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={audioState.volume}
              onChange={handleVolumeChange}
              className={styles.slider}
            />
          </AudioControlTooltip>
        </div>

        {/* Speed Control */}
        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>{audioState.playbackRate}×</span>
          <AudioControlTooltip content="Adjust playback speed">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={audioState.playbackRate}
              onChange={handleSpeedChange}
              className={styles.slider}
            />
          </AudioControlTooltip>
        </div>

        {/* Download Button */}
        <AudioControlTooltip content={activeTrack ? `Download ${activeTrack.name}` : "No audio to download"}>
          <button 
            className={styles.downloadButton}
            onClick={handleDownload}
            disabled={!activeTrack}
          >
            <Download size={16} />
          </button>
        </AudioControlTooltip>

        {/* Close Button */}
        <AudioControlTooltip content="Close audio player">
          <button 
            className={styles.closeButton}
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </AudioControlTooltip>
      </div>

      {/* Error State */}
      {hasError && (
        <div className={styles.errorMessage}>
          Failed to load audio. Check if file exists at: {activeTrack?.url}
        </div>
      )}
    </div>
  );
};

export default InlineAudioPlayer;
