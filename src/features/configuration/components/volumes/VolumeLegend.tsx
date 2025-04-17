import React from 'react';

interface VolumeLegendProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const VolumeLegend: React.FC<VolumeLegendProps> = ({
  orientation = 'horizontal',
  className = ''
}) => {
  const items = [
    { icon: '🔥', label: 'Positif', color: '#ECFDF5', border: '#10B981', ring: 'ring-emerald-200' },
    { icon: '❄️', label: 'Négatif', color: '#EFF6FF', border: '#3B82F6', ring: 'ring-blue-200' },
    { icon: '❓', label: 'Non défini', color: '#F9FAFB', border: '#E5E7EB', ring: 'ring-gray-200' }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 select-none ${className}`} role="list" aria-label="Légende des volumes">
      <div className={`flex items-center ${orientation === 'vertical' ? 'flex-col gap-2' : 'gap-3'}`}>
        {items.map(({ icon, label, color, border, ring }) => (
          <div
            key={label}
            role="listitem"
            tabIndex={0}
            aria-label={`Volume ${label}`}
            className={
              `flex items-center gap-2 min-w-[100px] rounded-full
              ${orientation === 'vertical' ? 'w-full' : ''}
              transition-all duration-100`
            }
          >
            <span
              className={`
                flex items-center justify-center w-8 h-8 rounded-full
                border-2 shadow-sm mr-2
                ${ring}
              `}
              style={{ backgroundColor: color, borderColor: border }}
            >
              <span
                className="text-lg"
                style={{ color: border }}
                aria-hidden="true"
              >
                {icon}
              </span>
            </span>
            <span 
              className="text-xs font-medium tracking-tight"
              style={{ color: border }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};