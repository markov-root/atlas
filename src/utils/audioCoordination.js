// src/utils/audioCoordination.js - Simple audio coordination utility

/**
 * Simple audio coordination system to ensure only one audio plays at a time
 * Uses DOM events for communication between different audio components
 */

let currentPlayingAudio = null;
let currentAudioType = null;

/**
 * Register an audio element as currently playing
 * @param {HTMLAudioElement} audioElement - The audio element that started playing
 * @param {string} audioType - Type of audio ('tts', 'chapter', 'podcast', etc.)
 */
export function registerPlayingAudio(audioElement, audioType) {
  // Pause any currently playing audio
  if (currentPlayingAudio && currentPlayingAudio !== audioElement) {
    pauseCurrentAudio();
  }
  
  currentPlayingAudio = audioElement;
  currentAudioType = audioType;
  
  console.log(`🎵 Audio coordination: ${audioType} audio started playing`);
}

/**
 * Unregister audio when it stops/pauses
 * @param {HTMLAudioElement} audioElement - The audio element that stopped
 */
export function unregisterPlayingAudio(audioElement) {
  if (currentPlayingAudio === audioElement) {
    currentPlayingAudio = null;
    currentAudioType = null;
    console.log(`🎵 Audio coordination: Audio stopped playing`);
  }
}

/**
 * Pause the currently playing audio
 */
export function pauseCurrentAudio() {
  if (currentPlayingAudio && !currentPlayingAudio.paused) {
    console.log(`🎵 Audio coordination: Pausing ${currentAudioType} audio`);
    currentPlayingAudio.pause();
  }
}

/**
 * Check if any audio is currently playing
 * @returns {boolean} True if audio is playing
 */
export function isAudioPlaying() {
  return currentPlayingAudio && !currentPlayingAudio.paused;
}

/**
 * Get info about currently playing audio
 * @returns {Object|null} Audio info or null
 */
export function getCurrentAudioInfo() {
  if (currentPlayingAudio && !currentPlayingAudio.paused) {
    return {
      audioElement: currentPlayingAudio,
      audioType: currentAudioType
    };
  }
  return null;
}

/**
 * Dispatch a custom event to notify all audio components
 * @param {string} eventType - Type of event ('pause', 'play', etc.)
 * @param {Object} detail - Event detail data
 */
export function dispatchAudioEvent(eventType, detail = {}) {
  const event = new CustomEvent(`audio-${eventType}`, { 
    detail: { ...detail, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
}

/**
 * Set up audio coordination for an audio element
 * @param {HTMLAudioElement} audioElement - The audio element to coordinate
 * @param {string} audioType - Type of audio ('tts', 'chapter', 'podcast', etc.)
 * @returns {function} Cleanup function
 */
export function setupAudioCoordination(audioElement, audioType) {
  if (!audioElement) return () => {};
  
  const handlePlay = () => {
    // Pause any OTHER audio that's currently playing
    if (currentPlayingAudio && currentPlayingAudio !== audioElement && !currentPlayingAudio.paused) {
      console.log(`🎵 Audio coordination: Pausing ${currentAudioType} due to ${audioType} starting`);
      currentPlayingAudio.pause();
    }
    
    // Register this audio as playing
    registerPlayingAudio(audioElement, audioType);
    dispatchAudioEvent('play', { audioType, audioElement });
  };
  
  const handlePause = () => {
    unregisterPlayingAudio(audioElement);
    dispatchAudioEvent('pause', { audioType, audioElement });
  };
  
  const handleEnded = () => {
    unregisterPlayingAudio(audioElement);
    dispatchAudioEvent('ended', { audioType, audioElement });
  };
  
  // Listen for external play events from other audio - but don't pause self
  const handleExternalPlay = (event) => {
    // Only pause if it's a different audio element and this one is playing
    if (event.detail?.audioElement !== audioElement && !audioElement.paused) {
      console.log(`🎵 Audio coordination: Pausing ${audioType} due to external ${event.detail?.audioType} starting`);
      audioElement.pause();
    }
  };
  
  audioElement.addEventListener('play', handlePlay);
  audioElement.addEventListener('pause', handlePause);
  audioElement.addEventListener('ended', handleEnded);
  window.addEventListener('audio-play', handleExternalPlay);
  
  // Cleanup function
  return () => {
    audioElement.removeEventListener('play', handlePlay);
    audioElement.removeEventListener('pause', handlePause);
    audioElement.removeEventListener('ended', handleEnded);
    window.removeEventListener('audio-play', handleExternalPlay);
    
    // Unregister if this was the current audio
    if (currentPlayingAudio === audioElement) {
      unregisterPlayingAudio(audioElement);
    }
  };
}
