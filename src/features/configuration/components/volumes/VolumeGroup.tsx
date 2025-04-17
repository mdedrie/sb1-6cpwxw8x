import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Temperature } from '../../../../types';
import { COLORS } from '../../hooks/useGroupedVolumes';

interface VolumeGroupProps {
  groupId: number;
  parts: Array<{ volume: number }>;
  x: number;
  y: number;
  width: number;
  height: number;
  temperature?: Temperature;
  onVolumeSelect: (groupId: number, temperature: Temperature) => void;
}

export const VolumeGroup: React.FC<VolumeGroupProps> = ({
  groupId,
  parts,
  x,
  y,
  width,
  height,
  temperature,
  onVolumeSelect
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorSet = COLORS[temperature || 'undefined'];
  const totalVolume = parts.reduce((sum, p) => sum + p.volume, 0);
  const buttonWidth = 40;
  const buttonHeight = 32;

  // Pour accessibilité
  const getAriaLabel = (t: Temperature) =>
    t === 'positive'
      ? `Définir le groupe ${groupId} en volume positif`
      : `Définir le groupe ${groupId} en volume négatif`;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.012 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      aria-label={`Groupe ${groupId}, ${totalVolume.toFixed(2)} m³`}
      role="group"
    >
      {/* Fond du groupe (avec effet survol) */}
      <rect
  x={x}
  y={y}
  width={width}
  height={height}
  rx={4}
  fill={colorSet.fill}
  stroke={colorSet.border}
  strokeWidth={isHovered ? 2.5 : 1.5}
  className="transition-all duration-200"
  style={{
    filter: isHovered ? "drop-shadow(0 2px 8px rgba(16,24,40,0.10))" : undefined
  }}
/>

      {/* Bouton : Volume positif */}
      <g>
        <rect
          x={x + 8}
          y={y + 8}
          width={buttonWidth}
          height={buttonHeight}
          rx={6}
          fill={temperature === 'positive' ? COLORS.positive.fill : '#FFFFFF'}
          stroke={temperature === 'positive' ? COLORS.positive.border : '#E5E7EB'}
          strokeWidth={temperature === 'positive' ? 2 : 1}
          className={`cursor-pointer transition-all duration-200 ${
            temperature === 'positive'
              ? 'shadow-lg ring-2 ring-green-200 hover:ring-green-300'
              : 'hover:bg-gray-50'
          }`}
          aria-label={getAriaLabel('positive')}
          onClick={(e) => {
            e.stopPropagation();
            if (temperature !== 'positive') {
              onVolumeSelect(groupId, 'positive');
            }
          }}
        />
        <title>Température positive</title>
        <text
          x={x + 8 + buttonWidth / 2}
          y={y + 8 + buttonHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-base pointer-events-none"
        >
          🔥
        </text>

        {/* Bouton : négatif */}
        <rect
          x={x + width - buttonWidth - 8}
          y={y + 8}
          width={buttonWidth}
          height={buttonHeight}
          rx={6}
          fill={temperature === 'negative' ? COLORS.negative.fill : '#FFFFFF'}
          stroke={temperature === 'negative' ? COLORS.negative.border : '#E5E7EB'}
          strokeWidth={temperature === 'negative' ? 2 : 1}
          className={`cursor-pointer transition-all duration-200 ${
            temperature === 'negative'
              ? 'shadow-lg ring-2 ring-blue-200 hover:ring-blue-300'
              : 'hover:bg-gray-50'
          }`}
          aria-label={getAriaLabel('negative')}
          onClick={(e) => {
            e.stopPropagation();
            if (temperature !== 'negative') {
              onVolumeSelect(groupId, 'negative');
            }
          }}
        />
        <title>Température négative</title>
        <text
          x={x + width - 8 - buttonWidth / 2}
          y={y + 8 + buttonHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-base pointer-events-none"
        >
          ❄️
        </text>
      </g>

      {/* Label groupe */}
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dy="0.35em"
        className="text-sm fill-gray-700 font-semibold pointer-events-none"
      >
        Groupe {groupId}
      </text>
      {/* Volume affiché */}
      <text
        x={x + width / 2}
        y={y + height - 12}
        textAnchor="middle"
        className="text-xs fill-gray-600 font-medium pointer-events-none"
      >
        {totalVolume.toFixed(2)} m³
      </text>
    </motion.g>
  );
};