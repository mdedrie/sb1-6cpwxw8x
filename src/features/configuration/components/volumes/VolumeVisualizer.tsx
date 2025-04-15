import React, { useEffect, useMemo } from 'react';
import type { ModelingData, Temperature } from '../../../../types';
import { VolumeGroup } from './VolumeGroup';
import { useGroupedVolumes, COLORS } from '../../hooks/useGroupedVolumes';
import { Info, MousePointerClick, MousePointerClick as MousePointerClick2 } from 'lucide-react';

interface VolumeVisualizerProps {
  data: ModelingData | null;
  onLoad?: () => void;
  onVolumeSelect: (groupId: number, temperature: Temperature) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const CONSTANTS = {
  PADDING: 40,
  MIN_HEIGHT: 600,
  SHADOW_COLOR: '#00000020',
};

export const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({
  data,
  onLoad,
  onVolumeSelect,
  onDirtyChange,
}) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const groupedVolumes = useGroupedVolumes(data?.shapes || [], data?.selectedVolumes);

  if (!data?.shapes) return null;

  // Calculate SVG dimensions
  const totalWidth = groupedVolumes.reduce((max, group) => 
    Math.max(max, group.x + group.width + CONSTANTS.PADDING), 0);
  
  const totalHeight = Math.max(
    CONSTANTS.MIN_HEIGHT,
    groupedVolumes.reduce((max, group) => 
      Math.max(max, group.y + group.height + CONSTANTS.PADDING), 0)
  );

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="bg-gradient-to-b from-gray-50/50 mx-auto relative mb-4"
      >
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0, 0, 0, 0.1)" />
          </filter>
        </defs>

        {groupedVolumes.map((group) => (
          <VolumeGroup
            key={`${group.columnIndex}-${group.groupId}`}
            groupId={group.groupId}
            parts={group.parts}
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            temperature={group.temperature}
            onVolumeSelect={(groupId, temp) => {
              onVolumeSelect(groupId, temp);
              onDirtyChange?.(true);
            }}
          />
        ))}
      </svg>
      
      <div className="px-4 pb-4">
        <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-start gap-3 mb-3">
            <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Définir les températures</h4>
              <p className="text-xs text-gray-600 mt-1">Utilisez les boutons pour définir la température de chaque groupe</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <p className="text-sm text-gray-700">Volume positif</p>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Température ambiante</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">❄️</span>
                <p className="text-sm text-gray-700">Volume négatif</p>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-1">Température réfrigérée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};