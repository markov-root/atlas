// src/components/chapters/Note.jsx
import React, { useState } from 'react';
import styles from './Note.module.css';
import { ChevronDown, Info } from 'lucide-react';

/**
 * Note component for adding collapsible information blocks
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the note
 * @param {string} props.title - Title of the note
 * @param {boolean|string} props.collapsed - Whether the note is initially collapsed
 */
export default function Note({ 
  children, 
  title = "Note", 
  collapsed = true 
}) {
  // Convert the collapsed prop to a boolean
  // This handles both cases: collapsed={true} and collapsed="true"
  const initialCollapsed = typeof collapsed === 'string' 
    ? collapsed.toLowerCase() === 'true' 
    : Boolean(collapsed);
    
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={styles.noteContainer}>
      <div className={styles.noteIconWrapper}>
        <Info size={20} className={styles.noteIcon} />
      </div>
      
      <div className={styles.optionalTag}>Optional</div>
      
      <div 
        className={styles.noteHeader}
        onClick={toggleCollapse}
        role="button"
        aria-expanded={!isCollapsed}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCollapse();
          }
        }}
      >
        <div className={styles.headerContent}>
          <h4 className={styles.noteTitle}>{title}</h4>
        </div>
        
        <ChevronDown 
          className={`${styles.chevronIcon} ${isCollapsed ? '' : styles.chevronRotated}`} 
          size={20}
        />
      </div>
      
      <div 
        className={`${styles.noteContent} ${isCollapsed ? styles.collapsed : ''}`}
        aria-hidden={isCollapsed}
      >
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
}
