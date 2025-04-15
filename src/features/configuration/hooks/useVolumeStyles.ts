import { useMemo } from 'react';

interface VolumeStylesConfig {
  isHovered: boolean;
  temperature?: 'positive' | 'negative';
}

export function useVolumeStyles() {
  const COLORS = useMemo(() => ({
    positive: { 
      fill: '#ECFDF5', 
      border: '#10B981', 
      icon: '🔥',
      hoverFill: '#D1FAE5'
    },
    negative: { 
      fill: '#EFF6FF', 
      border: '#3B82F6', 
      icon: '❄️',
      hoverFill: '#DBEAFE'
    },
    undefined: { 
      fill: '#F9FAFB', 
      border: '#E5E7EB', 
      icon: '❓', 
      hoverFill: '#F3F4F6' 
    },
    hover: { 
      fill: '#F3F4F6', 
      border: '#4B5563' 
    }
  }), []);

  const CONSTANTS = useMemo(() => ({
    PADDING: 40,
    GAP: 16,
    SCALE: 105,
    MIN_WIDTH: 120,
    CORNER_RADIUS: 4,
    STROKE_WIDTH: 1.5,
  }), []);

  const getVolumeStyles = ({ isHovered, temperature }: VolumeStylesConfig) => {
    const colors = COLORS[temperature || 'undefined'];
    return {
      fillColor: isHovered ? colors.hoverFill || COLORS.hover.fill : colors.fill,
      strokeColor: isHovered ? COLORS.hover.border : colors.border,
      icon: colors.icon
    };
  };

  return {
    COLORS,
    CONSTANTS,
    getVolumeStyles
  };
}