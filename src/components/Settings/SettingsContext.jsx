// src/components/Settings/SettingsContext.jsx - Removed OpenDyslexic option
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

// Available font options - Removed OpenDyslexic
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
    name: 'EB Garamond',
    family: '"EB Garamond", "Adobe Garamond Pro", Garamond, Georgia, serif',
    description: 'Elegant French serif, perfect for academic texts'
  },
  {
    id: 'baskerville',
    name: 'Libre Baskerville',
    family: '"Libre Baskerville", Baskerville, Georgia, serif',
    description: 'Traditional English serif with excellent readability'
  },
  {
    id: 'caslon',
    name: 'Libre Caslon Text',
    family: '"Libre Caslon Text", "Adobe Caslon Pro", "Big Caslon", Georgia, serif',
    description: 'Historic serif with exceptional character and readability'
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
    id: 'merriweather',
    name: 'Merriweather',
    family: '"Merriweather", Georgia, serif',
    description: 'Designed for optimal readability on screens'
  },
  {
    id: 'benne',
    name: 'Benne',
    family: '"Benne", Georgia, serif',
    description: 'Warm, friendly serif with academic appeal'
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
};

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);

  // Don't load from localStorage - always start fresh on page load
  // This ensures settings reset on page refresh
  
  // Apply all reading settings to document
  useEffect(() => {
    const selectedFont = FONT_OPTIONS.find(font => font.id === settings.font);
    
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
