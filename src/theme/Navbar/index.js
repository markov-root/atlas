// src/theme/Navbar/index.js - Updated to use settings.svg icon
import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@theme-original/Navbar';
import { SettingsDropdown } from '../../components/Settings';
import styles from './styles.module.css';

export default function NavbarWrapper(props) {
  const navbarRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Better mobile detection
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
    setIsClicked(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create global functions that can be accessed by the injected button
  useEffect(() => {
    window.atlasSettingsHandlers = {
      handleClick: () => {
        console.log('Click handler called, isClicked:', isClicked);
        const newClickState = !isClicked;
        setIsClicked(newClickState);
        setIsDropdownOpen(newClickState);
      },
      handleMouseEnter: () => {
        if (!isClicked) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsDropdownOpen(true);
        }
      },
      handleMouseLeave: () => {
        if (!isClicked) {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
          }, 200);
        }
      }
    };

    return () => {
      if (window.atlasSettingsHandlers) {
        delete window.atlasSettingsHandlers;
      }
    };
  }, [isClicked]);

  useEffect(() => {
    if (!isMounted) return;

    const injectSettingsButton = () => {
      const navbar = navbarRef.current;
      if (!navbar) return false;

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

      if (rightItems.querySelector(`.${styles.settingsButton}`)) {
        return true;
      }

      const settingsButton = document.createElement('button');
      settingsButton.className = `navbar__item ${styles.settingsButton}`;
      settingsButton.setAttribute('aria-label', 'Open reading settings');
      settingsButton.setAttribute('type', 'button');
      
      // Create the settings icon using SVG
      settingsButton.innerHTML = `
        <img 
          src="/img/icons/settings.svg" 
          alt="" 
          class="${styles.settingsIcon}" 
        />
      `;
      
      // Add event listeners using global handlers
      settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.atlasSettingsHandlers) {
          window.atlasSettingsHandlers.handleClick();
        }
      });

      if (!isMobile()) {
        settingsButton.addEventListener('mouseenter', () => {
          if (window.atlasSettingsHandlers) {
            window.atlasSettingsHandlers.handleMouseEnter();
          }
        });
        
        settingsButton.addEventListener('mouseleave', () => {
          if (window.atlasSettingsHandlers) {
            window.atlasSettingsHandlers.handleMouseLeave();
          }
        });
      }

      settingsButtonRef.current = settingsButton;

      const themeToggle = rightItems.querySelector('[class*="colorModeToggle"], [class*="toggle"]');
      if (themeToggle) {
        rightItems.insertBefore(settingsButton, themeToggle);
      } else {
        rightItems.appendChild(settingsButton);
      }

      return true;
    };

    let attempts = 0;
    const maxAttempts = 5;

    const tryInject = () => {
      attempts++;
      const success = injectSettingsButton();
      
      if (!success && attempts < maxAttempts) {
        setTimeout(tryInject, 100 * attempts);
      }
    };

    tryInject();
    
    const handleLoad = () => tryInject();
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [isMounted]);

  // Update aria-expanded
  useEffect(() => {
    if (settingsButtonRef.current) {
      settingsButtonRef.current.setAttribute('aria-expanded', isDropdownOpen ? 'true' : 'false');
    }
  }, [isDropdownOpen]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdown = document.querySelector(`.${styles.dropdownContainer}`);
      if (dropdown && !dropdown.contains(e.target) && 
          settingsButtonRef.current && !settingsButtonRef.current.contains(e.target)) {
        handleCloseDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle dropdown hover
  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    if (!isClicked) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 200);
    }
  };

  if (!isMounted) {
    return <Navbar {...props} />;
  }

  return (
    <div ref={navbarRef} className={styles.navbarContainer}>
      <Navbar {...props} />
      
      {settingsButtonRef.current && (
        <div 
          className={styles.dropdownContainer}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
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
