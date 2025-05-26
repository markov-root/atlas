// File: src/components/NoteBlock.tsx

import React from 'react';
import clsx from 'clsx';
import styles from './NoteBlock.module.css';

// You'll need to import these icons from lucide-react
import { Info, AlertTriangle, LightbulbIcon } from 'lucide-react';

interface NoteBlockProps {
  title?: string;
  skippable?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'info' | 'warning' | 'tip';
}

const NoteBlock: React.FC<NoteBlockProps> = ({
  title,
  skippable = false,
  children,
  className,
  type = 'info'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'tip':
        return <LightbulbIcon size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={clsx(
      styles.noteBlock, 
      styles[type],
      className
    )}>
      {title && (
        <div className={styles.noteHeader}>
          <div className={styles.noteTitleWrapper}>
            <span className={styles.noteIcon}>
              {getIcon()}
            </span>
            <h4 className={styles.noteTitle}>{title}</h4>
          </div>
          {skippable && (
            <span className={styles.noteOptional}>Optional</span>
          )}
        </div>
      )}
      <div className={styles.noteContent}>
        {children}
      </div>
    </div>
  );
};

export default NoteBlock;
