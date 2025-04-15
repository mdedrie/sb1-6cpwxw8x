import React from 'react';
import { Settings, DollarSign } from 'lucide-react';

interface ConfigurationHeaderProps {
  title: string;
  subtitle?: string;
  configId?: string | null;
  totalPrice?: number;
}

export const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = ({
  title,
  subtitle,
  configId,
  totalPrice
}) => {
  const formattedPrice =
    typeof totalPrice === 'number' && totalPrice > 0
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPrice)
      : null;

  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-4">
        <Settings className="h-5 w-5 text-indigo-600" />
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            {title || 'Configuration'}
          </h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
          {configId ? (
            <span className="font-mono">{configId}</span>
          ) : (
            <span className="text-gray-400">En attente de création...</span>
          )}
        </div>

        {formattedPrice && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            {formattedPrice}
          </div>
        )}
      </div>
    </div>
  );
};
