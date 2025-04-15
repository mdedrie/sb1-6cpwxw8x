import React from 'react';
import { Box, Calendar, ArrowUpRight } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Configuration } from '../../../types';

interface CatalogItemProps {
  config: Configuration;
  viewMode: 'grid' | 'list';
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const CatalogItem: React.FC<CatalogItemProps> = ({
  config,
  viewMode,
  onEdit,
  onDelete,
}) => {
  const {
    id,
    name,
    description,
    status,
    is_catalog,
    created_at,
    dimensions,
    sell_price,
  } = config;

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(created_at));

  const safeId = id ?? '';
  const safeName = name ?? 'Nom inconnu';

  return (
    <div
      className={`p-6 transition-all duration-200 ${
        viewMode === 'grid'
          ? 'border border-gray-200 rounded-lg shadow-sm hover:shadow-md'
          : 'border-b border-gray-100 last:border-b-0 hover:bg-gray-50'
      }`}
    >
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-lg font-medium text-gray-900 flex items-center flex-wrap gap-2">
            <Box className="h-5 w-5 text-indigo-600" />
            <span className="break-all">{safeName}</span>

            {status === 'draft' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                Brouillon
              </span>
            )}
            {is_catalog && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Catalogue
              </span>
            )}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {description === 'Aucune description' ? (
              <span className="italic text-gray-400">{description}</span>
            ) : (
              description
            )}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              {formattedDate}
            </div>

            {dimensions && (
              <div className="flex items-center text-sm text-gray-600 font-medium">
                <Box className="h-4 w-4 mr-1 flex-shrink-0" />
                {dimensions.outer_height}m × {dimensions.outer_width}m × {dimensions.outer_depth}m
              </div>
            )}

            {sell_price !== null && (
              <div className="flex items-center text-sm font-medium text-indigo-600">
                {sell_price.toLocaleString('fr-FR')} €
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => onEdit(safeId)}
            className="flex items-center whitespace-nowrap"
            aria-label={`Ouvrir la configuration ${safeName}`}
            disabled={!id}
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Ouvrir
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDelete(safeId, safeName)}
            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label={`Supprimer la configuration ${safeName}`}
            disabled={!id || !name}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};
