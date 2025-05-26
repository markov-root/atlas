// src/theme/Navbar/index.js
import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@theme-original/Navbar';
import { SettingsDropdown } from '../../components/Settings';
import styles from './styles.module.css';

export default function NavbarWrapper(props) {
  const navbarRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    // Inject the settings button into the existing navbar structure
    const injectSettingsButton = () => {
      const navbar = navbarRef.current;
      if (!navbar) return;

      // Find the right-side navbar items container
      const rightItems = navbar.querySelector('.navbar__items--right');
      if (!rightItems) return;

      // Check if we've already added the settings button
      if (rightItems.querySelector(`.${styles.settingsButton}`)) return;

      // Create the settings button element
      const settingsButton = document.createElement('button');
      settingsButton.className = `navbar__item ${styles.settingsButton}`;
      settingsButton.title = 'Settings';
      settingsButton.setAttribute('aria-label', 'Open settings');
      settingsButton.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
      
      // Add the settings icon using your SVG
      settingsButton.innerHTML = `
        <img src="/img/icons/settings.svg" alt="" width="20" height="20" style="display: block;" />
      `;
      
      settingsButton.addEventListener('click', handleSettingsClick);

      // Store reference for dropdown positioning
      settingsButtonRef.current = settingsButton;

      // Insert the settings button before the theme toggle
      const themeToggle = rightItems.querySelector('[class*="colorModeToggle"]');
      if (themeToggle) {
        rightItems.insertBefore(settingsButton, themeToggle);
      } else {
        // Fallback: append to the end
        rightItems.appendChild(settingsButton);
      }
    };

    // Inject on mount and when the component updates
    const timer = setTimeout(injectSettingsButton, 0);
    
    return () => clearTimeout(timer);
  }, [isDropdownOpen]);

  // Update aria-expanded when dropdown state changes
  useEffect(() => {
    if (settingsButtonRef.current) {
      settingsButtonRef.current.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
    }
  }, [isDropdownOpen]);

  return (
    <div ref={navbarRef} className={styles.navbarContainer}>
      <Navbar {...props} />
      
      {/* Settings Dropdown */}
      {settingsButtonRef.current && (
        <div className={styles.dropdownContainer}>
          <SettingsDropdown
            isOpen={isDropdownOpen}
            onClose={handleCloseDropdown}
            triggerRef={settingsButtonRef}
          />
        </div>
      )}
    </div>
  );
}
