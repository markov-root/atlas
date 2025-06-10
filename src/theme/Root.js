// src/theme/Root.js - Fixed import syntax
import React, { useEffect } from 'react';
import { SettingsProvider } from '../components/Settings';
import FloatingActionsRow from '../components/FloatingActions/FloatingActionsRow';
import { initializeApp, injectGlobalTippyStyles } from '../utils/appSetup';

// This component wraps your entire app and provides global context
export default function Root({ children }) {
  useEffect(() => {
    // Initialize app-wide configurations including Tippy
    initializeApp();
    
    // Inject additional global styles for better Tippy integration
    injectGlobalTippyStyles();
    
    // Optional: Add global keyboard shortcuts for accessibility
    const handleGlobalKeydown = (e) => {
      // ESC key closes all tooltips
      if (e.key === 'Escape') {
        // Tippy will handle this automatically, but we can add custom behavior here
        // For example, close any custom modals or overlays
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, []);

  return (
    <SettingsProvider>
      {children}
      <FloatingActionsRow />
    </SettingsProvider>
  );
}
