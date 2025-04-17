import { useMemo } from 'react';
import type { ModelingData, Temperature } from '../../../types';

interface VolumePart {
  index: number;
  height: number;
  volume: number;
  y_start: number;
  merge_group_id: number | string;
  volume_id: string; // référence technique
}

interface VolumeGroup {
  mergeGroupId: number | string;        // Nouvelle clé logique IHM
  volumeId: string;                     // Référence DB/back technique
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

// ---------
// PRINCIPAL : regroupe par merge_group_id (qui est UNIQUE pour l'affichage/gestion IHM)
// Température partagée par merge_group_id !
// selectedVolumes est donc Record<merge_group_id, Temperature>
// ---------
export function useGroupedVolumes(
  shapes: ModelingData['shapes'],
  selectedVolumes?: Record<number | string, Temperature>
) {
  return useMemo(() => {
    if (!shapes) return [];

    let currentX = 0;
    const volumes: VolumeGroup[] = [];

    shapes.forEach((shape, columnIndex) => {
      const columnWidth = Math.max(shape.inner_dimensions.width * CONSTANTS.SCALE, CONSTANTS.MIN_WIDTH);

      // --- Regroupement par merge_group_id ---
      const groupMap = new Map<number | string, { parts: VolumePart[], volumeId: string }>();

      shape.parts.forEach(part => {
        const mgid = part.merge_group_id;
        if (!groupMap.has(mgid)) {
          // On prend le volumeId du premier part du groupe (tous les parts du groupe ont en principe le même volumeId si logique back OK)
          groupMap.set(mgid, { parts: [], volumeId: part.volume_id });
        }
        groupMap.get(mgid)!.parts.push(part);
      });

      // On génère UN groupe par merge_group_id (ET colonne)
      Array.from(groupMap.entries()).forEach(([mergeGroupId, { parts, volumeId }]) => {
        const yStart = Math.min(...parts.map(p => p.y_start));
        const yEnd = Math.max(...parts.map(p => p.y_start + p.height));
        const height = (yEnd - yStart) * CONSTANTS.SCALE;

        volumes.push({
          mergeGroupId,       // Clé ID d'affichage
          volumeId,           // Référence volume technique/back
          columnIndex,        // Pour affichage/ordre
          parts,
          x: roundToPixel(currentX + CONSTANTS.PADDING),
          y: roundToPixel(CONSTANTS.PADDING + yStart * CONSTANTS.SCALE + CONSTANTS.GROUP_GAP),
          width: roundToPixel(columnWidth - CONSTANTS.GAP),
          height: roundToPixel(height - CONSTANTS.GROUP_GAP * 2),
          temperature: selectedVolumes?.[mergeGroupId],
        });
      });

      currentX += columnWidth + CONSTANTS.GAP;
    });

    return volumes;
  }, [shapes, selectedVolumes]);
}