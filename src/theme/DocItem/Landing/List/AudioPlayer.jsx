// src/theme/DocItem/Landing/ChapterList/AudioPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer({ audioUrl, trackType, chapterNumber, chapterTitle }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

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
}
