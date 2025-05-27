// src/utils/tippyConfig.js - Centralized Tippy configuration for Atlas components

/**
 * Default Tippy configuration for Atlas components
 * This ensures consistent styling and behavior across all tooltips
 */
export const ATLAS_TIPPY_DEFAULTS = {
  theme: 'atlas',
  animation: 'shift-away',
  arrow: true,
  placement: 'top',
  delay: [300, 100], // [show delay, hide delay]
  duration: [200, 150], // [show duration, hide duration]
  maxWidth: 300,
  interactive: false,
  appendTo: () => document.body,
  // Enhanced easing for smooth animations
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  // Offset from trigger element
  offset: [0, 8],
  // Better positioning
  flip: true,
  flipBehavior: ['top', 'bottom', 'right', 'left'],
  boundary: 'viewport',
  // Accessibility
  aria: {
    content: 'auto',
    expanded: 'auto'
  }
};

/**
 * Preset configurations for different tooltip types
 */
export const TIPPY_PRESETS = {
  // Standard tooltip (default)
  default: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas',
    maxWidth: 300
  },
  
  // Small, quick tooltips for icons or short labels
  small: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas-small',
    maxWidth: 200,
    delay: [200, 50],
    duration: [150, 100]
  },
  
  // Interactive tooltips with clickable content
  interactive: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas-interactive',
    maxWidth: 400,
    interactive: true,
    interactiveBorder: 20,
    delay: [100, 300], // Longer hide delay for interactive content
    duration: [250, 200],
    trigger: 'click',
    hideOnClick: true
  },
  
  // Footnote tooltips - optimized for longer text content
  footnote: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas',
    maxWidth: 350,
    placement: 'top',
    delay: [300, 100],
    duration: [200, 150],
    interactive: false,
    // Special handling for footnotes
    allowHTML: true
  },
  
  // Help/info tooltips
  help: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas',
    maxWidth: 280,
    placement: 'top',
    delay: [200, 100],
    animation: 'atlas-fade'
  },
  
  // Navigation tooltips
  nav: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas-small',
    maxWidth: 180,
    placement: 'bottom',
    delay: [400, 100],
    duration: [150, 100]
  },
  
  // Error/warning tooltips
  warning: {
    ...ATLAS_TIPPY_DEFAULTS,
    theme: 'atlas',
    maxWidth: 320,
    placement: 'top',
    delay: [100, 150],
    duration: [200, 150],
    trigger: 'mouseenter focus'
  }
};

/**
 * Utility function to create Tippy props with Atlas defaults
 * @param {string} preset - The preset to use ('default', 'small', 'interactive', etc.)
 * @param {Object} customProps - Custom properties to override defaults
 * @returns {Object} Complete Tippy props object
 */
export function createTippyProps(preset = 'default', customProps = {}) {
  const baseProps = TIPPY_PRESETS[preset] || TIPPY_PRESETS.default;
  
  return {
    ...baseProps,
    ...customProps,
    // Ensure theme is always set to an Atlas theme
    theme: customProps.theme?.startsWith('atlas') ? customProps.theme : baseProps.theme
  };
}

/**
 * Higher-order component wrapper for consistent Tippy usage
 * @param {Object} props - Tippy props
 * @returns {Object} Enhanced props with Atlas defaults
 */
export function withAtlasTippy(props = {}) {
  const preset = props.preset || 'default';
  const { preset: _, ...otherProps } = props;
  
  return createTippyProps(preset, otherProps);
}

/**
 * React hook for Tippy configuration
 * @param {string} preset - The preset to use
 * @param {Object} customProps - Custom properties
 * @returns {Object} Tippy configuration object
 */
export function useTippyConfig(preset = 'default', customProps = {}) {
  return createTippyProps(preset, customProps);
}

/**
 * Configuration for specific Atlas components
 */
export const COMPONENT_TIPPY_CONFIGS = {
  // Footnote component
  footnote: {
    ...TIPPY_PRESETS.footnote,
    content: '', // Will be set dynamically
    allowHTML: true
  },
  
  // Settings dropdown items
  settingsItem: {
    ...TIPPY_PRESETS.help,
    placement: 'left',
    delay: [400, 100]
  },
  
  // Navigation breadcrumbs
  breadcrumb: {
    ...TIPPY_PRESETS.nav,
    placement: 'bottom'
  },
  
  // Chapter header action buttons
  actionButton: {
    ...TIPPY_PRESETS.small,
    placement: 'top',
    delay: [300, 100]
  },
  
  // Audio player controls
  audioControl: {
    ...TIPPY_PRESETS.small,
    placement: 'top',
    maxWidth: 150
  },
  
  // Figure/media zoom hints
  mediaHint: {
    ...TIPPY_PRESETS.small,
    placement: 'bottom',
    content: 'Click to zoom',
    delay: [500, 100]
  }
};

/**
 * Utility to get component-specific Tippy config
 * @param {string} componentType - The component type
 * @param {Object} customProps - Custom properties to override
 * @returns {Object} Component-specific Tippy configuration
 */
export function getComponentTippyConfig(componentType, customProps = {}) {
  const baseConfig = COMPONENT_TIPPY_CONFIGS[componentType] || TIPPY_PRESETS.default;
  
  return {
    ...baseConfig,
    ...customProps
  };
}

/**
 * Global Tippy setup function - call this once in your app initialization
 * This sets up global defaults that will be applied to all Tippy instances
 */
export function setupGlobalTippyDefaults() {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Set global defaults if Tippy is available
  if (window.tippy && window.tippy.setDefaultProps) {
    window.tippy.setDefaultProps(ATLAS_TIPPY_DEFAULTS);
  }
}

/**
 * Responsive Tippy configuration based on screen size
 * @param {string} preset - Base preset to use
 * @returns {Object} Responsive Tippy configuration
 */
export function getResponsiveTippyConfig(preset = 'default') {
  const baseConfig = TIPPY_PRESETS[preset];
  
  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    return {
      ...baseConfig,
      // Adjust for mobile
      maxWidth: Math.min(baseConfig.maxWidth, 280),
      placement: 'top', // Prefer top placement on mobile
      delay: [200, 100], // Faster on mobile
      offset: [0, 6], // Smaller offset
      boundary: 'viewport',
      // Prevent tooltips from going off-screen on mobile
      popperOptions: {
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8
            }
          }
        ]
      }
    };
  }
  
  return baseConfig;
}
