// src/components/chapters/Caption.jsx
import React from 'react';
import styles from './Caption.module.css';

/**
 * Unified caption component for all media types (figures, videos, iframes)
 * Handles numbering, markdown links, and consistent styling
 */
export default function Caption({ 
  caption, 
  mediaType = 'figure', // 'figure', 'video', 'iframe'
  chapter, 
  number,
  label, // Optional explicit label like "1.1"
  className = ''
}) {
  // Process markdown links in caption
  const processMarkdownLinks = (text) => {
    if (!text) return '';
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      `<a href="$2" target="_blank" rel="noopener noreferrer" class="${styles.captionLink}">$1</a>`
    );
  };

  // Generate media label for numbering
  const getMediaLabel = () => {
    const capitalizedType = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
    
    // If explicit label is provided, use it
    if (label) {
      return `${capitalizedType} ${label}`;
    }
    
    // If both chapter and number are provided, format as "Chapter.Number"
    if (chapter && number) {
      return `${capitalizedType} ${chapter}.${number}`;
    } 
    
    // If only number is provided, use just the number
    if (number) {
      return `${capitalizedType} ${number}`;
    }
    
    // No numbering
    return '';
  };

  // Generate full caption with media numbering
  const getFullCaption = () => {
    const mediaLabel = getMediaLabel();
    
    if (caption) {
      // Check if caption already starts with media numbering (avoid duplication)
      const numberingPattern = new RegExp(`^${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} \\d+(\.\\d+)?:?\\s*`, 'i');
      if (caption.match(numberingPattern)) {
        // Caption already has numbering, don't add more
        return caption;
      } else if (mediaLabel) {
        // Add numbering with colon separator
        return `${mediaLabel}: ${caption}`;
      } else {
        // No numbering to add
        return caption;
      }
    } else if (mediaLabel) {
      // No caption text, just the label
      return mediaLabel;
    }
    
    return '';
  };

  const fullCaption = getFullCaption();

  // Debug logging to see what's happening
  console.log('Caption component debug:', {
    mediaType,
    chapter,
    number,
    label,
    originalCaption: caption,
    mediaLabel: getMediaLabel(),
    fullCaption: fullCaption,
    processedCaption: processMarkdownLinks(fullCaption),
    hasMarkdownLinks: fullCaption?.includes('[') && fullCaption?.includes('](')
  });

  if (!fullCaption) return null;

  return (
    <figcaption 
      className={`${styles.mediaCaption} ${className}`}
      dangerouslySetInnerHTML={{ __html: processMarkdownLinks(fullCaption) }}
    />
  );
}
