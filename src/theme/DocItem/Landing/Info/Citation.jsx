// src/theme/DocItem/Landing/Info/Citation.jsx
import React, { useState } from 'react';
import { SmallTooltip } from '../../../../components/UI/Tooltip';
import styles from './Citation.module.css';

export default function Citation() {
  const [copyTooltip, setCopyTooltip] = useState('Click to copy citation');
  
  const citationText = "Markov Grey and Charbel-Raphaël Segerie et al. 2025. AI Safety Atlas. French Center for AI Safety (CeSIA). URL: ai-safety-atlas.com";
  
  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopyTooltip('Copied!');
      setTimeout(() => setCopyTooltip('Click to copy citation'), 2000);
    } catch (err) {
      console.error('Failed to copy citation:', err);
      setCopyTooltip('Copy failed');
      setTimeout(() => setCopyTooltip('Click to copy citation'), 2000);
    }
  };

  return (
    <div className={styles.citationContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.iconContainer}>
          <img src="/img/icons/citation.svg" alt="" className={styles.icon} />
        </div>
        <h2 className={styles.sectionTitle}>Cite this work as</h2>
      </div>
      
      <div className={styles.citationContent}>
        <div className={styles.citationWrapper}>
          <p className={styles.citation}>{citationText}</p>
          <SmallTooltip content={copyTooltip}>
            <button 
              className={styles.copyButton}
              onClick={handleCopyCitation}
              aria-label="Copy citation to clipboard"
            >
              📋
            </button>
          </SmallTooltip>
        </div>
      </div>
    </div>
  );
}
