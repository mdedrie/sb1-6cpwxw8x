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
    { icon: '🔥', label: 'Positif', color: '#ECFDF5', border: '#10B981' },
    { icon: '❄️', label: 'Négatif', color: '#EFF6FF', border: '#3B82F6' },
    { icon: '❓', label: 'Non défini', color: '#F9FAFB', border: '#E5E7EB' }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 ${className}`}>
      <div className={`flex ${orientation === 'vertical' ? 'flex-col space-y-2' : 'space-x-3'}`}>
        {items.map(({ icon, label, color, border }) => (
          <div
            key={label}
            className={`flex items-center ${orientation === 'vertical' ? 'w-full' : 'flex-1'}`}
          >
            <div
              className="flex items-center justify-center p-2 rounded-lg"
              style={{ backgroundColor: color, borderColor: border }}
            >
              <span className="text-lg mr-2">{icon}</span>
              <span className="text-sm font-medium" style={{ color: border }}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};