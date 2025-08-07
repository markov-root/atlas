// src/components/FloatingActions/FloatingActionsRow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import SettingsDropdown from '../Settings/SettingsDropdown';
import { TTSButton } from '../TTS';
import { ActionButtonTooltip } from '../UI/Tooltip';
import { buildTtsFile, debugTtsFiles } from '../../utils/ttsUtils';
import { buildAudioFiles, hasAudioFiles } from '../../utils/audioUtils';
import styles from './FloatingActionsRow.module.css';

export default function FloatingActionsRow() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [ttsData, setTtsData] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(true);
  
  const settingsTriggerRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const settingsWrapperRef = useRef(null);
  const location = useLocation();

  // TTS availability check - async
  useEffect(() => {
    async function checkTtsAvailability() {
      setTtsLoading(true);
      
      console.log(`🔍 Checking TTS for current page: ${location.pathname}`);
      
      try {
        const result = await buildTtsFile(location);
        
        console.log(`🎵 TTS check result for ${location.pathname}:`, result);
        
        setTtsData(result);
        
        debugTtsFiles('FloatingActionsRow (async)', {
          pathname: location.pathname,
          pageInfo: result.pageInfo,
          asyncResult: result
        });
      } catch (error) {
        console.error(`❌ TTS availability check failed for ${location.pathname}:`, error);
        // Set to inactive if check fails
        setTtsData({
          type: 'none',
          url: null,
          isActive: false,
          filename: null,
          pageInfo: null
        });
      } finally {
        setTtsLoading(false);
      }
    }
    
    checkTtsAvailability();
  }, [location.pathname]);

  // Monitor scroll position and user activity for auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show scroll to top if scrolled down more than 300px
      setShowScrollToTop(scrollTop > 300);
      
      // Check if we're near the bottom (within 100px)
      setIsAtBottom(scrollTop + windowHeight >= documentHeight - 100);
      
      // Reset activity timer on scroll
      setLastActivity(Date.now());
      setIsVisible(true);
    };

    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsVisible(true);
    };

    // Track user activity
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-hide after 3 seconds of inactivity
  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > 3000 && !isSettingsOpen) { // 3 seconds
        setIsVisible(false);
      }
    };

    hideTimeoutRef.current = setInterval(checkActivity, 1000);
    
    return () => {
      if (hideTimeoutRef.current) {
        clearInterval(hideTimeoutRef.current);
      }
    };
  }, [lastActivity, isSettingsOpen]);

  // Backup click-outside handler for settings dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSettingsOpen && 
          settingsWrapperRef.current && 
          !settingsWrapperRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen);
    // Reset activity when opening settings to prevent auto-hide
    if (!isSettingsOpen) {
      setLastActivity(Date.now());
    }
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Handle audio state changes from TTS (for coordination with other audio)
  const handleAudioStateChange = (audioInfo) => {
    console.log('🎵 Audio state change from TTS:', audioInfo);
    // This is where we could coordinate with other audio components
    // For now, just log - the coordination happens within the TTS component
  };

  // Determine if audio button should be shown
  const shouldShowAudioButton = () => {
    if (!ttsData || ttsLoading) return false;
    
    const pageInfo = ttsData.pageInfo;
    const isChapterPage = pageInfo?.pageType === 'chapter' || pageInfo?.pageType === 'section';
    
    if (!isChapterPage) return false;
    
    // Check if we have TTS
    const hasTts = ttsData.isActive;
    
    // Check if we have chapter audio (podcast)
    const chapterNumber = pageInfo.chapterNumber;
    const audioFiles = chapterNumber ? buildAudioFiles({}, chapterNumber) : {};
    const hasPodcast = hasAudioFiles(audioFiles);
    
    console.log('🎵 Audio button visibility check:', {
      isChapterPage,
      hasTts,
      hasPodcast,
      chapterNumber,
      shouldShow: hasTts || hasPodcast
    });
    
    // Show button if we have either TTS or podcast
    return hasTts || hasPodcast;
  };

  const getChapterNumber = () => {
    if (!ttsData?.pageInfo) return null;
    return ttsData.pageInfo.chapterNumber;
  };

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.actionsRow}>
        
        {/* Audio Button - Above settings, show when TTS OR chapter audio available */}
        {shouldShowAudioButton() && (
          <TTSButton 
            ttsData={ttsData}
            chapterNumber={getChapterNumber()}
            onAudioStateChange={handleAudioStateChange}
          />
        )}
        
        {/* Settings Button */}
        <div className={styles.settingsButtonWrapper} ref={settingsWrapperRef}>
          <ActionButtonTooltip 
            content="Reading Settings"
            placement="left"
            disabled={isSettingsOpen}
          >
            <button
              ref={settingsTriggerRef}
              onClick={handleSettingsToggle}
              className={`${styles.actionButton} ${styles.settingsButton} ${isSettingsOpen ? styles.active : ''}`}
              aria-label="Reading settings"
              aria-expanded={isSettingsOpen}
            >
              <img 
                src="/img/icons/settings.svg" 
                alt="" 
                className={styles.buttonIcon}
              />
            </button>
          </ActionButtonTooltip>

          {/* Settings Dropdown - positioned relative to settings button */}
          {isSettingsOpen && (
            <SettingsDropdown
              isOpen={isSettingsOpen}
              onClose={handleSettingsClose}
              triggerRef={settingsTriggerRef}
            />
          )}
        </div>

        {/* Scroll to Top Button - Only show when scrolled down */}
        {showScrollToTop && (
          <ActionButtonTooltip 
            content="Scroll to top"
            placement="left"
          >
            <button
              onClick={scrollToTop}
              className={`${styles.actionButton} ${styles.scrollButton}`}
              aria-label="Scroll to top"
            >
              <img 
                src="/img/icons/arrow-up.svg" 
                alt="" 
                className={styles.buttonIcon}
              />
            </button>
          </ActionButtonTooltip>
        )}

        {/* Scroll to Bottom Button - Only show when not at bottom */}
        {!isAtBottom && (
          <ActionButtonTooltip 
            content="Scroll to bottom"
            placement="left"
          >
            <button
              onClick={scrollToBottom}
              className={`${styles.actionButton} ${styles.scrollButton}`}
              aria-label="Scroll to bottom"
            >
              <img 
                src="/img/icons/arrow-down.svg" 
                alt="" 
                className={styles.buttonIcon}
              />
            </button>
          </ActionButtonTooltip>
        )}
        
      </div>
    </div>
  );
}
