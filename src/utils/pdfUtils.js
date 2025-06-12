// src/utils/pdfUtils.js - Utility functions for handling PDF files (local only)

/**
 * Common PDF filename patterns to try
 * @param {string|number} chapterNumber - The chapter number
 * @returns {string[]} Array of possible PDF filenames
 */
function getPossiblePdfFilenames(chapterNumber) {
  const chapterNum = parseInt(chapterNumber, 10);
  const chapterNumStr = String(chapterNumber).padStart(2, '0');
  
  return [
    `ch${chapterNum}.pdf`,           // ch1.pdf (matches your actual files)
    `chapter${chapterNum}.pdf`,      // chapter1.pdf
    `chapter_${chapterNumStr}.pdf`,  // chapter_01.pdf
    `${chapterNumStr}.pdf`,          // 01.pdf
    `${chapterNum}.pdf`,             // 1.pdf
    'main.pdf',                      // main.pdf (fallback)
    'chapter.pdf',                   // chapter.pdf
    'content.pdf',                   // content.pdf
    'document.pdf'                   // document.pdf
  ];
}

/**
 * Check if a local PDF file exists by making a GET request and checking content
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The PDF filename to check
 * @returns {Promise<{exists: boolean, filename: string}>} Whether the local file exists and its filename
 */
async function checkLocalPdfExists(chapterNumber, filename) {
  const localUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/pdf/${filename}`;
  
  console.log(`🔍 Checking if PDF exists: ${localUrl}`);
  
  try {
    const response = await fetch(localUrl, { method: 'HEAD' }); // Use HEAD request for efficiency
    
    console.log(`📄 Response status for ${localUrl}: ${response.status}`);
    
    // Check if response is OK
    if (!response.ok) {
      console.log(`❌ PDF check failed for ${localUrl}: status ${response.status}`);
      return { exists: false, filename };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type for ${localUrl}: ${contentType}`);
    
    // Check if it's actually a PDF file
    if (contentType && contentType.includes('application/pdf')) {
      console.log(`✅ PDF exists and is valid: ${localUrl}`);
      return { exists: true, filename };
    }
    
    // If content-type is not PDF, try a GET request to check content
    console.log(`⚠️ Checking content for ${localUrl} (unusual content-type)`);
    const getResponse = await fetch(localUrl, { method: 'GET' });
    
    if (!getResponse.ok) {
      return { exists: false, filename };
    }
    
    // Read just the first few bytes to check PDF magic number
    const buffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(buffer.slice(0, 5));
    const header = String.fromCharCode(...uint8Array);
    
    if (header.startsWith('%PDF')) {
      console.log(`✅ PDF exists with unusual content-type: ${localUrl}`);
      return { exists: true, filename };
    }
    
    console.log(`❌ File exists but is not a PDF: ${localUrl}`);
    return { exists: false, filename };
    
  } catch (error) {
    console.log(`❌ PDF check failed for ${localUrl}:`, error);
    return { exists: false, filename };
  }
}

/**
 * Find any PDF file in the chapter's PDF directory
 * @param {string|number} chapterNumber - The chapter number
 * @returns {Promise<{exists: boolean, filename: string|null}>} PDF availability info
 */
async function findAnyPdfInChapter(chapterNumber) {
  const possibleFilenames = getPossiblePdfFilenames(chapterNumber);
  
  console.log(`🔍 Searching for PDF files in chapter ${chapterNumber}:`, possibleFilenames);
  
  // Try each possible filename
  for (const filename of possibleFilenames) {
    const result = await checkLocalPdfExists(chapterNumber, filename);
    if (result.exists) {
      console.log(`✅ Found PDF: ${filename} for chapter ${chapterNumber}`);
      return { exists: true, filename };
    }
  }
  
  console.log(`❌ No PDF found for chapter ${chapterNumber}`);
  return { exists: false, filename: null };
}

/**
 * Build PDF file path - checks for any PDF file in the directory
 * @param {Object} frontMatter - Not used anymore, kept for compatibility
 * @param {string|number} chapterNumber - The chapter number
 * @returns {Promise<{type: string, url: string|null, isActive: boolean, filename: string|null}>} PDF availability info
 */
export async function buildPdfFile(frontMatter, chapterNumber) {
  // Check if any PDF exists in the chapter directory
  const pdfResult = await findAnyPdfInChapter(chapterNumber);
  
  if (pdfResult.exists && pdfResult.filename) {
    const localUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/pdf/${pdfResult.filename}`;
    return {
      type: 'local',
      url: localUrl,
      isActive: true,
      filename: pdfResult.filename
    };
  }
  
  // No local PDF available - deactivate button
  return {
    type: 'none',
    url: null,
    isActive: false,
    filename: null
  };
}

/**
 * Get PDF URL from the PDF data object
 * @param {Object} pdfData - The PDF data object
 * @returns {string|null} The URL or null
 */
export function getPdfUrl(pdfData) {
  return pdfData ? pdfData.url : null;
}

/**
 * Check if PDF is available
 * @param {Object} pdfData - The PDF data object
 * @returns {boolean} Whether PDF is available
 */
export function hasPdfFile(pdfData) {
  return !!(pdfData && pdfData.isActive && pdfData.url);
}

/**
 * Get the actual filename of the PDF
 * @param {Object} pdfData - The PDF data object
 * @returns {string|null} The filename or null
 */
export function getPdfFilename(pdfData) {
  return pdfData ? pdfData.filename : null;
}

/**
 * Debug function to log PDF file information
 * @param {string} context - Context for the debug log
 * @param {Object} data - Data to log
 */
export function debugPdfFiles(context, data) {
  console.log(`📄 ${context} PDF debug:`, data);
}
