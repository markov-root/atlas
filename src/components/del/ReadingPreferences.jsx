// src/components/chapters/ReadingPreferences.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import { 
  Settings, X, Type, RefreshCw, Move
} from 'lucide-react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from './ReadingPreferences.module.css';

/**
 * ReadingPreferences component for customizing text appearance and reading experience
 * Provides a floating toggle button that expands to show various customization options
 * and can be dragged around the screen
 */
const ReadingPreferencesImpl = () => {
  // Basic preferences state
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState('100');
  const [fontFamily, setFontFamily] = useState('default');
  const [lineSpacing, setLineSpacing] = useState('160');
  const [maxWidth, setMaxWidth] = useState('100');
  
  // State for draggable behavior
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef(null);
  const containerRef = useRef(null);
  const { colorMode } = useColorMode();

  // Initialize state from localStorage
  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM) {
      // Load reading preferences
      setFontSize(localStorage.getItem('atlas-font-size') || '100');
      setFontFamily(localStorage.getItem('atlas-font-family') || 'default');
      setLineSpacing(localStorage.getItem('atlas-line-spacing') || '160');
      setMaxWidth(localStorage.getItem('atlas-max-width') || '100');
      
      // Load position if saved previously
      const savedPosition = localStorage.getItem('atlas-button-position');
      if (savedPosition) {
        try {
          setPosition(JSON.parse(savedPosition));
        } catch (e) {
          console.error('Failed to parse saved position', e);
        }
      }
    }
  }, []);

  // Toggle the settings panel
  const togglePanel = (e) => {
    // Don't toggle when dragging
    if (isDragging) return;
    setIsOpen(!isOpen);
    e.stopPropagation();
  };

  // Handle font size change
  const handleFontSizeChange = (e) => {
    const newSize = e.target.value;
    setFontSize(newSize);
    if (ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('atlas-font-size', newSize);
    }
    applySettings();
  };

  // Handle font family change
  const handleFontFamilyChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    if (ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('atlas-font-family', newFont);
    }
    applySettings();
  };
  
  // Handle line spacing change
  const handleLineSpacingChange = (e) => {
    const newSpacing = e.target.value;
    setLineSpacing(newSpacing);
    if (ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('atlas-line-spacing', newSpacing);
    }
    applySettings();
  };
  
  // Handle max width change
  const handleMaxWidthChange = (e) => {
    const newWidth = e.target.value;
    setMaxWidth(newWidth);
    if (ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('atlas-max-width', newWidth);
    }
    applySettings();
  };

  // Reset all settings to defaults
  const resetSettings = () => {
    setFontSize('100');
    setFontFamily('default');
    setLineSpacing('160');
    setMaxWidth('100');
    
    if (ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('atlas-font-size', '100');
      localStorage.setItem('atlas-font-family', 'default');
      localStorage.setItem('atlas-line-spacing', '160');
      localStorage.setItem('atlas-max-width', '100');
    }
    
    applySettings();
  };

  // Start dragging
  const handleMouseDown = (e) => {
    // Don't start drag if clicking on the panel or its toggle button when open
    if (isOpen && (e.target.closest(`.${styles.settingsPanel}`) || e.target.closest(`.${styles.toggleButton}`))) {
      return;
    }
    
    // Calculate offset from the center of the button
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    
    // Close panel if it's open
    if (isOpen) {
      setIsOpen(false);
    }
    
    e.preventDefault();
  };

  // Handle dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculate new position
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Check boundaries to keep button within viewport
    const buttonSize = containerRef.current.offsetWidth;
    const maxX = window.innerWidth - buttonSize / 2;
    const maxY = window.innerHeight - buttonSize / 2;
    
    const boundedX = Math.max(buttonSize / 2, Math.min(newX, maxX));
    const boundedY = Math.max(buttonSize / 2, Math.min(newY, maxY));
    
    // Use transform for smooth movement
    containerRef.current.style.transform = `translate(${boundedX - window.innerWidth / 2}px, ${boundedY - window.innerHeight / 2}px)`;
    
    // Update position state
    setPosition({ x: boundedX - window.innerWidth / 2, y: boundedY - window.innerHeight / 2 });
  };

  // End dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // Save position to localStorage
      if (ExecutionEnvironment.canUseDOM && position.x !== null && position.y !== null) {
        localStorage.setItem('atlas-button-position', JSON.stringify(position));
      }
    }
  };

  // Apply settings to the document
  const applySettings = () => {
    if (ExecutionEnvironment.canUseDOM) {
      const root = document.documentElement;
      const body = document.body;
      
      // Apply base class to body
      body.classList.add('atlas-reading-preferences-enabled');
      
      // Apply font size
      root.style.setProperty('--atlas-user-font-size', `${fontSize}`);
      
      // Apply font family
      let fontFamilyValue = 'var(--atlas-font-body)';
      if (fontFamily === 'default') {
        fontFamilyValue = 'var(--atlas-font-body)';
      } else if (fontFamily === 'serif') {
        fontFamilyValue = 'Georgia, "Times New Roman", serif';
      } else if (fontFamily === 'sans') {
        fontFamilyValue = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
      } else if (fontFamily === 'mono') {
        fontFamilyValue = '"JetBrains Mono", "SF Mono", "Courier New", monospace';
      } else if (fontFamily === 'dyslexic') {
        fontFamilyValue = '"OpenDyslexic", sans-serif';
      }
      
      root.style.setProperty('--atlas-user-font-family', fontFamilyValue);
      
      // Apply line spacing
      root.style.setProperty('--atlas-user-line-height', `${lineSpacing}`);
      
      // Apply max width
      root.style.setProperty('--atlas-user-max-width', `${maxWidth}`);
    }
  };

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target) && 
          !event.target.closest(`.${styles.toggleButton}`)) {
        setIsOpen(false);
      }
    }
    
    if (ExecutionEnvironment.canUseDOM) {
      document.addEventListener("mousedown", handleClickOutside);
      
      // Add OpenDyslexic font if not already added
      if (!document.getElementById('dyslexic-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'dyslexic-font';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/open-dyslexic/1.0.3/opendyslexic/opendyslexic.min.css';
        document.head.appendChild(fontLink);
      }
    }
    
    return () => {
      if (ExecutionEnvironment.canUseDOM) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, []);

  // Set up global mouse move and up event listeners for dragging
  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Apply position from localStorage on mount
  useEffect(() => {
    if (ExecutionEnvironment.canUseDOM && containerRef.current && position.x !== null && position.y !== null) {
      containerRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, []);

  // Apply settings when component mounts
  useEffect(() => {
    applySettings();
  }, [fontSize, fontFamily, lineSpacing, maxWidth]);

  // Generate the font preview for the selected font family
  const getFontPreview = () => {
    let fontFamilyValue = 'var(--atlas-font-body)';
    
    if (fontFamily === 'default') {
      fontFamilyValue = 'var(--atlas-font-body)';
    } else if (fontFamily === 'serif') {
      fontFamilyValue = 'Georgia, "Times New Roman", serif';
    } else if (fontFamily === 'sans') {
      fontFamilyValue = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    } else if (fontFamily === 'mono') {
      fontFamilyValue = '"JetBrains Mono", "SF Mono", "Courier New", monospace';
    } else if (fontFamily === 'dyslexic') {
      fontFamilyValue = '"OpenDyslexic", sans-serif';
    }
    
    return fontFamilyValue;
  };

  return (
    <div 
      className={`${styles.readingPreferencesContainer} ${isDragging ? styles.dragging : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      {/* Toggle Button */}
      <button 
        className={`${styles.toggleButton} ${isOpen ? styles.active : ''}`}
        onClick={togglePanel}
        aria-label="Reading preferences"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Settings size={20} />}
      </button>
      
      {/* Settings Panel */}
      {isOpen && (
        <div className={styles.settingsPanel} ref={panelRef}>
          <h3 className={styles.panelTitle}>
            <Type size={18} />
            Reading Preferences
          </h3>
          
          <div className={styles.settingsGroup}>
            <label htmlFor="font-size" className={styles.settingLabel}>
              Text Size
            </label>
            <div className={styles.rangeWrapper}>
              <span className={styles.rangeIcon}>A</span>
              <input
                type="range"
                id="font-size"
                min="80"
                max="150"
                step="5"
                value={fontSize}
                onChange={handleFontSizeChange}
                className={styles.rangeInput}
              />
              <span className={styles.rangeIcon}>A</span>
            </div>
          </div>
          
          <div className={styles.settingsGroup}>
            <label htmlFor="font-family" className={styles.settingLabel}>
              Font Family
            </label>
            <select
              id="font-family"
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className={styles.selectInput}
            >
              <option value="default">Default</option>
              <option value="serif">Serif</option>
              <option value="sans">Sans-serif</option>
              <option value="mono">Monospace</option>
              <option value="dyslexic">OpenDyslexic</option>
            </select>
            <div className={styles.fontPreview} style={{ fontFamily: getFontPreview() }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          
          <div className={styles.settingsGroup}>
            <label htmlFor="line-spacing" className={styles.settingLabel}>
              Line Spacing
            </label>
            <div className={styles.rangeWrapper}>
              <span className={styles.rangeIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </span>
              <input
                type="range"
                id="line-spacing"
                min="130"
                max="200"
                step="10"
                value={lineSpacing}
                onChange={handleLineSpacingChange}
                className={styles.rangeInput}
              />
              <span className={styles.rangeIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="4" x2="21" y2="4"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="20" x2="21" y2="20"></line>
                </svg>
              </span>
            </div>
          </div>
          
          <div className={styles.settingsGroup}>
            <label htmlFor="max-width" className={styles.settingLabel}>
              Content Width
            </label>
            <div className={styles.rangeWrapper}>
              <span className={styles.rangeIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"></path>
                  <path d="M9 21H3v-6"></path>
                  <path d="M21 3l-7 7"></path>
                  <path d="M3 21l7-7"></path>
                </svg>
              </span>
              <input
                type="range"
                id="max-width"
                min="50"
                max="100"
                step="5"
                value={maxWidth}
                onChange={handleMaxWidthChange}
                className={styles.rangeInput}
              />
              <span className={styles.rangeIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 3H3"></path>
                  <path d="M21 8H3"></path>
                  <path d="M21 13H3"></path>
                  <path d="M21 18H3"></path>
                </svg>
              </span>
            </div>
          </div>
          
          <button 
            className={styles.resetButton}
            onClick={resetSettings}
          >
            <RefreshCw size={16} />
            Reset to Defaults
          </button>
          
          <div className={styles.dragHint}>
            <Move size={14} />
            <span>Drag this button to reposition</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with BrowserOnly to avoid SSR issues
export default function ReadingPreferences() {
  return (
    <BrowserOnly>
      {() => <ReadingPreferencesImpl />}
    </BrowserOnly>
  );
}
