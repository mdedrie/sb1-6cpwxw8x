import { useMemo } from 'react';
import type { ModelingData, Temperature } from '../../../types';

interface VolumePart {
  index: number;
  height: number;
  volume: number;
  y_start: number;
  merge_group_id: number | string;
  volume_id: string;
}

interface VolumeGroup {
  mergeGroupId: number | string;
  volumeId: string;
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
    fill: '#ECFDF5', fillHover: '#ECFDF5',
    border: '#10B981', borderHover: '#10B981',
    icon: '🔥'
  },
  negative: {
    fill: '#EFF6FF', fillHover: '#EFF6FF',
    border: '#3B82F6', borderHover: '#3B82F6',
    icon: '❄️'
  },
  undefined: {
    fill: '#F9FAFB', fillHover: '#F9FAFB',
    border: '#E5E7EB', borderHover: '#E5E7EB',
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

export function useGroupedVolumes(
  shapes: ModelingData['shapes'],
  selectedVolumes?: Record<number | string, Temperature>
): VolumeGroup[] {
  return useMemo(() => {
    if (!Array.isArray(shapes) || shapes.length === 0) return [];

    let currentX = 0;
    const volumes: VolumeGroup[] = [];

    shapes.forEach((shape, columnIndex) => {
      const columnWidth = Math.max(shape.inner_dimensions.width * CONSTANTS.SCALE, CONSTANTS.MIN_WIDTH);

      // --- Regroupement par merge_group_id ---
      const groupMap = new Map<number | string, { parts: VolumePart[], volumeId: string }>();

      shape.parts.forEach(part => {
        const mgid = part.merge_group_id;
        if (!groupMap.has(mgid)) {
          groupMap.set(mgid, { parts: [], volumeId: part.volume_id });
        }
        groupMap.get(mgid)!.parts.push(part);
      });

      Array.from(groupMap.entries()).forEach(([mergeGroupId, { parts, volumeId }]) => {
        // Manage empty case : fallback to 0
        const yStartArr = parts.map(p => p.y_start);
        const yEndArr = parts.map(p => p.y_start + p.height);
        const yStart = yStartArr.length ? Math.min(...yStartArr) : 0;
        const yEnd = yEndArr.length ? Math.max(...yEndArr) : 0;
        const height = Math.abs(yEnd - yStart) * CONSTANTS.SCALE;

        volumes.push({
          mergeGroupId,
          volumeId,
          columnIndex,
          parts,
          x: roundToPixel(currentX + CONSTANTS.PADDING),
          y: roundToPixel(CONSTANTS.PADDING + yStart * CONSTANTS.SCALE + CONSTANTS.GROUP_GAP),
          width: roundToPixel(columnWidth - CONSTANTS.GAP),
          height: roundToPixel(Math.max(0, height - CONSTANTS.GROUP_GAP * 2)),
          temperature: selectedVolumes?.[String(mergeGroupId)],
        });
      });

      currentX += columnWidth + CONSTANTS.GAP;
    });

    return volumes;
  }, [shapes, selectedVolumes]);
}