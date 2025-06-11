// src/theme/DocItem/Landing/ChapterList/hooks.js
import { useState, useEffect } from 'react';
import { buildAudioFiles, getAudioUrl } from '../../../../utils/audioUtils';
import { buildPdfFile } from '../../../../utils/pdfUtils';

export function useFileVerification(chapters) {
  const [verifiedAudioFiles, setVerifiedAudioFiles] = useState(new Map());
  const [verifiedPdfFiles, setVerifiedPdfFiles] = useState(new Map());

  // Check if audio file actually exists
  const checkAudioExists = async (audioUrl) => {
    if (!audioUrl) return false;
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Build verified audio files
  const buildVerifiedAudioFiles = async (chapter, chapterNumber) => {
    const audioFiles = buildAudioFiles(chapter, chapterNumber);
    const verifiedFiles = {};
    
    for (const [trackType, filename] of Object.entries(audioFiles)) {
      const audioUrl = getAudioUrl(chapterNumber, filename);
      const exists = await checkAudioExists(audioUrl);
      if (exists) {
        verifiedFiles[trackType] = filename;
      }
    }
    
    return verifiedFiles;
  };

  // Build verified PDF files
  const buildVerifiedPdfFiles = async (chapter, chapterNumber) => {
    try {
      const pdfData = await buildPdfFile(chapter, chapterNumber);
      return pdfData;
    } catch (error) {
      console.error(`PDF verification failed for chapter ${chapterNumber}:`, error);
      return {
        type: 'none',
        url: null,
        isActive: false
      };
    }
  };

  useEffect(() => {
    const verifyAllFiles = async () => {
      const audioMap = new Map();
      const pdfMap = new Map();
      
      for (const chapter of chapters) {
        // Verify audio files
        const hasExplicitAudio = !!(
          chapter.audio_podcast || 
          chapter.audio_transcript || 
          chapter.audio_discussion ||
          chapter.resources?.audio
        );
        
        if (hasExplicitAudio) {
          const verifiedFiles = await buildVerifiedAudioFiles(chapter, chapter.number);
          audioMap.set(chapter.id, verifiedFiles);
        } else {
          const audioFiles = buildAudioFiles(chapter, chapter.number);
          const verifiedFiles = {};
          
          for (const [trackType, filename] of Object.entries(audioFiles)) {
            const audioUrl = getAudioUrl(chapter.number, filename);
            const exists = await checkAudioExists(audioUrl);
            if (exists) {
              verifiedFiles[trackType] = filename;
            }
          }
          audioMap.set(chapter.id, verifiedFiles);
        }

        // Verify PDF files
        const pdfData = await buildVerifiedPdfFiles(chapter, chapter.number);
        pdfMap.set(chapter.id, pdfData);
      }
      
      setVerifiedAudioFiles(audioMap);
      setVerifiedPdfFiles(pdfMap);
    };
    
    verifyAllFiles();
  }, [chapters]);

  return { verifiedAudioFiles, verifiedPdfFiles };
}
