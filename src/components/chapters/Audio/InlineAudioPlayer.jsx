// src/components/chapters/Audio/InlineAudioPlayer.jsx - Fresh clean version
import React, { useRef, useEffect, useState } from 'react';
import { getAudioUrl, getTrackDisplayName } from '../../../utils/audioUtils';
import styles from './InlineAudioPlayer.module.css';

const InlineAudioPlayer = ({ 
  chapterNumber,
  audioFiles = {},
  onClose
}) => {
  // Simple Audio Player Component - Working version with proper layout
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

    return (
      <div className={styles.simpleAudioPlayer}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* LINE 1 - Progress bar only */}
        <div className={styles.progressRow}>
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

        {/* DESKTOP LAYOUT - Single row with all controls */}
        <div className={styles.desktopControls}>
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
          
          <div className={styles.speedControl}>
            <img src="/img/audio_player/speed.svg" alt="Speed" className={styles.settingIcon} />
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={playbackRate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                setPlaybackRate(newRate);
                if (audioRef.current) audioRef.current.playbackRate = newRate;
              }}
              className={styles.speedSlider}
              title="Playback speed"
            />
            <span className={styles.speedLabel}>{playbackRate}×</span>
          </div>
          
          <div className={styles.volumeControl}>
            <img src={getVolumeIcon()} alt="Volume" className={styles.settingIcon} />
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
          
          <button className={styles.downloadButton} onClick={handleDownload} title="Download audio">
            <img src="/img/audio_player/download.svg" alt="Download" className={styles.settingIcon} />
          </button>
        </div>

        {/* MOBILE LAYOUT - Multiple rows */}
        <div className={styles.mobileControls}>
          {/* Mobile Row 1: Play controls */}
          <div className={styles.mobilePlayRow}>
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
          </div>
          
          {/* Mobile Row 2: Other controls */}
          <div className={styles.mobileSettingsRow}>
            <div className={styles.speedControl}>
              <img src="/img/audio_player/speed.svg" alt="Speed" className={styles.settingIcon} />
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={playbackRate}
                onChange={(e) => {
                  const newRate = parseFloat(e.target.value);
                  setPlaybackRate(newRate);
                  if (audioRef.current) audioRef.current.playbackRate = newRate;
                }}
                className={styles.speedSlider}
                title="Playback speed"
              />
              <span className={styles.speedLabel}>{playbackRate}×</span>
            </div>
            
            <div className={styles.volumeControl}>
              <img src={getVolumeIcon()} alt="Volume" className={styles.settingIcon} />
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
            
            <button className={styles.downloadButton} onClick={handleDownload} title="Download audio">
              <img src="/img/audio_player/download.svg" alt="Download" className={styles.settingIcon} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Build audio files object
  const chapterAudioFiles = {};
  if (audioFiles.podcast) chapterAudioFiles.podcast = audioFiles.podcast;
  if (audioFiles.transcript) chapterAudioFiles.transcript = audioFiles.transcript;
  if (audioFiles.discussion) chapterAudioFiles.discussion = audioFiles.discussion;

  if (Object.keys(chapterAudioFiles).length === 0) {
    return null;
  }

  return (
    <div className={styles.inlineAudioPlayer}>
      {/* Close button only - top right */}
      <div className={styles.inlineControls}>
        <button className={styles.closeButton} onClick={onClose} title="Close audio player">
          ×
        </button>
      </div>

      {/* Render audio players for each audio file */}
      {Object.entries(chapterAudioFiles).map(([trackType, filename]) => {
        const audioUrl = getAudioUrl(chapterNumber, filename);
        const trackDisplayName = getTrackDisplayName(trackType);
        
        return (
          <div key={trackType} className={styles.audioTrack}>
            {Object.keys(chapterAudioFiles).length > 1 && (
              <div className={styles.trackLabel}>{trackDisplayName}</div>
            )}
            <SimpleAudioPlayer 
              audioUrl={audioUrl}
              trackType={trackDisplayName}
              chapterNumber={chapterNumber}
              chapterTitle={`Chapter ${chapterNumber}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default InlineAudioPlayer;
