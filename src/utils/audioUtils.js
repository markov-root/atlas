// src/utils/audioUtils.js - Utility functions for handling audio files

/**
 * Build audio files object from frontmatter and provide smart fallbacks
 * @param {Object} frontMatter - The frontmatter object from a chapter/section
 * @param {string|number} chapterNumber - The chapter number
 * @returns {Object} Audio files object with type -> filename mapping
 */
export function buildAudioFiles(frontMatter, chapterNumber) {
  const audioFiles = {};
  
  // Check for specific audio file types
  if (frontMatter.audio_podcast) audioFiles.podcast = frontMatter.audio_podcast;
  if (frontMatter.audio_transcript) audioFiles.transcript = frontMatter.audio_transcript;
  if (frontMatter.audio_discussion) audioFiles.discussion = frontMatter.audio_discussion;

  // Fallback for existing audio_link - extract just the filename
  if (Object.keys(audioFiles).length === 0 && frontMatter.audio_link) {
    const audioFilename = frontMatter.audio_link.split('/').pop();
    if (audioFilename && audioFilename.includes('.')) {
      // Assume it's a podcast if no type is specified
      audioFiles.podcast = audioFilename;
    }
  }
  
  // Smart fallback: look for common audio filenames if no explicit audio files are specified
  if (Object.keys(audioFiles).length === 0) {
    // Convert to integer to remove any zero-padding, then back to string
    const chapterNum = parseInt(chapterNumber, 10);
    const chapterNumStr = String(chapterNumber).padStart(2, '0');
    
    // Common patterns for audio files based on the actual file structure
    // Use chapterNum (without padding) for the filename
    const commonAudioPatterns = [
      `ch${chapterNum}.mp3`,           // ch1.mp3 (matches your actual files)
      `chapter${chapterNum}.mp3`,      // chapter1.mp3
      `chapter_${chapterNumStr}.mp3`,  // chapter_01.mp3
      `${chapterNumStr}.mp3`,          // 01.mp3
      `${chapterNum}.mp3`,             // 1.mp3
      `podcast_${chapterNum}.mp3`,     // podcast_1.mp3
      `audio_${chapterNum}.mp3`        // audio_1.mp3
    ];
    
    // Use the first pattern as fallback (matches your ch1.mp3 structure)
    audioFiles.podcast = `ch${chapterNum}.mp3`;
  }
  
  return audioFiles;
}

/**
 * Generate audio file URL for the new folder structure
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The audio filename
 * @returns {string} The full URL path to the audio file
 */
export function getAudioUrl(chapterNumber, filename) {
  if (!filename) return null;
  // Updated path structure: /chapters/XX/audio/filename.mp3
  // Keep zero-padding for the folder path to match your folder structure (01, 02, etc.)
  return `/chapters/${chapterNumber.toString().padStart(2, '0')}/audio/${filename}`;
}

/**
 * Check if audio files are available (helper for components)
 * @param {Object} audioFiles - Audio files object
 * @returns {boolean} Whether any audio files are available
 */
export function hasAudioFiles(audioFiles) {
  return Object.keys(audioFiles).length > 0 && 
         Object.values(audioFiles).some(file => file && file.trim() !== '');
}

/**
 * Get display name for audio track type
 * @param {string} trackType - The track type ('podcast', 'transcript', 'discussion')
 * @returns {string} Human-readable display name
 */
export function getTrackDisplayName(trackType) {
  const displayNames = {
    podcast: 'Podcast',
    transcript: 'Reading',
    discussion: 'Discussion',
    audio: 'Audio' // fallback
  };
  
  return displayNames[trackType] || 'Audio';
}

/**
 * Debug function to log audio file information
 * @param {string} context - Context for the debug log
 * @param {Object} data - Data to log
 */
export function debugAudioFiles(context, data) {
  console.log(`🎵 ${context} audio debug:`, data);
}
