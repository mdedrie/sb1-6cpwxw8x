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
    {
      icon: '🔥', label: 'Positif', color: '#ECFDF5', border: '#10B981', ring: 'ring-emerald-200', desc: 'Température positive (ambiant)'
    },
    {
      icon: '❄️', label: 'Négatif', color: '#EFF6FF', border: '#3B82F6', ring: 'ring-blue-200', desc: 'Température négative (froid)'
    },
    {
      icon: '❓', label: 'Non défini', color: '#F9FAFB', border: '#E5E7EB', ring: 'ring-gray-200', desc: 'Température non définie'
    }
  ];

  return (
    <section
      className={`bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 select-none ${className}`}
      aria-label="Légende des volumes"
    >
      <dl className={`flex ${orientation === 'vertical' ? 'flex-col gap-2 items-start' : 'flex-row flex-wrap gap-4 items-center'}`}>  
        {items.map(({ icon, label, color, border, ring, desc }) => (
          <div
            key={label}
            className={`flex items-center gap-2 min-w-[96px] px-1 py-1 rounded-lg transition-all duration-100 focus-within:ring-2 focus-within:ring-indigo-400 ${orientation === 'vertical' ? 'w-full' : ''}`}
            tabIndex={0}
          >
            <dt className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-sm ${ring}`}
                style={{ backgroundColor: color, borderColor: border }}
                aria-hidden="true"
            >
              <span className="text-lg" style={{ color: border }}>{icon}</span>
            </dt>
            <dd className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight" style={{ color: border }}>{label}</span>
              <span className="text-[11px] text-gray-500">{desc}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};