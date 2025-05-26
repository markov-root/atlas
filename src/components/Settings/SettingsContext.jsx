// src/components/Settings/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

// Available font options
export const FONT_OPTIONS = [
  {
    id: 'inter',
    name: 'Inter',
    family: '"Inter", system-ui, -apple-system, sans-serif',
    description: 'Modern, highly readable sans-serif (default)'
  },
  {
    id: 'system',
    name: 'System',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    description: 'Your device\'s default system font'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, "Times New Roman", serif',
    description: 'Classic serif, great for extended reading'
  },
  {
    id: 'charter',
    name: 'Charter',
    family: '"Charter", "Bitstream Charter", "Sitka Text", Cambria, serif',
    description: 'Readable serif designed for screens'
  },
  {
    id: 'iowan',
    name: 'Iowan Old Style',
    family: '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
    description: 'Elegant serif with character'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    description: 'Friendly, readable sans-serif'
  },
  {
    id: 'source-serif',
    name: 'Source Serif',
    family: '"Source Serif Pro", "Source Serif 4", Georgia, serif',
    description: 'Clean serif optimized for reading'
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    description: 'Monospace font for a technical feel'
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
  reducedMotion: false,
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
    let selectedFont = FONT_OPTIONS.find(font => font.id === settings.font);
    
    // Handle dyslexia-friendly mode
    if (settings.dyslexiaFont) {
      selectedFont = FONT_OPTIONS.find(font => font.id === 'opendyslexic') || selectedFont;
    }
    
    if (selectedFont) {
      document.documentElement.style.setProperty('--atlas-reader-font', selectedFont.family);
    }
    
    // Apply other reading settings
    document.documentElement.style.setProperty('--atlas-reader-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--atlas-reader-line-height', settings.lineHeight);
    document.documentElement.style.setProperty('--atlas-reader-text-align', settings.textAlign);
    document.documentElement.style.setProperty('--atlas-reader-max-width', `${settings.maxWidth}ch`);
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      document.documentElement.style.setProperty('--atlas-reader-motion', 'none');
      // Also apply the standard reduced motion
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.style.removeProperty('--atlas-reader-motion');
      document.documentElement.removeAttribute('data-reduced-motion');
    }
    
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
