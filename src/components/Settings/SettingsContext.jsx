// src/components/Settings/SettingsContext.jsx - Fixed OpenDyslexic handling
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

// Available font options - Updated with proper fallbacks and working fonts
export const FONT_OPTIONS = [
  {
    id: 'inter',
    name: 'Inter',
    family: '"Inter", system-ui, -apple-system, sans-serif',
    description: 'Modern, highly readable sans-serif (default)'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, "Times New Roman", serif',
    description: 'Classic serif, excellent for long reading'
  },
  {
    id: 'garamond',
    name: 'Garamond',
    family: '"EB Garamond", "Adobe Garamond Pro", Garamond, Georgia, serif',
    description: 'Elegant French serif, perfect for academic texts'
  },
  {
    id: 'baskerville',
    name: 'Baskerville',
    family: '"Libre Baskerville", Baskerville, Georgia, serif',
    description: 'Traditional English serif with excellent readability'
  },
  {
    id: 'times',
    name: 'Times New Roman',
    family: '"Times New Roman", Times, serif',
    description: 'Classic newspaper serif, widely available'
  },
  {
    id: 'palatino',
    name: 'Palatino',
    family: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    description: 'Humanist serif inspired by Renaissance typefaces'
  },
  {
    id: 'crimson',
    name: 'Crimson Text',
    family: '"Crimson Text", Georgia, serif',
    description: 'Modern serif designed specifically for book typography'
  },
  {
    id: 'cambria',
    name: 'Cambria',
    family: 'Cambria, Georgia, serif',
    description: 'Microsoft serif designed for screen reading'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif',
    description: 'Modern geometric sans-serif with clean lines'
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    family: '"Bebas Neue", "Arial Black", "Helvetica Neue", Arial, sans-serif',
    description: 'Bold condensed sans-serif for impactful text'
  },
  {
    id: 'source-serif',
    name: 'Source Serif',
    family: '"Source Serif Pro", "Source Serif 4", Georgia, serif',
    description: 'Clean serif optimized for digital reading'
  },
  {
    id: 'system',
    name: 'System Font',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    description: 'Your device\'s default system font'
  },
  {
    id: 'opendyslexic',
    name: 'OpenDyslexic',
    family: '"OpenDyslexic", "Comic Sans MS", cursive',
    description: 'Designed specifically for dyslexic readers'
  }
];

const STORAGE_KEY = 'atlas-settings';

// Better defaults based on reading research
const DEFAULT_SETTINGS = {
  font: 'inter',
  fontSize: 18,           // Increased from 16px - better for reading
  lineHeight: 1.7,        // Increased from 1.6 - more comfortable
  textAlign: 'left',
  maxWidth: 85,           // Increased from 65ch - better for modern screens
  dyslexiaFont: false
};

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettingsState(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  // Apply all reading settings to document
  useEffect(() => {
    let selectedFont;
    
    // Handle dyslexia-friendly mode - override font selection
    if (settings.dyslexiaFont) {
      selectedFont = FONT_OPTIONS.find(font => font.id === 'opendyslexic');
    } else {
      selectedFont = FONT_OPTIONS.find(font => font.id === settings.font);
    }
    
    if (selectedFont) {
      document.documentElement.style.setProperty('--atlas-reader-font', selectedFont.family);
    }
    
    // Apply other reading settings
    document.documentElement.style.setProperty('--atlas-reader-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--atlas-reader-line-height', settings.lineHeight);
    document.documentElement.style.setProperty('--atlas-reader-text-align', settings.textAlign);
    document.documentElement.style.setProperty('--atlas-reader-max-width', `${settings.maxWidth}ch`);
    
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettingsState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    fontOptions: FONT_OPTIONS
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
