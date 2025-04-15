import { useMemo } from 'react';
import type { ModelingData, Temperature } from '../../../types';

interface VolumePart {
  index: number;
  height: number;
  volume: number;
  y_start: number;
  merge_group_id: number;
}

interface VolumeGroup {
  groupId: number;
  columnIndex: number;
  parts: VolumePart[];
  x: number;
  y: number;
  width: number;
  height: number;
  temperature?: Temperature;
}

export const COLORS = {
  positive: { 
    fill: '#ECFDF5', 
    fillHover: '#ECFDF5',
    border: '#10B981', 
    borderHover: '#10B981',
    icon: '🔥'
  },
  negative: { 
    fill: '#EFF6FF', 
    fillHover: '#EFF6FF',
    border: '#3B82F6', 
    borderHover: '#3B82F6',
    icon: '❄️'
  },
  undefined: { 
    fill: '#F9FAFB', 
    fillHover: '#F9FAFB',
    border: '#E5E7EB', 
    borderHover: '#E5E7EB',
    icon: '❓'
  }
};

const CONSTANTS = {
  PADDING: 40,
  GAP: 16,
  GROUP_GAP: 16,
  SCALE: 180,
  MIN_WIDTH: 180,
};

const roundToPixel = (value: number): number => Math.round(value * 2) / 2;

export function useGroupedVolumes(shapes: ModelingData['shapes'], selectedVolumes?: Record<number, Temperature>) {
  return useMemo(() => {
    if (!shapes) return [];

    let currentX = 0;
    const volumes: VolumeGroup[] = [];

    shapes.forEach((shape, columnIndex) => {
      // Calculate column dimensions
      const columnWidth = Math.max(shape.inner_dimensions.width * CONSTANTS.SCALE, CONSTANTS.MIN_WIDTH);
      
      // Group parts by merge_group_id
      const groupMap = new Map<number, VolumePart[]>();
      shape.parts.forEach(part => {
        if (!groupMap.has(part.merge_group_id)) {
          groupMap.set(part.merge_group_id, []);
        }
        groupMap.get(part.merge_group_id)!.push(part);
      });

      // Create volume groups
      Array.from(groupMap.entries()).forEach(([groupId, parts]) => {
        // Calculate vertical position with proper gaps
        const yStart = Math.min(...parts.map(p => p.y_start));
        const yEnd = Math.max(...parts.map(p => p.y_start + p.height));
        const height = (yEnd - yStart) * CONSTANTS.SCALE;

        volumes.push({
          groupId,
          columnIndex,
          parts,
          x: roundToPixel(currentX + CONSTANTS.PADDING),
          y: roundToPixel(CONSTANTS.PADDING + yStart * CONSTANTS.SCALE + CONSTANTS.GROUP_GAP),
          width: roundToPixel(columnWidth - CONSTANTS.GAP),
          height: roundToPixel(height - CONSTANTS.GROUP_GAP * 2),
          temperature: selectedVolumes?.[groupId]
        });
      });

      currentX += columnWidth + CONSTANTS.GAP;
    });

    return volumes;
  }, [shapes, selectedVolumes]);
}