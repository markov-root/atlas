// src/theme/Navbar/index.js - Fixed for mobile compatibility
import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@theme-original/Navbar';
import { SettingsDropdown } from '../../components/Settings';
import { NavTooltip } from '../../components/UI/Tooltip';
import styles from './styles.module.css';

export default function NavbarWrapper(props) {
  const navbarRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handleSettingsClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Better mobile detection
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // More robust injection with retries
    const injectSettingsButton = () => {
      const navbar = navbarRef.current;
      if (!navbar) return false;

      // Try multiple selectors for navbar items
      const selectors = [
        '.navbar__items--right',
        '.navbar__items.navbar__items--right',
        '[class*="navbar__items"][class*="right"]'
      ];

      let rightItems = null;
      for (const selector of selectors) {
        rightItems = navbar.querySelector(selector);
        if (rightItems) break;
      }

      if (!rightItems) {
        console.warn('Could not find navbar right items container');
        return false;
      }

      // Check if we've already added the settings button
      if (rightItems.querySelector(`.${styles.settingsButton}`)) {
        return true;
      }

      // Create the settings button element
      const settingsButton = document.createElement('button');
      settingsButton.className = `navbar__item ${styles.settingsButton}`;
      settingsButton.setAttribute('aria-label', 'Open reading settings');
      settingsButton.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
      settingsButton.setAttribute('type', 'button');
      
      // Create the image element with proper error handling
      const iconImg = document.createElement('img');
      iconImg.src = '/img/icons/settings.svg';
      iconImg.alt = 'Settings';
      iconImg.width = 20;
      iconImg.height = 20;
      iconImg.className = styles.settingsIcon;
      iconImg.style.display = 'block';
      
      // Add error handling for icon loading
      iconImg.onerror = () => {
        console.warn('Settings icon failed to load, using fallback');
        // Fallback to text if icon fails
        settingsButton.innerHTML = '⚙️';
        settingsButton.style.fontSize = '16px';
      };
      
      settingsButton.appendChild(iconImg);
      settingsButton.addEventListener('click', handleSettingsClick);

      // Store reference for dropdown positioning
      settingsButtonRef.current = settingsButton;

      // Insert the settings button before the theme toggle or at the end
      const themeToggle = rightItems.querySelector('[class*="colorModeToggle"], [class*="toggle"]');
      if (themeToggle) {
        rightItems.insertBefore(settingsButton, themeToggle);
      } else {
        rightItems.appendChild(settingsButton);
      }

      // Add tooltip for desktop only (mobile tooltips can be problematic)
      if (!isMobile()) {
        import('../../utils/tippyConfig').then(({ getComponentTippyConfig }) => {
          import('tippy.js').then(({ default: tippy }) => {
            tippy(settingsButton, {
              ...getComponentTippyConfig('settingsItem'),
              content: 'Reading Settings',
              placement: 'bottom'
            });
          });
        }).catch(err => {
          console.warn('Could not load tooltip system:', err);
        });
      }

      return true;
    };

    // Try injection with multiple attempts
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 100;

    const tryInject = () => {
      attempts++;
      const success = injectSettingsButton();
      
      if (!success && attempts < maxAttempts) {
        setTimeout(tryInject, retryDelay * attempts); // Increasing delay
      } else if (!success) {
        console.error('Failed to inject settings button after', maxAttempts, 'attempts');
      }
    };

    // Start injection attempts
    tryInject();
    
    // Also try on window load as a fallback
    const handleLoad = () => tryInject();
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [isDropdownOpen, isMounted]);

  // Update aria-expanded when dropdown state changes
  useEffect(() => {
    if (settingsButtonRef.current) {
      settingsButtonRef.current.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
    }
  }, [isDropdownOpen]);

  // Handle clicks outside dropdown on mobile
  useEffect(() => {
    if (!isDropdownOpen || !isMobile()) return;

    const handleTouchStart = (e) => {
      const dropdown = document.querySelector(`.${styles.dropdownContainer}`);
      if (dropdown && !dropdown.contains(e.target) && 
          settingsButtonRef.current && !settingsButtonRef.current.contains(e.target)) {
        handleCloseDropdown();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isDropdownOpen]);

  if (!isMounted) {
    return <Navbar {...props} />;
  }

  return (
    <div ref={navbarRef} className={styles.navbarContainer}>
      <Navbar {...props} />
      
      {/* Settings Dropdown - only render if we have a button reference */}
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
