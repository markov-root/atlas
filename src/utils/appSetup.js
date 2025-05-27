// src/utils/appSetup.js - Initialize global configurations including Tippy
import { setupGlobalTippyDefaults } from './tippyConfig';

/**
 * Initialize global app configurations
 * Call this function once when your app starts
 */
export function initializeApp() {
  // Set up global Tippy defaults
  setupGlobalTippyDefaults();
  
  // Add global CSS classes for better Tippy integration
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('atlas-app');
    
    // Listen for theme changes to update Tippy styling if needed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          // Theme changed - Tippy will automatically use the updated CSS variables
          // No additional action needed since we're using CSS variables
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
  
  console.log('✅ Atlas app initialized with centralized Tippy configuration');
}

/**
 * Enhanced CSS class for app-wide Tippy improvements
 * Add this to your global CSS or call this function to inject it
 */
export function injectGlobalTippyStyles() {
  if (typeof document === 'undefined') return;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    /* Global Tippy enhancements for Atlas app */
    .atlas-app .tippy-box[data-theme~='atlas'] {
      /* Ensure consistent font rendering */
      font-feature-settings: 'kern' 1, 'liga' 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Better mobile responsiveness */
    @media (max-width: 768px) {
      .atlas-app .tippy-box[data-theme~='atlas'] {
        font-size: 0.8125rem;
        max-width: 90vw !important;
      }
      
      .atlas-app .tippy-box[data-theme~='atlas'] .tippy-content {
        padding: 0.625rem 0.875rem;
      }
    }
    
    /* High contrast mode improvements */
    @media (prefers-contrast: high) {
      .atlas-app .tippy-box[data-theme~='atlas'] {
        border-width: 2px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      }
    }
    
    /* Focus improvements for better accessibility */
    .atlas-app [data-tippy-root] {
      outline: none;
    }
    
    .atlas-app .tippy-box[data-theme~='atlas']:focus-within {
      outline: 2px solid var(--atlas-primary-lightest, #a5d8ff);
      outline-offset: 2px;
    }
  `;
  
  document.head.appendChild(styleSheet);
}
