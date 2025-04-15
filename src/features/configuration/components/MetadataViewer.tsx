import { useEffect, useState, useMemo } from 'react';
import { workflowApi } from '../../../services/api';
import { ChevronDown, AlertCircle, Loader2 } from 'lucide-react';

interface Parameter {
  id: number;
  ref: string;
  desc?: string;
}

interface Metadata {
  parameters_by_category: Record<string, Parameter[]>;
}

interface MetadataViewerProps {
  className?: string;
}

export function MetadataViewer({ className = '' }: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await workflowApi.getMetadata(['parameters_by_category']);

        if (error) throw new Error(error);

        setMetadata(data);
      } catch (err) {
        console.error('Erreur lors du chargement des métadonnées :', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const categories = useMemo(() => Object.entries(metadata?.parameters_by_category ?? {}), [metadata]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
        Aucune métadonnée disponible
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-medium text-gray-700">Paramètres disponibles</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {categories.map(([category, parameters]) => (
          <div key={category} className="hover:bg-gray-50 transition-colors duration-200">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              aria-expanded={expandedCategories[category] ?? false}
            >
              <span className="font-medium text-gray-900">{category}</span>
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                  expandedCategories[category] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedCategories[category] && (
              <div className="px-4 pb-3">
                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Ref</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {parameters.map((param) => (
                        <tr key={param.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-gray-500">{param.id}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{param.ref}</td>
                          <td className="px-3 py-2 text-gray-600">{param.desc || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
