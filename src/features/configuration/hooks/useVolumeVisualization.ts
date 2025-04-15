import { useState, useCallback } from 'react';
import type { ModelingData } from '../../../types';

interface UseVolumeVisualizationProps {
  data: ModelingData | null;
  onVolumeSelect: (groupId: number, temperature: 'positive' | 'negative') => void;
}

export function useVolumeVisualization({ data, onVolumeSelect }: UseVolumeVisualizationProps) {
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  const handleVolumeSelect = useCallback((groupId: number, temperature: 'positive' | 'negative') => {
    onVolumeSelect(groupId, temperature);
  }, [onVolumeSelect]);

  const getTotalDimensions = useCallback(() => {
    if (!data?.shapes) return { width: 0, height: 0 };

    const PADDING = 40;
    const GAP = 16;
    const SCALE = 105;
    const MIN_WIDTH = 120;

    const totalWidth = data.shapes.reduce((acc, shape, i) => {
      const width = Math.max(shape.inner_dimensions.width * SCALE, MIN_WIDTH);
      return acc + width + (i < data.shapes.length - 1 ? GAP : 0);
    }, PADDING * 2);

    const maxHeight = Math.max(
      ...data.shapes.map(shape => shape.inner_dimensions.height * SCALE)
    ) + PADDING * 2;

    return { width: totalWidth, height: maxHeight };
  }, [data]);

  return {
    hoveredPart,
    setHoveredPart,
    handleVolumeSelect,
    getTotalDimensions
  };
}