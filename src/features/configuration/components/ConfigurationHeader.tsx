import React, { useCallback } from 'react';
import { Settings, DollarSign } from 'lucide-react';

interface ConfigurationHeaderProps {
  title: string;
  subtitle?: string;
  configId?: string | null;
  totalPrice?: number;
  className?: string;
}

const truncateId = (id: string | null | undefined, max = 16) => {
  if (!id) return '';
  return id.length > max ? id.substring(0, max - 3) + '...' : id;
};

export const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = ({
  title,
  subtitle,
  configId,
  totalPrice,
  className = '',
}) => {
  const formattedPrice =
    typeof totalPrice === 'number' && totalPrice > 0
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPrice)
      : null;

  return (
    <header
      role="banner"
      tabIndex={0}
      className={`w-full flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 px-2 sm:px-4 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      aria-label="En-tête de la configuration"
      data-testid="configuration-header"
    >
      {/* Bloc titre + sous-titre */}
      <div className="flex items-center min-w-0 flex-1 gap-x-3">
        <Settings className="h-5 w-5 text-indigo-600 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1
            id="configuration-title"
            className="truncate text-base sm:text-lg font-semibold text-gray-900"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Bloc ID + prix */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-50 text-gray-500 max-w-[10rem] overflow-hidden"
          title={configId || ''}
          aria-label={configId ? `Identifiant : ${configId}` : "En attente d'identifiant"}
        >
          {configId ? (
            <span className="truncate">{truncateId(configId)}</span>
          ) : (
            <span className="italic text-gray-400">Non sauvegardée</span>
          )}
        </div>

        {formattedPrice && totalPrice && totalPrice > 0 && (
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
            aria-label={`Prix total : ${formattedPrice}`}
            role="status"
          >
            <DollarSign className="h-4 w-4 mr-1" aria-hidden="true" />
            {formattedPrice}
          </div>
        )}
      </div>
    </header>
  );
};