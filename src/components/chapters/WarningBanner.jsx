// /src/components/chapters/WarningBanner.jsx
import React from 'react';
import styles from './WarningBanner.module.css';

/**
 * Draft Warning Banner Component
 * Extends below chapter header as integrated warning section
 * @param {Object} props
 * @param {string} props.message - Warning message to display
 */
export default function WarningBanner({ message }) {
  if (!message) return null;

  return (
    <div className={styles.warningBanner}>
      {/* Texture overlay - matches header aesthetic */}
      <div className={styles.textureOverlay} />
      
      {/* Warning content */}
      <div className={styles.warningContent}>
        <div className={styles.iconWrapper}>
          <img 
            src="/img/icons/warning.svg" 
            alt="" 
            className={styles.warningIcon} 
          />
        </div>
        <div className={styles.messageWrapper}>
          <span className={styles.warningLabel}>Draft Chapter</span>
          <span className={styles.messageDivider}>—</span>
          <span className={styles.warningMessage}>{message}</span>
        </div>
      </div>
    </div>
  );
}
