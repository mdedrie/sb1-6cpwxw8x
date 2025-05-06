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
  parts: VolumePart[];
  x: number;
  y: number;
  width: number;
  height: number;
  temperature?: Temperature;
  columns: number[];
}

const CONSTANTS = {
  COLUMN_GAP: 16, // espace entre colonnes
  SCALE: 180,     // facteur d’échelle
  MIN_WIDTH: 170,
};

const roundToPixel = (v: number) => Math.round(v * 2) / 2;

export function useGroupedVolumes(
  shapes: ModelingData['shapes'],
  selectedVolumes?: Record<number | string, Temperature>
): VolumeGroup[] {
  return useMemo(() => {
    if (!Array.isArray(shapes) || shapes.length === 0) return [];

    // 1. Calcule x/width pour chaque colonne
    let currentX = 0;
    const columns = shapes.map((shape, idx) => {
      const width = Math.max(shape.inner_dimensions.width * CONSTANTS.SCALE, CONSTANTS.MIN_WIDTH);
      const x = roundToPixel(currentX);
      currentX += width + CONSTANTS.COLUMN_GAP;
      return { x, width, parts: shape.parts, columnIndex: idx };
    });

    // 2. Regroupe TOUS les parts de tous les colonnes par mergeGroupId
    const groupMap = new Map<number | string, { parts: VolumePart[], columns: number[], volumeId: string }>();
    columns.forEach((col) => {
      col.parts.forEach(part => {
        const mgid = part.merge_group_id;
        if (!groupMap.has(mgid)) {
          groupMap.set(mgid, { parts: [], columns: [], volumeId: part.volume_id });
        }
        groupMap.get(mgid)!.parts.push(part);
        if (!groupMap.get(mgid)!.columns.includes(col.columnIndex)) {
          groupMap.get(mgid)!.columns.push(col.columnIndex);
        }
      });
    });

    // 3. Pour chaque groupe fusionné, calcule ses bounds (x/width/y/height)
    const groups: VolumeGroup[] = [];
    groupMap.forEach(({ parts, columns: cols, volumeId }, mergeGroupId) => {
      const sortedCols = [...cols].sort((a, b) => a - b);
      const firstCol = columns[sortedCols[0]];
      const lastCol = columns[sortedCols[sortedCols.length - 1]];
      const x = firstCol.x;
      const width =
        lastCol.x + lastCol.width - firstCol.x + (sortedCols.length - 1) * 0; // gap déjà inclus dans x
      const yStartArr = parts.map(p => p.y_start);
      const yEndArr = parts.map(p => p.y_start + p.height);
      const minY = yStartArr.length ? Math.min(...yStartArr) : 0;
      const maxY = yEndArr.length ? Math.max(...yEndArr) : 0;
      const y = roundToPixel(minY * CONSTANTS.SCALE);
      const height = roundToPixel((maxY - minY) * CONSTANTS.SCALE);
      groups.push({
        mergeGroupId,
        volumeId,
        parts,
        x,
        y,
        width,
        height,
        columns: sortedCols,
        temperature: selectedVolumes?.[String(mergeGroupId)]
      });
    });

    // Trie par x pour l’affichage
    return groups.sort((a, b) => a.x - b.x);
  }, [shapes, selectedVolumes]);
}

export const COLORS = { positive: { fill: '#ECFDF5', fillHover: '#D1FAE5', border: '#10B981', borderHover: '#059669', icon: '🔥' }, negative: { fill: '#EFF6FF', fillHover: '#DBEAFE', border: '#3B82F6', borderHover: '#2563EB', icon: '❄️' }, undefined: { fill: '#F9FAFB', fillHover: '#E5E7EB', border: '#E5E7EB', borderHover: '#D1D5DB', icon: '❓' } };
