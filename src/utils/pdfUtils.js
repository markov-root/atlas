// src/utils/pdfUtils.js - Utility functions for handling PDF files (local only)

/**
 * Check if a local PDF file exists by making a GET request and checking content
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The PDF filename to check
 * @returns {Promise<boolean>} Whether the local file exists
 */
async function checkLocalPdfExists(chapterNumber, filename) {
  const localUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/pdf/${filename}`;
  
  console.log(`🔍 Checking if PDF exists: ${localUrl}`);
  
  try {
    const response = await fetch(localUrl, { method: 'GET' });
    
    console.log(`📄 Response status for ${localUrl}: ${response.status}`);
    
    // Check if response is OK and content type indicates a PDF
    if (!response.ok) {
      console.log(`❌ PDF check failed for ${localUrl}: status ${response.status}`);
      return false;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type for ${localUrl}: ${contentType}`);
    
    // Check if it's actually a PDF file
    if (contentType && contentType.includes('application/pdf')) {
      console.log(`✅ PDF exists and is valid: ${localUrl}`);
      return true;
    }
    
    // If content-type is not PDF, check if response looks like HTML (404 page)
    const text = await response.text();
    const isHtmlResponse = text.includes('<html') || text.includes('<!DOCTYPE');
    
    if (isHtmlResponse) {
      console.log(`❌ PDF check failed for ${localUrl}: got HTML response (likely 404 page)`);
      return false;
    }
    
    // If we got here, it might be a PDF without proper content-type
    console.log(`⚠️ PDF might exist but has unusual content-type: ${localUrl}`);
    return text.startsWith('%PDF'); // Check if it starts with PDF magic number
    
  } catch (error) {
    console.log(`❌ PDF check failed for ${localUrl}:`, error);
    return false;
  }
}

/**
 * Build PDF file path - only checks for local files
 * @param {Object} frontMatter - Not used anymore, kept for compatibility
 * @param {string|number} chapterNumber - The chapter number
 * @returns {Promise<{type: string, url: string|null, isActive: boolean}>} PDF availability info
 */
export async function buildPdfFile(frontMatter, chapterNumber) {
  // Only check for local file
  const localFilename = 'main.pdf';
  const localExists = await checkLocalPdfExists(chapterNumber, localFilename);
  
  if (localExists) {
    const localUrl = `/chapters/${chapterNumber.toString().padStart(2, '0')}/pdf/${localFilename}`;
    return {
      type: 'local',
      url: localUrl,
      isActive: true
    };
  }
  
  // No local PDF available - deactivate button
  return {
    type: 'none',
    url: null,
    isActive: false
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
 * Debug function to log PDF file information
 * @param {string} context - Context for the debug log
 * @param {Object} data - Data to log
 */
export function debugPdfFiles(context, data) {
  console.log(`📄 ${context} PDF debug:`, data);
}
