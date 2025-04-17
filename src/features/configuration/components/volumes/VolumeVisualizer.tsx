import React, { useEffect, useMemo } from 'react';
import type { ModelingData, Temperature } from '../../../../types';
import { VolumeGroup } from './VolumeGroup';
import { useGroupedVolumes } from '../../hooks/useGroupedVolumes';
import { Info } from 'lucide-react';

interface VolumeVisualizerProps {
  data: ModelingData | null;
  selectedVolumes: Record<string | number, Temperature>;
  onVolumeSelect: (mergeGroupId: string | number, temperature: Temperature) => void;
  onLoad?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const CONSTANTS = {
  PADDING: 20, // Réduit pour densité
  MIN_HEIGHT: 440,
};

export const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({
  data,
  selectedVolumes,
  onVolumeSelect,
  onLoad,
  onDirtyChange,
}) => {
  useEffect(() => { onLoad?.(); }, [onLoad]);

  // Le hook est toujours appelé, même si pas de data
  const groupedVolumes = useGroupedVolumes(data?.shapes || [], selectedVolumes);

  // Toujours appelé, même si groupedVolumes est vide
  const [totalWidth, totalHeight] = useMemo(() => {
    let maxW = 0, maxH = CONSTANTS.MIN_HEIGHT;
    for (const g of groupedVolumes) {
      maxW = Math.max(maxW, g.x + g.width + CONSTANTS.PADDING);
      maxH = Math.max(maxH, g.y + g.height + CONSTANTS.PADDING);
    }
    return [maxW, maxH];
  }, [groupedVolumes]);

  const allDefined = useMemo(() =>
    groupedVolumes.length > 0 &&
    groupedVolumes.every(g => selectedVolumes[g.mergeGroupId])
  , [groupedVolumes, selectedVolumes]);

  // ➡️ Le return conditionnel seulement après les hooks
  if (!data?.shapes) return null;

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto pb-4 pt-1">
      {allDefined && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 px-3 py-1 rounded-2xl text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
          ✅ Tous les caissons sont affectés à une température
        </div>
      )}
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="bg-gradient-to-b from-gray-50/70 mx-auto mb-2"
        tabIndex={-1}
        style={{ minWidth: 560, borderRadius: 12, touchAction: 'pan-x' }}
        aria-label="Vue des caissons"
      >
        <defs>
          <filter id="shadow" x="-30%" y="-50%" width="200%" height="170%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,.12)" />
          </filter>
        </defs>
        {groupedVolumes.map((group, idx) => (
          <VolumeGroup
            key={`col-${group.columnIndex}_mgid-${group.mergeGroupId}`}
            mergeGroupId={group.mergeGroupId}
            volumeId={group.volumeId}
            parts={group.parts}
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            temperature={selectedVolumes[group.mergeGroupId]}
            onVolumeSelect={(temp) => {
              onVolumeSelect(group.mergeGroupId, temp);
              onDirtyChange?.(true);
            }}
          />
        ))}
      </svg>
      <div className="px-2">
        <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 max-w-lg mx-auto">
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Définir les températures</h4>
              <p className="text-xs text-gray-600 mt-1">
                Définissez pour chaque caisson (colonne) une température  :
                <br />
                <span className="font-medium text-cyan-700">
                  Un choix par caisson.
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Positif (ambiant)</p>
                  <p className="text-xs text-emerald-600">Température ambiante</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">❄️</span>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Négatif</p>
                  <p className="text-xs text-blue-600">Température réfrigérée</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};