// src/components/Settings/SettingsDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import styles from './SettingsDropdown.module.css';

export default function SettingsDropdown({ isOpen, onClose, triggerRef }) {
  const dropdownRef = useRef(null);
  const { settings, updateSetting, resetSettings, fontOptions } = useSettings();

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={styles.dropdown}
      role="menu"
      aria-label="Settings menu"
    >
      <div className={styles.dropdownHeader}>
        <h3 className={styles.dropdownTitle}>Reading Settings</h3>
      </div>
      
      <div className={styles.dropdownContent}>
        {/* Typography Settings */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Typography</h4>
          
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Font Family</span>
            <select 
              className={styles.settingControl}
              value={settings.font}
              onChange={(e) => updateSetting('font', e.target.value)}
            >
              {fontOptions.filter(f => f.id !== 'opendyslexic').map(font => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Font Size</span>
            <div className={styles.sliderContainer}>
              <svg className={styles.sliderIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 20h16M4 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4M8 12V8a4 4 0 0 1 8 0v4"/>
              </svg>
              <input
                type="range"
                min="14"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className={styles.slider}
              />
              <svg className={styles.sliderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 20h16M4 20v-6a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v6M6 10V6a6 6 0 0 1 12 0v4"/>
              </svg>
              <span className={styles.valueDisplay}>{settings.fontSize}px</span>
            </div>
          </div>
          
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Line Spacing</span>
            <div className={styles.sliderContainer}>
              <svg className={styles.sliderIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8h18M3 16h18M8 4v16"/>
              </svg>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                className={styles.slider}
              />
              <svg className={styles.sliderIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18M8 2v20"/>
              </svg>
              <span className={styles.valueDisplay}>{settings.lineHeight}×</span>
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Layout</h4>
          
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Text Alignment</span>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.optionButton} ${settings.textAlign === 'left' ? styles.active : ''}`}
                onClick={() => updateSetting('textAlign', 'left')}
                title="Left align"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h11M3 12h11M3 18h11"/>
                </svg>
              </button>
              <button
                className={`${styles.optionButton} ${settings.textAlign === 'justify' ? styles.active : ''}`}
                onClick={() => updateSetting('textAlign', 'justify')}
                title="Justify"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Column Width</span>
            <div className={styles.sliderContainer}>
              <svg className={styles.sliderIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="6" height="16" rx="1"/>
              </svg>
              <input
                type="range"
                min="55"
                max="95"
                step="5"
                value={settings.maxWidth}
                onChange={(e) => updateSetting('maxWidth', parseInt(e.target.value))}
                className={styles.slider}
              />
              <svg className={styles.sliderIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="1"/>
              </svg>
              <span className={styles.valueDisplay}>{settings.maxWidth}ch</span>
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Accessibility</h4>
          
          <div className={styles.settingItem}>
            <div className={styles.settingLabelWithIcon}>
              <svg className={styles.settingIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className={styles.settingLabel}>Reduce Motion</span>
            </div>
            <label className={styles.toggle}>
              <input 
                type="checkbox" 
                checked={settings.reducedMotion}
                onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
          
          <div className={styles.settingItem}>
            <div className={styles.settingLabelWithIcon}>
              <svg className={styles.settingIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18m9-9H3"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span className={styles.settingLabel}>Dyslexia-Friendly</span>
            </div>
            <label className={styles.toggle}>
              <input 
                type="checkbox" 
                checked={settings.dyslexiaFont}
                onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className={styles.dropdownFooter}>
        <button 
          className={styles.footerButton}
          onClick={resetSettings}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
