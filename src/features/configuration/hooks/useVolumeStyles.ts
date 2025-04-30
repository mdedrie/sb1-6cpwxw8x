import { useMemo } from 'react';

type Temperature = 'positive' | 'negative' | undefined;

interface VolumeStylesConfig {
  isHovered: boolean;
  temperature?: Temperature;
}

interface VolumeColors {
  fill: string;
  border: string;
  icon: string;
  hoverFill: string;
}

export function useVolumeStyles() {
  const COLORS: Record<'positive' | 'negative' | 'undefined' | 'hover', VolumeColors> = useMemo(() => ({
    positive: { fill: '#ECFDF5', border: '#10B981', icon: '🔥', hoverFill: '#D1FAE5' },
    negative: { fill: '#EFF6FF', border: '#3B82F6', icon: '❄️', hoverFill: '#DBEAFE' },
    undefined: { fill: '#F9FAFB', border: '#E5E7EB', icon: '❓', hoverFill: '#F3F4F6' },
    hover: { fill: '#F3F4F6', border: '#4B5563', icon: '', hoverFill: '#F3F4F6' }
  } as const), []);

  const CONSTANTS = useMemo(() => ({
    PADDING: 40,
    GAP: 16,
    SCALE: 105,
    MIN_WIDTH: 120,
    CORNER_RADIUS: 4,
    STROKE_WIDTH: 1.5,
  }), []);

  function groupColorByIdx(idx: string | number) {
    const palette = [
      "#FFD6D6", "#FFF6B3", "#C9F9D6", "#C3D9FF", "#FBC4FF",
      "#FFCFC9", "#C8FAFF", "#FEEEDE", "#D7EEFF", "#FBE568", "#E1FFB8",
    ];
    const str = idx.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  const getVolumeStyles = (
    { isHovered, temperature }: VolumeStylesConfig
  ) => {
    const colors = COLORS[temperature ?? 'undefined'];
    const fillColor = isHovered
      ? (colors.hoverFill || COLORS.hover.fill)
      : colors.fill;
    const strokeColor = isHovered
      ? COLORS.hover.border
      : colors.border;
    const icon = colors.icon ?? '';
    return { fillColor, strokeColor, icon };
  };

  return {
    COLORS,
    CONSTANTS,
    getVolumeStyles,
    groupColorByIdx,
  };
}