import React from 'react';
import { Ruler, AlertCircle } from 'lucide-react';
import type { Column, StepMetadata } from '../../../../types';

interface ColumnPreviewProps {
  columns: Column[];
  metadata: StepMetadata | null;
}

interface Dimensions {
  totalThickness: number;
  minHeight: number;
  maxHeight: number;
  maxWidth: number;
  maxDepth: number;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3 bg-white/50 p-3 rounded-lg">
    <div className="p-2 bg-white rounded-lg shadow-sm">
      {icon}
    </div>
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

export const ColumnPreview: React.FC<ColumnPreviewProps> = ({ columns, metadata }) => {
  const dimensions = React.useMemo((): Dimensions => {
    return columns.reduce((acc, column) => {
      const thicknessOption = metadata?.parameters_by_category?.thicknesses.find(t => t.ref === column.thickness);
      const heightOption = metadata?.parameters_by_category?.inner_heights.find(h => h.ref === column.inner_height);
      const widthOption = metadata?.parameters_by_category?.inner_widths.find(w => w.ref === column.inner_width);
      const depthOption = metadata?.parameters_by_category?.inner_depths.find(d => d.ref === column.inner_depth);
      
      const thickness = thicknessOption?.dim || 0;
      const height = heightOption?.dim || 0;
      const width = widthOption?.dim || 0;
      const depth = depthOption?.dim || 0;
      
      return {
        totalThickness: acc.totalThickness + thickness,
        minHeight: acc.minHeight === 0 ? height : Math.min(acc.minHeight, height),
        maxHeight: Math.max(acc.maxHeight, height),
        maxWidth: Math.max(acc.maxWidth, width),
        maxDepth: Math.max(acc.maxDepth, depth),
      };
    }, { totalThickness: 0, minHeight: 0, maxHeight: 0, maxWidth: 0, maxDepth: 0 });
  }, [columns, metadata]);

  if (!columns.length) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Ruler className="h-4 w-4 text-indigo-600" />}
          label="Épaisseur totale"
          value={`${dimensions.totalThickness} cm`}
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4 text-indigo-600" />}
          label="Hauteur min/max"
          value={`${dimensions.minHeight}/${dimensions.maxHeight} cm`}
        />
        <StatCard
          icon={<Ruler className="h-4 w-4 text-indigo-600" />}
          label="Largeur max"
          value={`${dimensions.maxWidth} cm`}
        />
        <StatCard
          icon={<Ruler className="h-4 w-4 text-indigo-600" />}
          label="Profondeur max"
          value={`${dimensions.maxDepth} cm`}
        />
      </div>
    </div>
  );
};