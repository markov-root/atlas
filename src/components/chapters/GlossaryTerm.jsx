// src/components/chapters/GlossaryTerm.jsx
import React from 'react';
import AtlasTooltip from '../UI/Tooltip';
import { useSettings } from '../Settings/SettingsContext';
import styles from './GlossaryTerm.module.css';

/**
 * GlossaryTerm component that displays definition + source in tooltip
 * Respects the global glossary setting
 */
export default function GlossaryTerm({ children, term, definition }) {
  const { settings } = useSettings();
  
  // If glossary is disabled, just return the text without tooltip
  if (!settings.glossaryEnabled) {
    return <span>{children}</span>;
  }

  // Parse definition if it's a JSON string
  let parsedDefinition = definition;
  if (typeof definition === 'string' && definition.startsWith('{')) {
    try {
      parsedDefinition = JSON.parse(definition);
    } catch (e) {
      // If parsing fails, use as string
      parsedDefinition = definition;
    }
  }

  // Process markdown links in source to HTML
  const processMarkdownLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Replace markdown links [text](url) with HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">$1</a>'
    );
  };

  // Format the tooltip content
  const formatTooltipContent = (def) => {
    if (typeof def === 'string') {
      return (
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipTerm}>{term.toUpperCase()}</div>
          <div className={styles.tooltipDefinition}>{def}</div>
        </div>
      );
    }

    // Handle structured definition object
    if (def && typeof def === 'object') {
      return (
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipTerm}>{term.toUpperCase()}</div>
          <div className={styles.tooltipDefinition}>
            {def.definition}
          </div>
          {def.source && (
            <div 
              className={styles.tooltipSource}
              dangerouslySetInnerHTML={{ 
                __html: processMarkdownLinks(def.source) 
              }}
            />
          )}
        </div>
      );
    }

    // Fallback
    return (
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipTerm}>{term.toUpperCase()}</div>
        <div className={styles.tooltipDefinition}>Definition not available</div>
      </div>
    );
  };

  const tooltipContent = formatTooltipContent(parsedDefinition);

  // Custom tippy configuration: hover trigger but interactive
  const glossaryTippyProps = {
    trigger: 'mouseenter', // Show on hover
    interactive: true,      // Allow interaction with tooltip content
    interactiveBorder: 10,  // Give some buffer area
    delay: [100, 200],      // Small delay on show, longer on hide
    hideOnClick: false,     // Don't hide when clicking inside
  };

  return (
    <AtlasTooltip 
      content={tooltipContent}
      tippyProps={glossaryTippyProps}
      responsive={false}
    >
      <span className={styles.glossaryTerm} data-term={term}>
        {children}
      </span>
    </AtlasTooltip>
  );
}
