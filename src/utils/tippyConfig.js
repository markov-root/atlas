// src/utils/tippyConfig.js - Complete file with all exports and fixed props
export const ATLAS_TIPPY_DEFAULTS = {
  theme: 'atlas',
  animation: 'shift-away',
  arrow: true,
  placement: 'top',
  delay: [300, 100],
  duration: [200, 150],
  maxWidth: 300,
  interactive: false,
  appendTo: () => document.body,
  // Remove invalid props and use popperOptions instead
  offset: [0, 8],
  flipOnUpdate: true,
  
  // Use popperOptions for advanced positioning
  popperOptions: {
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['bottom', 'right', 'left'],
          boundary: 'viewport'
        }
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport'
        }
      }
    ]
  },
  
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
    delay: [100, 300],
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
 */
export function createTippyProps(preset = 'default', customProps = {}) {
  const baseProps = TIPPY_PRESETS[preset] || TIPPY_PRESETS.default;
  
  return {
    ...baseProps,
    ...customProps,
    theme: customProps.theme?.startsWith('atlas') ? customProps.theme : baseProps.theme
  };
}

/**
 * Higher-order component wrapper for consistent Tippy usage
 */
export function withAtlasTippy(props = {}) {
  const preset = props.preset || 'default';
  const { preset: _, ...otherProps } = props;
  
  return createTippyProps(preset, otherProps);
}

/**
 * React hook for Tippy configuration
 */
export function useTippyConfig(preset = 'default', customProps = {}) {
  return createTippyProps(preset, customProps);
}

/**
 * Configuration for specific Atlas components
 */
export const COMPONENT_TIPPY_CONFIGS = {
  footnote: {
    ...TIPPY_PRESETS.footnote,
    content: '',
    allowHTML: true
  },
  
  settingsItem: {
    ...TIPPY_PRESETS.help,
    placement: 'left',
    delay: [400, 100]
  },
  
  breadcrumb: {
    ...TIPPY_PRESETS.nav,
    placement: 'bottom'
  },
  
  actionButton: {
    ...TIPPY_PRESETS.small,
    placement: 'top',
    delay: [300, 100]
  },
  
  audioControl: {
    ...TIPPY_PRESETS.small,
    placement: 'top',
    maxWidth: 150
  },
  
  mediaHint: {
    ...TIPPY_PRESETS.small,
    placement: 'bottom',
    content: 'Click to zoom',
    delay: [500, 100]
  }
};

/**
 * Utility to get component-specific Tippy config
 */
export function getComponentTippyConfig(componentType, customProps = {}) {
  const baseConfig = COMPONENT_TIPPY_CONFIGS[componentType] || TIPPY_PRESETS.default;
  
  return {
    ...baseConfig,
    ...customProps
  };
}

/**
 * Global Tippy setup function
 */
export function setupGlobalTippyDefaults() {
  if (typeof window === 'undefined') return;
  
  if (window.tippy && window.tippy.setDefaultProps) {
    window.tippy.setDefaultProps(ATLAS_TIPPY_DEFAULTS);
  }
}

/**
 * Responsive Tippy configuration based on screen size
 */
export function getResponsiveTippyConfig(preset = 'default') {
  const baseConfig = TIPPY_PRESETS[preset];
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    return {
      ...baseConfig,
      maxWidth: Math.min(baseConfig.maxWidth, 280),
      placement: 'top',
      delay: [200, 100],
      offset: [0, 6],
      popperOptions: {
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8
            }
          },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom', 'right', 'left'],
              boundary: 'viewport'
            }
          }
        ]
      }
    };
  }
  
  return baseConfig;
}
