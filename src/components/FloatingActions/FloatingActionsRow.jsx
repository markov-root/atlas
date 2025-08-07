// src/components/FloatingActions/FloatingActionsRow.jsx - Clean version with minimal logging
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

  // TTS availability check - async with error boundary
  useEffect(() => {
    let isMounted = true;
    
    async function checkTtsAvailability() {
      setTtsLoading(true);
      
      try {
        const result = await buildTtsFile(location);
        
        if (!isMounted) return;
        
        setTtsData(result);
        
        // Only log once per page load
        console.log(`🎵 TTS detection result for ${location.pathname}:`, {
          isActive: result.isActive,
          url: result.url,
          pageType: result.pageInfo?.pageType
        });
        
      } catch (error) {
        console.error(`❌ TTS detection failed for ${location.pathname}:`, error);
        if (!isMounted) return;
        
        setTtsData({
          type: 'error',
          url: null,
          isActive: false,
          filename: null,
          pageInfo: null
        });
      } finally {
        if (isMounted) {
          setTtsLoading(false);
        }
      }
    }
    
    checkTtsAvailability();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname]); // Only re-run when pathname changes

  // Monitor scroll position and user activity for auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setShowScrollToTop(scrollTop > 300);
      setIsAtBottom(scrollTop + windowHeight >= documentHeight - 100);
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
      
      if (timeSinceActivity > 3000 && !isSettingsOpen) {
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

  // Click-outside handler for settings dropdown
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

  // Handle audio state changes from TTS
  const handleAudioStateChange = (audioInfo) => {
    // Audio coordination happens within the TTS component
  };

  // Determine if audio button should be shown - MEMOIZED to prevent re-renders
  const shouldShowAudioButton = React.useMemo(() => {
    if (!ttsData || ttsLoading) {
      return false;
    }
    
    const pageInfo = ttsData.pageInfo;
    const isChapterPage = pageInfo?.pageType === 'chapter' || pageInfo?.pageType === 'section';
    
    if (!isChapterPage) {
      return false;
    }
    
    // Check if we have TTS
    const hasTts = ttsData.isActive;
    
    // Check if we have chapter audio (podcast)
    const chapterNumber = pageInfo.chapterNumber;
    const audioFiles = chapterNumber ? buildAudioFiles({}, chapterNumber) : {};
    const hasPodcast = hasAudioFiles(audioFiles);
    
    // Show button if we have either TTS or podcast
    return hasTts || hasPodcast;
  }, [ttsData, ttsLoading]);

  const getChapterNumber = () => {
    if (!ttsData?.pageInfo) return null;
    return ttsData.pageInfo.chapterNumber;
  };

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.actionsRow}>
        
        {/* Audio Button */}
        {shouldShowAudioButton && (
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

          {/* Settings Dropdown */}
          {isSettingsOpen && (
            <SettingsDropdown
              isOpen={isSettingsOpen}
              onClose={handleSettingsClose}
              triggerRef={settingsTriggerRef}
            />
          )}
        </div>

        {/* Scroll to Top Button */}
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

        {/* Scroll to Bottom Button */}
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
