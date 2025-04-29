import React from 'react';
import type { Edge, Part } from '../../../../types';

interface NomenclatureTableProps {
  nomenclature: Part[];
  onEdgeHover?: (coords: number[][]) => void;
  onEdgeLeave?: () => void;
}

export const NomenclatureTable: React.FC<NomenclatureTableProps> = ({
  nomenclature,
  onEdgeHover,
  onEdgeLeave
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Colonne</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type Arête</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hauteur/Longueur</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jonction</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {nomenclature.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-gray-400 py-6">
                Aucune arête à afficher
              </td>
            </tr>
          )}
          {nomenclature.map((part, partIndex) => 
            part.edges?.map((edge: Edge, edgeIndex: number) => {
              const dimension = edge.height || edge.length || '-';
              const rowId = `edge-${partIndex}-${edgeIndex}`;
              const uidStr = typeof part.part_uid === 'string'
                ? part.part_uid.slice(0, 6)
                : typeof part.part_uid === 'number'
                ? part.part_uid.toString().slice(0, 6)
                : '-';

              return (
                <tr
                  key={rowId}
                  id={rowId}
                  onMouseEnter={() => onEdgeHover?.(edge.coords)}
                  onMouseLeave={onEdgeLeave}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-3 py-2">{part.column_order}</td>
                  <td className="px-3 py-2">{part.column_type}</td>
                  <td className="px-3 py-2 font-mono">{uidStr}</td>
                  <td className="px-3 py-2">{edge.type}</td>
                  <td className="px-3 py-2">{edge.position || '-'}</td>
                  <td className="px-3 py-2">{dimension}</td>
                  <td className="px-3 py-2">{edge.junctionType || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};