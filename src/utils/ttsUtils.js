// src/utils/ttsUtils.js - Fresh version with proper HTML rejection

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
 * Get possible TTS filenames for the current page
 * @param {string} chapterNumber - The chapter number
 * @param {string|null} sectionNumber - The section number (null for chapter index)
 * @returns {string[]} Array of possible TTS filenames to try
 */
function getPossibleTtsFilenames(chapterNumber, sectionNumber) {
  if (sectionNumber) {
    // For sections like /chapters/02/01 -> try 01.mp3
    return [`${sectionNumber}.mp3`];
  } else {
    // For chapter index like /chapters/02/ -> try index.mp3
    return ['index.mp3'];
  }
}

/**
 * Check if a TTS file exists - STRICT version that rejects HTML
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The TTS filename to check
 * @returns {Promise<{exists: boolean, filename: string}>} Whether the file exists and its filename
 */
async function checkTtsExists(chapterNumber, filename) {
  const ttsUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/tts/${filename}`;
  
  console.log(`🔍 NEW TTS CHECK: ${ttsUrl}`);
  
  try {
    // Try HEAD request first
    const response = await fetch(ttsUrl, { method: 'HEAD' });
    
    console.log(`🎵 NEW HEAD status for ${ttsUrl}: ${response.status}`);
    
    if (!response.ok) {
      console.log(`❌ NEW TTS REJECTED - Bad status: ${response.status} for ${ttsUrl}`);
      return { exists: false, filename };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log(`🎵 NEW Content-Type for ${ttsUrl}: ${contentType}`);
    
    // IMMEDIATE REJECTION for HTML content
    if (contentType && contentType.includes('text/html')) {
      console.log(`❌ NEW TTS REJECTED - HTML content type for ${ttsUrl}`);
      return { exists: false, filename };
    }
    
    // ACCEPT valid audio types
    if (contentType && (contentType.includes('audio/') || contentType.includes('application/octet-stream'))) {
      console.log(`✅ NEW TTS ACCEPTED - Valid audio type for ${ttsUrl}`);
      return { exists: true, filename };
    }
    
    // For unknown content types, do a small GET to check content
    console.log(`⚠️ NEW TTS CHECKING - Unknown content type for ${ttsUrl}`);
    
    const getResponse = await fetch(ttsUrl, { 
      method: 'GET',
      headers: { 'Range': 'bytes=0-200' }
    });
    
    if (!getResponse.ok) {
      console.log(`❌ NEW TTS REJECTED - GET failed for ${ttsUrl}`);
      return { exists: false, filename };
    }
    
    // Read the content to check if it's HTML
    const text = await getResponse.text();
    
    // Check for HTML indicators
    const lowerText = text.toLowerCase();
    if (lowerText.includes('<html') || 
        lowerText.includes('<!doctype') || 
        lowerText.includes('<title>') ||
        lowerText.includes('<head>') ||
        lowerText.includes('<body>') ||
        text.includes('404') ||
        text.includes('Not Found')) {
      console.log(`❌ NEW TTS REJECTED - Content is HTML for ${ttsUrl}`);
      return { exists: false, filename };
    }
    
    console.log(`✅ NEW TTS ACCEPTED - Content appears valid for ${ttsUrl}`);
    return { exists: true, filename };
    
  } catch (error) {
    console.log(`❌ NEW TTS ERROR for ${ttsUrl}:`, error.message);
    return { exists: false, filename };
  }
}

/**
 * Find TTS file for the current page
 * @param {string|number} chapterNumber - The chapter number
 * @param {string|null} sectionNumber - The section number (null for chapter index)
 * @returns {Promise<{exists: boolean, filename: string|null}>} TTS availability info
 */
async function findTtsForPage(chapterNumber, sectionNumber) {
  const possibleFilenames = getPossibleTtsFilenames(chapterNumber, sectionNumber);
  
  console.log(`🔍 NEW TTS SEARCH in chapter ${chapterNumber}${sectionNumber ? `, section ${sectionNumber}` : ' (index)'}:`, possibleFilenames);
  
  // Try each possible filename
  for (const filename of possibleFilenames) {
    const result = await checkTtsExists(chapterNumber, filename);
    if (result.exists) {
      console.log(`✅ NEW TTS FOUND: ${filename} for chapter ${chapterNumber}${sectionNumber ? `, section ${sectionNumber}` : ' (index)'}`);
      return { exists: true, filename };
    }
  }
  
  console.log(`❌ NEW TTS NOT FOUND for chapter ${chapterNumber}${sectionNumber ? `, section ${sectionNumber}` : ' (index)'}`);
  return { exists: false, filename: null };
}

/**
 * Build TTS file data for current page
 * @param {Object} location - The location object
 * @returns {Promise<{type: string, url: string|null, isActive: boolean, filename: string|null, pageInfo: Object}>} TTS availability info
 */
export async function buildTtsFile(location) {
  const pageInfo = getCurrentPageInfo(location);
  
  console.log(`🎯 NEW TTS BUILD for:`, pageInfo);
  
  // Only process chapter and section pages
  if (pageInfo.pageType === 'non-chapter' || pageInfo.pageType === 'unknown' || !pageInfo.chapterNumber) {
    console.log(`❌ NEW TTS SKIPPED - Wrong page type: ${pageInfo.pageType}, path: ${location?.pathname}`);
    return {
      type: 'none',
      url: null,
      isActive: false,
      filename: null,
      pageInfo
    };
  }
  
  // Check if TTS exists for this page
  const ttsResult = await findTtsForPage(pageInfo.chapterNumber, pageInfo.sectionNumber);
  
  if (ttsResult.exists && ttsResult.filename) {
    const ttsUrl = `/chapters/${pageInfo.chapterNumber.toString().padStart(2, '0')}/tts/${ttsResult.filename}`;
    console.log(`✅ NEW TTS FINAL RESULT: Active with ${ttsUrl}`);
    return {
      type: 'local',
      url: ttsUrl,
      isActive: true,
      filename: ttsResult.filename,
      pageInfo
    };
  }
  
  // No TTS available
  console.log(`❌ NEW TTS FINAL RESULT: Inactive for ${location?.pathname}`);
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
  console.log(`🎵 NEW TTS ${context} debug:`, data);
}
