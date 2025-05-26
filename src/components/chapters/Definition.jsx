import React from 'react';
import styles from './Definition.module.css';

/**
 * Definition component for displaying terminology definitions
 * @param {Object} props
 * @param {string} props.term - The term being defined
 * @param {string} props.source - Optional source of the definition
 * @param {React.ReactNode} props.children - The definition content
 * @param {string} props.type - Optional type of definition (primary, secondary, warning, info)
 * @param {string} props.etymology - Optional etymology information
 * @param {string} props.pronounce - Optional pronunciation guide
 */
const Definition = ({ 
  term, 
  source, 
  children, 
  type = 'primary',
  etymology = '',
  pronounce = ''
}) => {
  // Get CSS class for the type of definition
  const getTypeClass = () => {
    switch (type.toLowerCase()) {
      case 'secondary':
        return styles.secondary;
      case 'warning':
        return styles.warning;
      case 'info':
        return styles.info;
      default:
        return styles.primary;
    }
  };

  return (
    <div className={`${styles.container} ${getTypeClass()}`}>
      <div className={styles.header}>
        <div className={styles.typeLabel}>Definition</div>
        <div className={styles.termWrapper}>
          <h4 className={styles.term}>{term}</h4>
          {pronounce && <span className={styles.pronunciation}>{pronounce}</span>}
        </div>
        
        {etymology && (
          <div className={styles.etymology}>
            <span className={styles.etymologyLabel}>Etymology:</span> {etymology}
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.definition}>
          {children}
        </div>
        
        {source && (
          <div className={styles.source}>
            <span className={styles.sourceLabel}>Source:</span> {source}
          </div>
        )}
      </div>
    </div>
  );
};

export default Definition;
