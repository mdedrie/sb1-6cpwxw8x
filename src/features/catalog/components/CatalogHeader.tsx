import React from 'react';
import { Plus, Download, RefreshCw, Info } from 'lucide-react';
import { Button } from '../../../components/ui';

interface CatalogHeaderProps {
  totalCount: number;
  draftCount: number;
  onRefresh: () => void;
  onExport: () => void;
  onNew: () => void;
  loading?: boolean;
  isExporting?: boolean;
  lastRefresh: Date;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  totalCount,
  draftCount,
  onRefresh,
  onExport,
  onNew,
  loading = false,
  isExporting = false,
  lastRefresh
}) => {
  const formattedTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(lastRefresh);

  return (
    <div className="md:flex md:items-center md:justify-between mb-8">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Configurations</h1>
          <button
            onClick={onRefresh}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
            title={`Dernière mise à jour : ${formattedTime}`}
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 ${loading ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Info className="h-4 w-4" aria-hidden />
          <p>
            {totalCount} configuration{totalCount > 1 ? 's' : ''}
            {draftCount > 0 && (
              <span className="text-yellow-600">
                {' '}• {draftCount} brouillon{draftCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex-shrink-0 space-x-4 flex items-center">
        <Button
          variant="secondary"
          onClick={onExport}
          disabled={isExporting || totalCount === 0}
          className="flex items-center"
          aria-label="Exporter les configurations"
        >
          {isExporting ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Download className="h-5 w-5 mr-2" />
          )}
          Exporter
        </Button>

        <Button
          onClick={onNew}
          className="flex items-center"
          aria-label="Créer une nouvelle configuration"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>
    </div>
  );
};
