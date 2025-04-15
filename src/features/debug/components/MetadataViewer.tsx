import React, { useEffect, useState } from 'react';
import { workflowApi } from '../../../services/api';
import { ChevronDown, ChevronRight, AlertCircle, Loader2, X, Database, Filter } from 'lucide-react';

interface MetadataViewerProps {
  position?: 'bottom-right' | 'bottom-left';
  maxHeight?: string;
}

interface ParameterData {
  byCategory: Record<string, any[]>;
  index: Record<string, { ref: string; category: string }>;
  compatibilities: Record<string, Record<string, Record<string, string[]>>>;
}

export function MetadataViewer({ position = 'bottom-right', maxHeight = '96' }: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<ParameterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'byCategory' | 'index'>('byCategory');
  const [searchTerm, setSearchTerm] = useState('');

  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-left': 'left-4',
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [categoryResponse, indexResponse, compatibilitiesResponse] = await Promise.all([
          workflowApi.getMetadata(['parameters_by_category']),
          workflowApi.getMetadata(['parameter_index']),
          workflowApi.getMetadata(['compatibilities_by_parameter'])
        ]);
        
        if (categoryResponse.error) {
          throw new Error(categoryResponse.error);
        }
        
        if (indexResponse.error) {
          throw new Error(indexResponse.error);
        }
        
        if (compatibilitiesResponse.error) {
          throw new Error(compatibilitiesResponse.error);
        }
        
        setMetadata({
          byCategory: categoryResponse.data.parameters_by_category || {},
          index: indexResponse.data.parameter_index || {},
          compatibilities: compatibilitiesResponse.data.compatibilities_by_parameter || {}
        });

      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des métadonnées');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredIndexEntries = metadata?.index ? 
    Object.entries(metadata.index)
      .filter(([id, data]) => {
        const searchLower = searchTerm.toLowerCase();
        return id.toLowerCase().includes(searchLower) || 
               data.ref.toLowerCase().includes(searchLower) ||
               data.category.toLowerCase().includes(searchLower);
      })
      .sort((a, b) => {
        return parseInt(a[0]) - parseInt(b[0]);
      })
    : [];

  return (
    <div className={`fixed bottom-4 ${positionClasses[position]} z-50 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden`}>
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Database className="h-4 w-4 mr-1" />
          <span>Paramètres disponibles</span>
        </button>
        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200">
          <X className="h-4 w-4 hover:text-red-500" />
        </button>
      </div>

      {isOpen && (
        <div className={`p-4 max-h-[500px] overflow-auto`}>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('byCategory')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'byCategory'
                    ? 'bg-white shadow text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Par catégorie
              </button>
              <button
                onClick={() => setActiveTab('index')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'index'
                    ? 'bg-white shadow text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Index
              </button>
            </div>
            {activeTab === 'index' && (
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrer les paramètres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {loading ? ( 
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : !metadata ? (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
              Aucune métadonnée disponible
            </div>
          ) : activeTab === 'byCategory' ? (
            <div className="space-y-4">
              {Object.entries(metadata.byCategory || {}).map(([category, parameters]) => (
                <div key={category} className="border rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="font-medium text-gray-900">{category}</span>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        expandedCategories[category] ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {expandedCategories[category] && (
                    <div className="p-4">
                      <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {Array.isArray(parameters) && parameters.map((param) => (
                              <tr key={param.id} className="hover:bg-gray-50">
                                <td className="px-2 py-1.5 text-xs text-gray-500 font-mono">{param.id}</td>
                                <td className="px-2 py-1.5 text-xs font-medium text-gray-900">{param.ref}</td>
                                <td className="px-2 py-1.5 text-xs text-gray-600 truncate max-w-[300px]">{param.desc || '—'}</td>
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
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredIndexEntries.map(([id, data]) => (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-xs text-gray-500 font-mono">{id}</td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {data.ref}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {data.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}