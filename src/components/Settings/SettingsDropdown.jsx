// src/components/Settings/SettingsDropdown.jsx - Redesigned with textbook fonts and better layout
import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { SettingsTooltip } from '../UI/Tooltip';
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
      aria-label="Reading settings menu"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <img 
            src="/img/icons/font.svg" 
            alt="" 
            className={styles.headerIcon}
          />
          <h3 className={styles.title}>Reading Settings</h3>
        </div>
        <SettingsTooltip content="Reset all settings to defaults">
          <button 
            onClick={resetSettings}
            className={styles.resetButton}
          >
            <img src="/img/icons/reset.svg" alt="" className={styles.resetIcon} />
          </button>
        </SettingsTooltip>
      </div>

      <div className={styles.content}>
        {/* Font Family */}
        <div className={styles.setting}>
          <label className={styles.label}>Font Family</label>
          <div className={styles.fontSelector}>
            <select 
              value={settings.font}
              onChange={(e) => updateSetting('font', e.target.value)}
              className={styles.select}
            >
              {fontOptions.filter(f => f.id !== 'opendyslexic').map(font => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
            <img src="/img/icons/chevron-down.svg" alt="" className={styles.selectIcon} />
          </div>
        </div>

        {/* Font Size */}
        <div className={styles.setting}>
          <label className={styles.label}>Font Size</label>
          <div className={styles.sliderGroup}>
            <img src="/img/icons/font-size.svg" alt="" className={styles.sliderIcon} />
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="14"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className={styles.slider}
                aria-label="Font size"
              />
              <div 
                className={styles.sliderFill}
                style={{
                  width: `${((settings.fontSize - 14) / (28 - 14)) * 100}%`
                }}
              />
            </div>
            <span className={styles.value}>{settings.fontSize}px</span>
          </div>
        </div>

        {/* Line Height */}
        <div className={styles.setting}>
          <label className={styles.label}>Line Spacing</label>
          <div className={styles.sliderGroup}>
            <img src="/img/icons/height.svg" alt="" className={styles.sliderIcon} />
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                className={styles.slider}
                aria-label="Line spacing"
              />
              <div 
                className={styles.sliderFill}
                style={{
                  width: `${((settings.lineHeight - 1.2) / (2.2 - 1.2)) * 100}%`
                }}
              />
            </div>
            <span className={styles.value}>{settings.lineHeight}×</span>
          </div>
        </div>

        {/* Column Width */}
        <div className={styles.setting}>
          <label className={styles.label}>Column Width</label>
          <div className={styles.sliderGroup}>
            <img src="/img/icons/width.svg" alt="" className={styles.sliderIcon} />
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="55"
                max="95"
                step="5"
                value={settings.maxWidth}
                onChange={(e) => updateSetting('maxWidth', parseInt(e.target.value))}
                className={styles.slider}
                aria-label="Column width"
              />
              <div 
                className={styles.sliderFill}
                style={{
                  width: `${((settings.maxWidth - 55) / (95 - 55)) * 100}%`
                }}
              />
            </div>
            <span className={styles.value}>{settings.maxWidth}ch</span>
          </div>
        </div>

        {/* Text Alignment */}
        <div className={styles.setting}>
          <label className={styles.label}>Text Alignment</label>
          <div className={styles.alignmentGroup}>
            <SettingsTooltip content="Align text to the left">
              <button
                onClick={() => updateSetting('textAlign', 'left')}
                className={`${styles.alignButton} ${settings.textAlign === 'left' ? styles.active : ''}`}
                aria-label="Align text left"
              >
                <img src="/img/icons/align-left.svg" alt="" className={styles.alignIcon} />
              </button>
            </SettingsTooltip>
            <SettingsTooltip content="Center text">
              <button
                onClick={() => updateSetting('textAlign', 'center')}
                className={`${styles.alignButton} ${settings.textAlign === 'center' ? styles.active : ''}`}
                aria-label="Center text"
              >
                <img src="/img/icons/align-center.svg" alt="" className={styles.alignIcon} />
              </button>
            </SettingsTooltip>
            <SettingsTooltip content="Align text to the right">
              <button
                onClick={() => updateSetting('textAlign', 'right')}
                className={`${styles.alignButton} ${settings.textAlign === 'right' ? styles.active : ''}`}
                aria-label="Align text right"
              >
                <img src="/img/icons/align-right.svg" alt="" className={styles.alignIcon} />
              </button>
            </SettingsTooltip>
            <SettingsTooltip content="Justify text for even margins">
              <button
                onClick={() => updateSetting('textAlign', 'justify')}
                className={`${styles.alignButton} ${settings.textAlign === 'justify' ? styles.active : ''}`}
                aria-label="Justify text"
              >
                <img src="/img/icons/align-justify.svg" alt="" className={styles.alignIcon} />
              </button>
            </SettingsTooltip>
          </div>
        </div>

        {/* Dyslexia Font */}
        <div className={styles.setting}>
          <label className={styles.label}>Dyslexia-Friendly Font</label>
          <SettingsTooltip content="Use OpenDyslexic font for better readability">
            <button
              onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)}
              className={`${styles.toggle} ${settings.dyslexiaFont ? styles.toggleActive : ''}`}
              aria-label={`${settings.dyslexiaFont ? 'Disable' : 'Enable'} dyslexia-friendly font`}
            >
              <span className={styles.toggleSlider}></span>
            </button>
          </SettingsTooltip>
        </div>
      </div>
    </div>
  );
}
