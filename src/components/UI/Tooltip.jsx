// src/components/ui/AtlasTooltip.jsx - Centralized Tooltip component for Atlas

import React from 'react';
import Tippy from '@tippyjs/react';
import { createTippyProps, getComponentTippyConfig, getResponsiveTippyConfig } from '../../utils/tippyConfig';

/**
 * Atlas Tooltip Component - Centralized tooltip with Atlas theming
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The trigger element
 * @param {string|React.ReactNode} props.content - Tooltip content
 * @param {string} props.preset - Preset configuration ('default', 'small', 'interactive', etc.)
 * @param {string} props.componentType - Component-specific config ('footnote', 'actionButton', etc.)
 * @param {boolean} props.responsive - Whether to use responsive configuration
 * @param {Object} props.tippyProps - Additional Tippy props to override defaults
 * @param {...props} props.otherProps - Other props passed to Tippy
 */
export default function AtlasTooltip({
  children,
  content,
  preset = 'default',
  componentType = null,
  responsive = true,
  tippyProps = {},
  ...otherProps
}) {
  // Get the appropriate configuration
  let config;
  
  if (componentType) {
    // Use component-specific configuration
    config = getComponentTippyConfig(componentType, tippyProps);
  } else if (responsive) {
    // Use responsive configuration
    config = getResponsiveTippyConfig(preset);
  } else {
    // Use preset configuration
    config = createTippyProps(preset, tippyProps);
  }
  
  // Merge with any additional props
  const finalProps = {
    ...config,
    ...otherProps,
    content
  };
  
  return (
    <Tippy {...finalProps}>
      {children}
    </Tippy>
  );
}

/**
 * Specialized tooltip components for common use cases
 */

// Small tooltip for icons and short labels
export function SmallTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip preset="small" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Interactive tooltip for clickable content
export function InteractiveTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip preset="interactive" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Help/info tooltip
export function HelpTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip preset="help" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Navigation tooltip
export function NavTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip preset="nav" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Warning/error tooltip
export function WarningTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip preset="warning" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Component-specific tooltips

// Footnote tooltip
export function FootnoteTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip componentType="footnote" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Action button tooltip
export function ActionButtonTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip componentType="actionButton" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Settings item tooltip
export function SettingsTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip componentType="settingsItem" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Audio control tooltip
export function AudioControlTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip componentType="audioControl" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

// Media hint tooltip (for zoom hints, etc.)
export function MediaHintTooltip({ children, content, ...props }) {
  return (
    <AtlasTooltip componentType="mediaHint" content={content} {...props}>
      {children}
    </AtlasTooltip>
  );
}

/**
 * Hook for imperatively creating tooltips
 * Useful for dynamically created elements
 */
export function useAtlasTooltip(preset = 'default', customProps = {}) {
  const config = createTippyProps(preset, customProps);
  
  return React.useCallback((element, content) => {
    if (!element || typeof window === 'undefined') return null;
    
    // Dynamically import tippy for imperative usage
    import('tippy.js').then(({ default: tippy }) => {
      return tippy(element, {
        ...config,
        content
      });
    });
  }, [config]);
}

/**
 * HOC for adding tooltips to existing components
 */
export function withAtlasTooltip(WrappedComponent, tooltipConfig = {}) {
  const WithTooltipComponent = React.forwardRef((props, ref) => {
    const { tooltip, tooltipProps = {}, ...componentProps } = props;
    
    if (!tooltip) {
      return <WrappedComponent ref={ref} {...componentProps} />;
    }
    
    return (
      <AtlasTooltip content={tooltip} {...tooltipConfig} {...tooltipProps}>
        <WrappedComponent ref={ref} {...componentProps} />
      </AtlasTooltip>
    );
  });
  
  WithTooltipComponent.displayName = `withAtlasTooltip(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithTooltipComponent;
}
