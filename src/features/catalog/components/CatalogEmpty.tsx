import React from 'react';
import { Search, Button } from '../../../components/ui';

interface CatalogEmptyProps {
  onResetFilters: () => void;
}

export const CatalogEmpty: React.FC<CatalogEmptyProps> = ({ onResetFilters }) => {
  return (
    <div className="text-center py-12">
      <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium text-gray-900">Aucune configuration trouvée</p>
      <p className="mt-1 text-gray-500">Modifiez vos critères de recherche pour voir plus de résultats</p>
      <Button
        variant="secondary"
        onClick={onResetFilters}
        className="mt-4"
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );
};