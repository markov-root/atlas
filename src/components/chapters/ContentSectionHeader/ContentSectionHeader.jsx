// src/components/chapters/ContentSectionHeader/ContentSectionHeader.jsx
import React, { useEffect, useState } from 'react';
import styles from './ContentSectionHeader.module.css';

/**
* Custom section header component for CONTENT within markdown (not page headers)
* Automatically calculates reading time for content until next section
* This is completely separate from your existing SectionHeader.jsx component
*/
export default function ContentSectionHeader({ 
 children, 
 id, 
 level = 2,
 showReadingTime = true,
 className = '',
 ...props 
}) {
 const [coreReadingTime, setCoreReadingTime] = useState(null);
 const [optionalReadingTime, setOptionalReadingTime] = useState(null);

 // Helper function to get core text content, excluding optional elements
 const getCoreTextContent = (element) => {
   if (!element) {
     console.log('⚠️ getCoreTextContent: No element provided');
     return '';
   }
   
   console.log(`🔍 getCoreTextContent: Processing ${element.tagName} with classes: ${element.className}`);
   
   // Clone the element to avoid modifying the original DOM
   const clonedElement = element.cloneNode(true);
   
   // Remove ONLY the optional elements (matching Python parser logic)
   const excludeSelectors = [
     // Optional content: Note boxes (from <note-box> in markdown)
     '[class*="noteContainer"]',
     '[class*="note"]',
     'details', // Generic details/summary elements
     
     // Optional content: Captions (from <caption> and <figure-caption> in markdown)  
     '[class*="caption"]',
     'figcaption',
     
     // Optional content: Footnotes (if any)
     '[class*="footnote"]',
     '[class*="citation"]',
     'sup', // Superscript elements often used for footnotes
     
     // Technical exclusions: Code blocks (often not counted in reading time)
     'pre',
     'code',
     '[class*="codeBlock"]',
     '[class*="language-"]',
     
     // Technical exclusions: Reading time indicators (they shouldn't count toward reading time!)
     '[class*="contentReadingTime"]',
     '[class*="readingTime"]',
     
     // Technical exclusions: Other UI elements that shouldn't count toward reading time
     '[class*="button"]',
     '[class*="tooltip"]',
     '[class*="dropdown"]'
   ];
   
   let removedCount = 0;
   
   // Remove all matching elements
   excludeSelectors.forEach(selector => {
     const elementsToRemove = clonedElement.querySelectorAll(selector);
     removedCount += elementsToRemove.length;
     elementsToRemove.forEach(el => {
       const isOptional = [
         '[class*="noteContainer"]', '[class*="note"]', 'details',
         '[class*="caption"]', 'figcaption', 
         '[class*="footnote"]', '[class*="citation"]', 'sup'
       ].includes(selector);
       
       const reason = isOptional ? 'OPTIONAL' : 'TECHNICAL';
       console.log(`🗑️ Removing from core (${reason}): ${selector} - "${el.textContent?.substring(0, 50)}..."`);
       el.remove();
     });
   });
   
   // Get the remaining text content (this should be CORE content)
   const result = clonedElement.textContent || '';
   console.log(`✅ getCoreTextContent result: ${result.length} chars (removed ${removedCount} elements)`);
   console.log(`📋 Core content includes: definitions, quotes, regular paragraphs, lists`);
   return result;
 };

 // Helper function to get optional content only
 const getOptionalTextContent = (element) => {
   if (!element) {
     console.log('⚠️ getOptionalTextContent: No element provided');
     return '';
   }
   
   console.log(`🔍 getOptionalTextContent: Processing ${element.tagName} with classes: ${element.className}`);
   
   // ONLY these elements should be considered optional (matching Python parser)
   const optionalSelectors = [
     // Note boxes (from <note-box> in markdown)
     '[class*="noteContainer"]',
     '[class*="note"]',
     'details',
     
     // Captions (from <caption> and <figure-caption> in markdown)
     '[class*="caption"]',
     'figcaption',
     
     // Footnotes (if any)
     '[class*="footnote"]',
     '[class*="citation"]'
   ];
   
   let optionalContent = '';
   let foundCount = 0;
   
   // Extract text from optional elements
   optionalSelectors.forEach(selector => {
     const optionalElements = element.querySelectorAll(selector);
     foundCount += optionalElements.length;
     optionalElements.forEach(el => {
       const text = el.textContent || '';
       console.log(`📝 Found optional content (${selector}): "${text.substring(0, 50)}..."`);
       optionalContent += ' ' + text;
     });
   });
   
   console.log(`✅ getOptionalTextContent result: ${optionalContent.length} chars (found ${foundCount} optional elements)`);
   return optionalContent;
 };

 useEffect(() => {
   if (!showReadingTime || !id) return;

   // Calculate reading time for content until next section
   const calculateSectionReadingTime = () => {
     console.log(`\n🔍 === STARTING CALCULATION FOR SECTION: "${id}" ===`);
     
     // Find the current section header container
     const currentHeaderContainer = document.getElementById(id)?.closest('[class*="contentSectionContainer"]');
     if (!currentHeaderContainer) {
       console.log('❌ Header container not found:', id);
       return;
     }

     console.log('✅ Found header container for:', id);
     console.log('📍 Container element:', currentHeaderContainer);

     // Get all content until the next ANY section header (regardless of level)
     let coreContent = '';
     let optionalContent = '';
     let currentElement = currentHeaderContainer.nextElementSibling;
     let elementCount = 0;
     
     console.log('🔄 Starting to traverse sibling elements...');
     
     while (currentElement) {
       elementCount++;
       console.log(`\n--- Element ${elementCount} ---`);
       console.log('🏷️ Element tag:', currentElement.tagName);
       console.log('📋 Element classes:', currentElement.className);
       console.log('📝 Element text preview:', (currentElement.textContent || '').substring(0, 100) + '...');
       
       // Stop if we hit ANY section header container (no matter what level)
       if (currentElement.classList?.toString().includes('contentSectionContainer')) {
         console.log('⏹️ STOPPING: Found next section header container');
         break;
       }
       
       // Stop if we hit any standalone header element
       if (currentElement.tagName?.match(/^H[1-6]$/)) {
         console.log(`⏹️ STOPPING: Found standalone header: ${currentElement.textContent?.substring(0, 50)}...`);
         break;
       }
       
       // Skip CSS style elements entirely
       if (currentElement.tagName === 'STYLE') {
         console.log('⚠️ SKIPPING: CSS style element');
         currentElement = currentElement.nextElementSibling;
         continue;
       }
       
       // Skip script elements entirely
       if (currentElement.tagName === 'SCRIPT') {
         console.log('⚠️ SKIPPING: Script element');
         currentElement = currentElement.nextElementSibling;
         continue;
       }

       // Collect core and optional content separately
       const coreText = getCoreTextContent(currentElement);
       const optionalText = getOptionalTextContent(currentElement);
       
       console.log(`📊 Core text length: ${coreText.length} chars`);
       console.log(`📊 Optional text length: ${optionalText.length} chars`);
       console.log(`📋 Core text preview: "${coreText.substring(0, 80)}..."`);
       console.log(`📋 Optional text preview: "${optionalText.substring(0, 80)}..."`);
       
       coreContent += ' ' + coreText;
       optionalContent += ' ' + optionalText;
       currentElement = currentElement.nextElementSibling;
     }

     console.log(`\n📈 TOTALS AFTER TRAVERSING ${elementCount} ELEMENTS:`);
     console.log(`📊 Total core content length: ${coreContent.length} chars`);
     console.log(`📊 Total optional content length: ${optionalContent.length} chars`);

     // If no content found using container approach, try direct sibling approach
     if (coreContent.trim().length < 50) {
       console.log('\n🔄 FALLBACK: Trying direct sibling approach...');
       coreContent = '';
       optionalContent = '';
       const currentHeader = document.getElementById(id);
       let nextElement = currentHeader?.parentElement?.nextElementSibling;
       let fallbackElementCount = 0;
       
       while (nextElement) {
         fallbackElementCount++;
         console.log(`\n--- Fallback Element ${fallbackElementCount} ---`);
         console.log('🏷️ Element tag:', nextElement.tagName);
         console.log('📋 Element classes:', nextElement.className);
         console.log('📝 Element text preview:', (nextElement.textContent || '').substring(0, 100) + '...');
         
         // Stop at ANY section header container
         if (nextElement.classList?.toString().includes('contentSectionContainer')) {
           console.log('⏹️ STOPPING: Found next contentSectionContainer');
           break;
         }
         
         // Stop at any header element
         if (nextElement.tagName?.match(/^H[1-6]$/)) {
           console.log(`⏹️ STOPPING: Found header: ${nextElement.textContent?.substring(0, 50)}...`);
           break;
         }
         
         // Skip CSS and script elements
         if (nextElement.tagName === 'STYLE' || nextElement.tagName === 'SCRIPT') {
           console.log(`⚠️ SKIPPING: ${nextElement.tagName} element`);
           nextElement = nextElement.nextElementSibling;
           continue;
         }
         
         const fallbackCoreText = getCoreTextContent(nextElement);
         const fallbackOptionalText = getOptionalTextContent(nextElement);
         
         console.log(`📊 Fallback core text length: ${fallbackCoreText.length} chars`);
         console.log(`📊 Fallback optional text length: ${fallbackOptionalText.length} chars`);
         
         coreContent += ' ' + fallbackCoreText;
         optionalContent += ' ' + fallbackOptionalText;
         nextElement = nextElement.nextElementSibling;
       }
       
       console.log(`\n📈 FALLBACK TOTALS AFTER TRAVERSING ${fallbackElementCount} ELEMENTS:`);
       console.log(`📊 Fallback total core content length: ${coreContent.length} chars`);
       console.log(`📊 Fallback total optional content length: ${optionalContent.length} chars`);
     }

     // Calculate reading times for both core and optional content (average 200 words per minute)
     const coreWords = coreContent.trim().split(/\s+/).filter(word => word.length > 0);
     const optionalWords = optionalContent.trim().split(/\s+/).filter(word => word.length > 0);
     
     const coreWordCount = coreWords.length;
     const optionalWordCount = optionalWords.length;
     
     console.log(`\n📊 === FINAL WORD COUNT ANALYSIS ===`);
     console.log(`📝 Core words: ${coreWordCount}`);
     console.log(`📝 Optional words: ${optionalWordCount}`);
     console.log(`⏱️ Core reading time: ${coreWordCount > 10 ? Math.max(1, Math.ceil(coreWordCount / 200)) : 0} min`);
     console.log(`⏱️ Optional reading time: ${optionalWordCount > 5 ? Math.max(1, Math.ceil(optionalWordCount / 200)) : 0} min`);
     
     // Set core reading time if we have substantial content (more than 10 words)
     if (coreWordCount > 10) {
       const minutes = Math.max(1, Math.ceil(coreWordCount / 200));
       setCoreReadingTime(minutes);
       console.log(`✅ Set core reading time: ${minutes} min`);
     } else {
       setCoreReadingTime(null);
       console.log(`❌ No core reading time set (${coreWordCount} words < 10 minimum)`);
     }
     
     // Set optional reading time if we have optional content (more than 5 words)
     if (optionalWordCount > 5) {
       const minutes = Math.max(1, Math.ceil(optionalWordCount / 200));
       setOptionalReadingTime(minutes);
       console.log(`✅ Set optional reading time: ${minutes} min`);
     } else {
       setOptionalReadingTime(null);
       console.log(`❌ No optional reading time set (${optionalWordCount} words < 5 minimum)`);
     }
     
     console.log(`\n📋 === CONTENT SAMPLES FOR VERIFICATION ===`);
     console.log(`🔤 Core content sample (first 200 chars):`);
     console.log(`"${coreContent.substring(0, 200)}..."`);
     console.log(`🔤 Optional content sample (first 200 chars):`);
     console.log(`"${optionalContent.substring(0, 200)}..."`);
     
     console.log(`\n🏁 === CALCULATION COMPLETE FOR SECTION: "${id}" ===\n`);
   };

   // Calculate with delays to ensure DOM is ready
   const timers = [200, 600, 1200].map(delay => 
     setTimeout(calculateSectionReadingTime, delay)
   );
   
   return () => timers.forEach(timer => clearTimeout(timer));
 }, [id, level, showReadingTime]);

 // Generate the appropriate header tag
 const HeaderTag = `h${level}`;

 return (
   <div className={`${styles.contentSectionContainer} ${className}`}>
     <div className={styles.contentSectionContent}>
       <HeaderTag 
         id={id} 
         className={styles.contentSectionTitle}
         {...props}
       >
         {children}
       </HeaderTag>
       
       {showReadingTime && (coreReadingTime || optionalReadingTime) && (
         <div className={styles.contentReadingTime}>
           <img 
             src="/img/icons/reading-time.svg" 
             alt="" 
             className={styles.contentReadingTimeIcon}
           />
           <span className={styles.contentReadingTimeText}>
             {coreReadingTime && (
               <span className={styles.coreTime}>{coreReadingTime} min read</span>
             )}
             {coreReadingTime && optionalReadingTime && (
               <span className={styles.timeSeparator}>, </span>
             )}
             {optionalReadingTime && (
               <span className={styles.optionalTime}>{optionalReadingTime} min optional</span>
             )}
           </span>
         </div>
       )}
     </div>
   </div>
 );
}

export function ContentH2({ children, id, ...props }) {
 return (
   <ContentSectionHeader level={2} id={id} {...props}>
     {children}
   </ContentSectionHeader>
 );
}

export function ContentH3({ children, id, ...props }) {
 return (
   <ContentSectionHeader level={3} id={id} {...props}>
     {children}
   </ContentSectionHeader>
 );
}

export function ContentH4({ children, id, ...props }) {
 return (
   <ContentSectionHeader level={4} id={id} {...props}>
     {children}
   </ContentSectionHeader>
 );
}
