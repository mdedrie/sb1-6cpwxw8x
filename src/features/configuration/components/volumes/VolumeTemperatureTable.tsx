import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ModelingData } from '../../../../types';

interface VolumeTemperatureTableProps {
  data: ModelingData | null;
}

interface GroupVolume {
  groupId: number;
  columnIndex: number;
  volume: number;
  temperature?: 'positive' | 'negative';
}

export const VolumeTemperatureTable: React.FC<VolumeTemperatureTableProps> = ({ data }) => {
  const [showGroups, setShowGroups] = React.useState(false);

  if (!data?.shapes) return null;
  
  // Merge and calculate volumes by group
  const mergedGroups = data.shapes.reduce((acc, shape) => {
    shape.parts.forEach(part => {
      const groupId = part.merge_group_id;
      if (!acc[groupId]) {
        acc[groupId] = {
          groupId,
          volume: 0,
          temperature: data.selectedVolumes?.[groupId],
          columns: new Set<number>()
        };
      }
      acc[groupId].volume += part.volume;
      acc[groupId].columns.add(shape.order);
    });
    return acc;
  }, {} as Record<number, {
    groupId: number;
    volume: number;
    temperature?: 'positive' | 'negative';
    columns: Set<number>;
  }>);

  // Convert to array and sort by group ID
  const groupVolumes = Object.values(mergedGroups).sort((a, b) => a.groupId - b.groupId);

  const totalVolumes = data.shapes.reduce((acc, shape) => {
    const shapeVolumes = shape.parts.reduce((partAcc, part) => {
      const temp = data.selectedVolumes?.[part.merge_group_id];
      if (!temp) return partAcc;
      
      return {
        ...partAcc,
        [temp]: (partAcc[temp] || 0) + part.volume
      };
    }, { positive: 0, negative: 0 });
    
    return {
      positive: acc.positive + shapeVolumes.positive,
      negative: acc.negative + shapeVolumes.negative
    };
  }, { positive: 0, negative: 0 });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Volumes par température</h3>
      
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 rounded-lg border border-emerald-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Volume positif</span>
            <span className="text-lg">🔥</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totalVolumes.positive.toFixed(2)} m³
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Volume négatif</span>
            <span className="text-lg">❄️</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totalVolumes.negative.toFixed(2)} m³
          </p>
        </motion.div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => setShowGroups(!showGroups)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <span className="text-sm font-medium text-gray-700">Volumes par groupe</span>
          {showGroups ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {showGroups && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-2"
          >
            {groupVolumes.map((group) => (
              <div
                key={group.groupId}
                className={`p-3 rounded-lg border ${
                  group.temperature === 'positive'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : group.temperature === 'negative'
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Groupe {group.groupId}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Colonnes : {Array.from(group.columns).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {group.temperature ? (
                        <span className="flex items-center">
                          {group.temperature === 'positive' ? '🔥' : '❄️'}
                          <span className="ml-1">
                            Volume {group.temperature === 'positive' ? 'positif' : 'négatif'}
                          </span>
                        </span>
                      ) : (
                        'Température non définie'
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {group.volume.toFixed(2)} m³
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};