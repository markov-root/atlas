// src/theme/Navbar/index.js - Updated with centralized Tippy configuration
import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@theme-original/Navbar';
import { SettingsDropdown } from '../../components/Settings';
import { NavTooltip } from '../../components/UI/Tooltip';
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
      settingsButton.setAttribute('aria-label', 'Open settings');
      settingsButton.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
      
      // Create the image element with proper class
      const iconImg = document.createElement('img');
      iconImg.src = '/img/icons/settings.svg';
      iconImg.alt = '';
      iconImg.width = 20;
      iconImg.height = 20;
      iconImg.className = styles.settingsIcon;
      iconImg.style.display = 'block';
      
      settingsButton.appendChild(iconImg);
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

      // Add tooltip using centralized configuration
      // Note: We need to dynamically import and apply tooltip after DOM manipulation
      import('../../utils/tippyConfig').then(({ getComponentTippyConfig }) => {
        import('tippy.js').then(({ default: tippy }) => {
          tippy(settingsButton, {
            ...getComponentTippyConfig('settingsItem'),
            content: 'Settings',
            placement: 'bottom'
          });
        });
      });
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
