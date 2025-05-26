// File: src/components/DefinitionBlock.tsx

import React from 'react';
import clsx from 'clsx';
import styles from './DefinitionBlock.module.css';

interface DefinitionBlockProps {
  term: string;
  source?: React.ReactNode;
  children: React.ReactNode;
  domain?: string; // Optional field for the domain/category
  className?: string;
}

const DefinitionBlock: React.FC<DefinitionBlockProps> = ({
  term,
  source,
  domain,
  children,
  className
}) => {
  return (
    <div className={clsx(styles.definitionBlock, className)}>
      <div className={styles.definitionLabel}>DEFINITION</div>
      <div className={styles.definitionHeader}>
        {domain && (
          <div className={styles.definitionDomain}>{domain}</div>
        )}
        <div className={styles.definitionTermContainer}>
          <h3 className={styles.definitionTerm}>{term}</h3>
          {source && (
            <div className={styles.definitionSource}>
              {source}
            </div>
          )}
        </div>
      </div>
      <div className={styles.definitionContent}>
        {children}
      </div>
    </div>
  );
};

export default DefinitionBlock;
