import React from 'react';
import UseAnimations from 'react-useanimations';
import * as LucideIcons from 'lucide-react';
import { iconMappings } from './iconMappings';

export const AnimatedIcon = ({
  name,           // Icon name (e.g., 'Loader2', 'Menu', 'Trash2')
  size = 24,      // Size in pixels
  className = '', // Tailwind classes
  autoplay = false,
  reverse = false,
  strokeColor,
  fillColor,
  ...props
}) => {
  const mapping = iconMappings[name];

  // If icon has animated version, use react-useanimations
  if (mapping?.animated) {
    return (
      <UseAnimations
        animation={mapping.animation}
        size={size}
        strokeColor={strokeColor || 'inherit'}
        fillColor={fillColor || ''}
        autoplay={autoplay}
        reverse={reverse}
        wrapperStyle={{ display: 'inline-block' }}
        {...props}
      />
    );
  }

  // Fallback to Lucide icon
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon) return null;

  return <LucideIcon size={size} className={className} {...props} />;
};
