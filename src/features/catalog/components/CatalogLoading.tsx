import { Loader2 } from 'lucide-react';

export const CatalogLoading = () => (
  <div
    className="flex flex-col justify-center items-center py-12 text-center"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" aria-hidden="true" />
    <span className="text-sm text-gray-500">Chargement des configurations…</span>
  </div>
);