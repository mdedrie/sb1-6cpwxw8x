import React from 'react';
import { Loader2 } from 'lucide-react';

export const CatalogLoading: React.FC = () => {
  return (
    <div
      className="flex flex-col justify-center items-center py-12 text-center"
      role="status"
      aria-label="Chargement des configurations en cours"
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
      <span className="text-sm text-gray-500">Chargement des configurations…</span>
    </div>
  );
};
