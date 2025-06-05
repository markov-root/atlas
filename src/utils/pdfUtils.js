// src/utils/pdfUtils.js - Utility functions for handling PDF files

/**
 * Build PDF file path from frontmatter and provide smart fallbacks
 * @param {Object} frontMatter - The frontmatter object from a chapter/section
 * @param {string|number} chapterNumber - The chapter number
 * @returns {string|null} PDF filename or null if not available
 */
export function buildPdfFile(frontMatter, chapterNumber) {
  // First check if there's an explicit download_link in frontmatter
  if (frontMatter.download_link) {
    // If it's a full URL, return as-is
    if (frontMatter.download_link.startsWith('http')) {
      return frontMatter.download_link;
    }
    // If it's a relative path, extract just the filename
    const pdfFilename = frontMatter.download_link.split('/').pop();
    if (pdfFilename && pdfFilename.includes('.')) {
      return pdfFilename;
    }
  }
  
  // Smart fallback: look for common PDF filenames
  const chapterNum = parseInt(chapterNumber, 10);
  const chapterNumStr = String(chapterNumber).padStart(2, '0');
  
  // Common patterns for PDF files based on the actual file structure
  const commonPdfPatterns = [
    'main.pdf',                      // main.pdf (matches your actual files)
    `chapter${chapterNum}.pdf`,      // chapter1.pdf
    `chapter_${chapterNumStr}.pdf`,  // chapter_01.pdf
    `${chapterNumStr}.pdf`,          // 01.pdf
    `${chapterNum}.pdf`,             // 1.pdf
    `ch${chapterNum}.pdf`            // ch1.pdf
  ];
  
  // Use the first pattern as fallback (matches your main.pdf structure)
  return 'main.pdf';
}

/**
 * Generate PDF file URL for the new folder structure
 * @param {string|number} chapterNumber - The chapter number
 * @param {string} filename - The PDF filename
 * @returns {string|null} The full URL path to the PDF file, or null if no filename
 */
export function getPdfUrl(chapterNumber, filename) {
  if (!filename) return null;
  
  // If it's already a full URL, return as-is
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Updated path structure: /chapters/XX/pdf/filename.pdf
  // Keep zero-padding for the folder path to match your folder structure (01, 02, etc.)
  return `/chapters/${chapterNumber.toString().padStart(2, '0')}/pdf/${filename}`;
}

/**
 * Check if PDF file is available (helper for components)
 * @param {string|null} pdfFile - PDF file path or filename
 * @returns {boolean} Whether PDF file is available
 */
export function hasPdfFile(pdfFile) {
  return !!(pdfFile && pdfFile.trim() !== '');
}

/**
 * Debug function to log PDF file information
 * @param {string} context - Context for the debug log
 * @param {Object} data - Data to log
 */
export function debugPdfFiles(context, data) {
  console.log(`📄 ${context} PDF debug:`, data);
}
