import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Temperature } from '../../../../types';
import { COLORS } from '../../hooks/useGroupedVolumes';

interface VolumeGroupProps {
  mergeGroupId: number | string;
  volumeId: string;
  parts: Array<{ volume: number }>;
  x: number;
  y: number;
  width: number;
  height: number;
  temperature?: Temperature;
  onVolumeSelect: (temperature: Temperature, mergeGroupId: number | string) => void;
}

export const VolumeGroup: React.FC<VolumeGroupProps> = ({
  mergeGroupId,
  volumeId,
  parts,
  x,
  y,
  width,
  height,
  temperature,
  onVolumeSelect,
}) => {
  if (mergeGroupId === undefined || mergeGroupId === null) return null;

  const [isHovered, setIsHovered] = useState(false);
  const totalVolume = parts.reduce((sum, p) => sum + p.volume, 0);
  const buttonSize = 26;
  const btnPadX = 8;
  const btnPadY = 6;

  // Palette centralisée
  const t = temperature || 'undefined';
  const theme = COLORS[t];
  const gridColor = '#e0e5ef';
  const topSteelShade = '#e0e7ed';
  const labelBG = theme.fillHover;
  const shadow = isHovered ? "0 4px 16px #86c7f637, 0 1px 6px #949fa855" : "0 1px 3px #b4c4d322";
  const missingTemp = !temperature;

  // LED bouton
  const led = (on: boolean, key: string, color: string, icon: string, cx: number, cy: number) => (
    <g key={key}
      tabIndex={0}
      aria-label={key === 'positive' ? 'Sélectionner température positive (ambiant)' : 'Sélectionner température négative (froid)'}
      role="button"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if ((key === 'positive' && temperature !== 'positive') || (key === 'negative' && temperature !== 'negative')) onVolumeSelect(key as Temperature, mergeGroupId);
        }
      }}
      onClick={e => {
        e.stopPropagation();
        if ((key === 'positive' && temperature !== 'positive') || (key === 'negative' && temperature !== 'negative')) onVolumeSelect(key as Temperature, mergeGroupId);
      }}
      style={{ outline: 'none', cursor: 'pointer' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={buttonSize/2}
        fill={on ? color : "#fff"}
        stroke={on ? color : "#b0bac8"}
        strokeWidth={on ? 2.2 : 1.4}
        filter={on ? `drop-shadow(0 0 6px ${color}55)` : ''}
        style={{ transition: 'all .13s' }}
      />
      <text
        x={cx}
        y={cy+2}
        fontWeight={800}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="1.21em"
        fill={on ? '#fff' : '#94a3b8'}
        pointerEvents="none"
      >
        {icon}
      </text>
    </g>
  );

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 145, damping: 14 }}
      whileHover={{ scale: 1.022, filter: "drop-shadow(0 8px 22px #7fc4f546)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="group"
      aria-label={`Caisson ${mergeGroupId}, ${totalVolume.toFixed(2)} m³`}
    >
      {/* Ombre sous le caisson */}
      <rect x={x+2} y={y+height-7} width={width-4} height={7} rx={2.2} fill="#c3cfda" opacity={0.18} filter="blur(3px)" />
      {/* Caisson principal */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        fill={theme.fill}
        stroke={theme.border}
        strokeWidth={isHovered ? 3 : 2}
        style={{
          filter: shadow,
          strokeDasharray: missingTemp ? '6 4' : undefined,
        }}
      />
      {/* Trame haut */}
      <rect x={x} y={y} width={width} height={22} rx={5} fill={topSteelShade} opacity={0.95} />
      <rect x={x} y={y+height-24} width={width} height={8} fill={gridColor} opacity={0.19} />

      {/* Boutons sélection température */}
      <g style={{ cursor: "pointer" }}>
        {led(temperature==='positive', 'positive', COLORS.positive.border, COLORS.positive.icon, x + btnPadX + buttonSize/2, y + btnPadY + buttonSize/2)}
        {led(temperature==='negative', 'negative', COLORS.negative.border, COLORS.negative.icon, x + width - btnPadX - buttonSize/2, y + btnPadY + buttonSize/2)}
      </g>
      {/* Badge warning si température manquante */}
      {missingTemp && (
        <g>
          <circle cx={x+width-btnPadX-4} cy={y+btnPadY+4} r={9.5} fill="#fee" stroke="#f59e42" strokeWidth={1.2} />
          <text x={x+width-btnPadX-4} y={y+btnPadY+8} fontWeight={900} fontSize="0.95em" fill="#f59e42" textAnchor="middle">!</text>
        </g>
      )}
      {/* Etiquette */}
      <rect x={x+12} y={y+btnPadY+buttonSize+10} width={width-24} height={28} rx={8} fill={labelBG} opacity={0.97} />
      <text x={x+width/2} y={y+btnPadY+buttonSize+28} textAnchor="middle" fontWeight={700} fontSize=".98em" fill="#23293b">Caisson {mergeGroupId}</text>
      {/* Volume */}
      <text x={x+width/2} y={y+height-20} textAnchor="middle" fontSize="1.01em" fill={theme.border} fontWeight={600}>{totalVolume.toFixed(2)} m³</text>
      {/* ID technique */}
      <text x={x+width/2} y={y+height-8} textAnchor="middle" fontSize="0.73em" fill="#64748b" opacity="0.31" pointerEvents="none">{typeof volumeId === 'string' && volumeId.length > 7 ? `id:${volumeId.slice(0, 7)}…` : `id:${volumeId}`}</text>
    </motion.g>
  );
};