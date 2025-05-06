import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ModelingData, Temperature } from '../../../../types';

interface VolumeTemperatureTableProps {
  data: ModelingData | null;
  selectedVolumes: Record<string | number, Temperature>;
  onVolumeSelect?: (mergeGroupId: string | number, value: Temperature) => void;
}

export const VolumeTemperatureTable: React.FC<VolumeTemperatureTableProps> = ({
  data,
  selectedVolumes,
  onVolumeSelect,
}) => {
  const [showVolumes, setShowVolumes] = useState(false);

  const mergedGroups = useMemo(() => {
    if (!data?.shapes) return {};
    const map: Record<string | number, {
      mergeGroupId: string | number;
      volumeId: string;
      volume: number;
      columns: Set<number>;
    }> = {};
    for (const shape of data.shapes) {
      for (const part of shape.parts) {
        const key = part.merge_group_id;
        if (!map[key]) {
          map[key] = {
            mergeGroupId: key,
            volumeId: part.volume_id,
            volume: 0,
            columns: new Set(),
          };
        }
        map[key].volume += part.volume;
        map[key].columns.add(shape.order);
      }
    }
    return map;
  }, [data?.shapes]);

  const totalVolumes = useMemo(() => (
    Object.values(mergedGroups).reduce(
      (totals, group) => {
        const temp = selectedVolumes[group.mergeGroupId];
        if (temp === 'positive') totals.positive += group.volume;
        else if (temp === 'negative') totals.negative += group.volume;
        return totals;
      },
      { positive: 0, negative: 0 }
    )
  ), [mergedGroups, selectedVolumes]);

  const groupList = useMemo(() =>
    Object.values(mergedGroups)
      .sort((a, b) => {
        const colA = Math.min(...a.columns);
        const colB = Math.min(...b.columns);
        if (colA !== colB) return colA - colB;
        return String(a.mergeGroupId).localeCompare(String(b.mergeGroupId));
      })
  , [mergedGroups]);

  if (!data?.shapes || groupList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center text-gray-400">
        Aucun volume à afficher.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <h3 className="text-base font-semibold text-cyan-900 mb-4">Répartition des volumes</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
          <span className="text-xl">🔥</span>
          <span className="flex-1 text-sm text-emerald-700 font-medium">Positif</span>
          <span className="text-xl font-bold text-emerald-600 tabular-nums" aria-live="polite">
            {totalVolumes.positive.toFixed(2)} <span className="text-base">m³</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
          <span className="text-xl">❄️</span>
          <span className="flex-1 text-sm text-blue-700 font-medium">Négatif</span>
          <span className="text-xl font-bold text-blue-600 tabular-nums" aria-live="polite">
            {totalVolumes.negative.toFixed(2)} <span className="text-base">m³</span>
          </span>
        </div>
      </div>
      <button
        onClick={() => setShowVolumes(v => !v)}
        className="w-full flex items-center justify-between p-2 pl-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus:bg-gray-100 text-sm font-medium text-gray-700 border border-gray-100 mb-1"
        aria-expanded={showVolumes}
        aria-controls="vol-table-details"
      >
        Détail des caissons
        {showVolumes ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {showVolumes && (
          <motion.div
            id="vol-table-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.17 }}
            className="mt-2 space-y-2"
          >
            {groupList.map((group) => {
              const temp = selectedVolumes[group.mergeGroupId];
              return (
                <div
                  key={group.mergeGroupId}
                  className={`transition-all flex flex-col gap-1 p-2.5 rounded-lg border shadow-sm ${
                    temp === 'positive'
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : temp === 'negative'
                      ? 'bg-blue-50/80 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-300`}
                  tabIndex={0}
                  aria-label={`Caisson ${group.mergeGroupId}, ${temp ? `température ${temp}` : 'température non définie'}, ${group.volume.toFixed(2)}m³`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-medium text-gray-700">
                        Caisson <span className="tabular-nums">{group.mergeGroupId}</span>
                      </span>
                      <span className="ml-2 text-xs rounded bg-gray-100 px-1 py-0.5 font-medium text-gray-500">
                        Colonnes : {Array.from(group.columns).sort((a,b)=>a-b).join(', ')}
                      </span>
                    </div>
                    <span className="text-base font-semibold">
                      {group.volume.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {temp ? (
                      <span className={
                        "px-2 py-0.5 rounded-xl text-xs font-bold flex items-center " +
                        (temp === "positive"
                          ? "text-emerald-800 bg-emerald-100/90"
                          : "text-blue-800 bg-blue-100/90")
                      }>
                        {temp === 'positive' ? '🔥 Positif' : '❄️ Négatif'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-xl text-xs font-bold text-orange-800 bg-yellow-50">
                        Température non définie
                      </span>
                    )}
                    {onVolumeSelect && (
                      <>
                        <button
                          type="button"
                          tabIndex={0}
                          className={`px-2 py-0.5 rounded text-xs border transition-all focus-visible:outline focus-visible:ring-2 ${{
                            true: 'bg-emerald-100 border-emerald-400 text-emerald-700',
                            false: 'bg-white border-gray-300 hover:border-emerald-400'
                          }[String(temp === 'positive')]}`}
                          aria-pressed={temp === 'positive'}
                          onClick={() => onVolumeSelect(group.mergeGroupId, 'positive')}
                          aria-label={`Affecter Positif à caisson ${group.mergeGroupId}`}
                        >🔥 Positif</button>
                        <button
                          type="button"
                          tabIndex={0}
                          className={`px-2 py-0.5 rounded text-xs border transition-all focus-visible:outline focus-visible:ring-2 ${{
                            true: 'bg-blue-100 border-blue-400 text-blue-700',
                            false: 'bg-white border-gray-300 hover:border-blue-400'
                          }[String(temp === 'negative')]}`}
                          aria-pressed={temp === 'negative'}
                          onClick={() => onVolumeSelect(group.mergeGroupId, 'negative')}
                          aria-label={`Affecter Négatif à caisson ${group.mergeGroupId}`}
                        >❄️ Négatif</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};