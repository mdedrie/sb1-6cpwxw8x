import React from 'react';
import { Grid, ListIcon } from 'lucide-react';
import { CatalogItem } from './CatalogItem';
import type { Configuration } from '../../../types';

interface CatalogGridProps {
  configurations: Configuration[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  configurations,
  viewMode,
  setViewMode,
  onEdit,
  onDelete,
}) => {
  const buttonBaseClass = 'p-2 rounded transition-all duration-200';
  const isGrid = viewMode === 'grid';
  const isList = viewMode === 'list';

  return (
    <div>
      {/* Mode switcher */}
      <div className="flex justify-end mb-4">
        <div className="bg-gray-100 rounded-lg p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Afficher en grille"
              className={`${buttonBaseClass} ${isGrid ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Afficher en liste"
              className={`${buttonBaseClass} ${isList ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Configuration display */}
      <div
        className={`grid ${
          isGrid
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'grid-cols-1 gap-4'
        }`}
      >
        {configurations.map((config) => (
          <CatalogItem
            key={config.id}
            config={config}
            viewMode={viewMode}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
