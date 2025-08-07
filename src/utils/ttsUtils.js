// src/utils/ttsUtils.js - Fixed version with robust TTS detection

/**
 * Extract current page info from location pathname
 * @param {Object} location - The location object (from React Router or similar)
 * @returns {Object} Object with chapterNumber, sectionNumber, pageType
 */
export function getCurrentPageInfo(location) {
  if (!location?.pathname) {
    return { chapterNumber: null, sectionNumber: null, pageType: 'unknown' };
  }

  const pathname = location.pathname;
  
  // Only process paths that start with /chapters/
  if (!pathname.startsWith('/chapters/')) {
    return { chapterNumber: null, sectionNumber: null, pageType: 'non-chapter' };
  }

  // Match section pages: /chapters/02/01
  const sectionMatch = pathname.match(/^\/chapters\/(\d+)\/(\d+)\/?$/);
  if (sectionMatch) {
    return {
      chapterNumber: sectionMatch[1],
      sectionNumber: sectionMatch[2],
      pageType: 'section'
    };
  }

  // Match chapter index pages: /chapters/02/ or /chapters/02
  const chapterMatch = pathname.match(/^\/chapters\/(\d+)\/?$/);
  if (chapterMatch) {
    return {
      chapterNumber: chapterMatch[1],
      sectionNumber: null,
      pageType: 'chapter'
    };
  }

  // If it starts with /chapters/ but doesn't match our patterns, it's unknown chapter-related page
  return { chapterNumber: null, sectionNumber: null, pageType: 'unknown' };
}

/**
 * Get the exact TTS filename for the current page - STATIC NAMING CONVENTION
 * @param {string} chapterNumber - The chapter number
 * @param {string|null} sectionNumber - The section number (null for chapter index)
 * @returns {string} The expected TTS filename
 */
function getExpectedTtsFilename(chapterNumber, sectionNumber) {
  if (sectionNumber) {
    // For sections like /chapters/02/01 -> 01.mp3
    return `${sectionNumber.padStart(2, '0')}.mp3`;
  } else {
    // For chapter index like /chapters/02/ -> index.mp3
    return 'index.mp3';
  }
}

/**
 * Check if a TTS file exists - SIMPLIFIED VERSION copying PDF detection pattern
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The TTS filename to check
 * @returns {Promise<{exists: boolean, filename: string}>} Whether the file exists and its filename
 */
async function checkTtsExists(chapterNumber, filename) {
  const ttsUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/tts/${filename}`;
  
  console.log(`🔍 TTS CHECK: ${ttsUrl}`);
  
  try {
    // Try HEAD request first (same as PDF detection)
    const response = await fetch(ttsUrl, { method: 'HEAD' });
    
    console.log(`🎵 TTS response for ${ttsUrl}: ${response.status}`);
    
    if (!response.ok) {
      console.log(`❌ TTS NOT FOUND: ${filename} - status ${response.status}`);
      return { exists: false, filename };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log(`🎵 TTS Content-Type: ${contentType}`);
    
    // Reject HTML content immediately  
    if (contentType && contentType.includes('text/html')) {
      console.log(`❌ TTS REJECTED - HTML: ${filename}`);
      return { exists: false, filename };
    }
    
    // Accept audio or unknown content types (like PDF detection does)
    console.log(`✅ TTS FOUND: ${filename}`);
    return { exists: true, filename };
    
  } catch (error) {
    console.log(`❌ TTS ERROR: ${filename}`, error.message);
    return { exists: false, filename };
  }
}

/**
 * Find TTS file for the current page - SIMPLIFIED VERSION
 * @param {string|number} chapterNumber - The chapter number
 * @param {string|null} sectionNumber - The section number (null for chapter index)
 * @returns {Promise<{exists: boolean, filename: string|null}>} TTS availability info
 */
async function findTtsForPage(chapterNumber, sectionNumber) {
  const expectedFilename = getExpectedTtsFilename(chapterNumber, sectionNumber);
  
  console.log(`🔍 TTS SEARCH in chapter ${chapterNumber}${sectionNumber ? `, section ${sectionNumber}` : ' (index)'}: ${expectedFilename}`);
  
  const result = await checkTtsExists(chapterNumber, expectedFilename);
  
  if (result.exists) {
    console.log(`✅ TTS FOUND: ${expectedFilename}`);
    return { exists: true, filename: expectedFilename };
  }
  
  console.log(`❌ TTS NOT FOUND: ${expectedFilename}`);
  return { exists: false, filename: null };
}

/**
 * Build TTS file data for current page - SIMPLIFIED VERSION copying PDF pattern
 * @param {Object} location - The location object
 * @returns {Promise<{type: string, url: string|null, isActive: boolean, filename: string|null, pageInfo: Object}>} TTS availability info
 */
export async function buildTtsFile(location) {
  const pageInfo = getCurrentPageInfo(location);
  
  console.log(`🎯 TTS BUILD for:`, pageInfo);
  
  // Only process chapter and section pages
  if (pageInfo.pageType === 'non-chapter' || pageInfo.pageType === 'unknown' || !pageInfo.chapterNumber) {
    console.log(`❌ TTS SKIPPED - Wrong page type: ${pageInfo.pageType}, path: ${location?.pathname}`);
    return {
      type: 'none',
      url: null,
      isActive: false,
      filename: null,
      pageInfo
    };
  }
  
  // Get the exact expected filename (static naming convention)
  const expectedFilename = getExpectedTtsFilename(pageInfo.chapterNumber, pageInfo.sectionNumber);
  
  console.log(`🎯 TTS expected filename: ${expectedFilename}`);
  
  // Check if TTS exists for this page (copy PDF detection pattern exactly)
  const ttsResult = await checkTtsExists(pageInfo.chapterNumber, expectedFilename);
  
  if (ttsResult.exists && ttsResult.filename) {
    const ttsUrl = `/chapters/${pageInfo.chapterNumber.toString().padStart(2, '0')}/tts/${ttsResult.filename}`;
    console.log(`✅ TTS FINAL RESULT: Active with ${ttsUrl}`);
    return {
      type: 'local',
      url: ttsUrl,
      isActive: true,
      filename: ttsResult.filename,
      pageInfo
    };
  }
  
  // No TTS available
  console.log(`❌ TTS FINAL RESULT: Inactive for ${location?.pathname}`);
  return {
    type: 'none',
    url: null,
    isActive: false,
    filename: null,
    pageInfo
  };
}

/**
 * Get TTS URL from the TTS data object
 * @param {Object} ttsData - The TTS data object
 * @returns {string|null} The URL or null
 */
export function getTtsUrl(ttsData) {
  return ttsData ? ttsData.url : null;
}

/**
 * Check if TTS is available
 * @param {Object} ttsData - The TTS data object
 * @returns {boolean} Whether TTS is available
 */
export function hasTtsFile(ttsData) {
  return !!(ttsData && ttsData.isActive && ttsData.url);
}

/**
 * Get the actual filename of the TTS file
 * @param {Object} ttsData - The TTS data object
 * @returns {string|null} The filename or null
 */
export function getTtsFilename(ttsData) {
  return ttsData ? ttsData.filename : null;
}

/**
 * Get display title for TTS based on page info
 * @param {Object} ttsData - The TTS data object
 * @returns {string} Human-readable title for the TTS
 */
export function getTtsDisplayTitle(ttsData) {
  if (!ttsData?.pageInfo) return 'Text to Speech';
  
  const { chapterNumber, sectionNumber, pageType } = ttsData.pageInfo;
  
  if (pageType === 'section') {
    return `Chapter ${chapterNumber}.${sectionNumber}`;
  } else if (pageType === 'chapter') {
    return `Chapter ${chapterNumber}`;
  }
  
  return 'Text to Speech';
}

/**
 * Debug function to log TTS file information
 * @param {string} context - Context for the debug log
 * @param {Object} data - Data to log
 */
export function debugTtsFiles(context, data) {
  console.log(`🎵 TTS ${context} debug:`, data);
}
