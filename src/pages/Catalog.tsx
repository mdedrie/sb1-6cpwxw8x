import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Calendar,
  Box,
  Tag,
  Grid,
  ListIcon,
  Info,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '../components/ui';
import { useConfigurationsApi } from '../services/api/hooks/useConfigurationsApi';
import { FloatingToolbox } from '../features/debug';
import { ApiConsole } from '../features/debug';

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date' },
  { value: 'size', label: 'Dimensions' },
  { value: 'price', label: 'Prix' }
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

export interface Configuration {
  id: string;
  name: string;
  is_catalog: boolean;
  description: string;
  created_at: string;
  dimensions: {
    outer_height: number;
    outer_width: number;
    outer_depth: number;
  } | null;
  user_id: string;
  buy_price: number | null;
  sell_price: number | null;
  status: 'draft' | 'complete';
  tags?: string[];
}

interface DeleteConfirmation {
  id: string;
  name: string;
}

interface DeleteModalProps {
  deleteConfirmation: DeleteConfirmation;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteModal({ deleteConfirmation, isDeleting, onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
        <p className="text-sm text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer la configuration <span className="font-medium">"{deleteConfirmation.name}"</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Annuler la suppression"
            className="focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            aria-label="Confirmer la suppression"
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:outline-none transition-colors duration-200"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function Catalog() {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogOnly, setShowCatalogOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { getAllConfigurations, deleteConfiguration, isLoading, error: apiError } = useConfigurationsApi();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredConfigurations = useMemo(() => {
    return configurations
      .filter(config => {
        const search = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          config.name.toLowerCase().includes(search) ||
          config.description.toLowerCase().includes(search);
        const matchesCatalog = !showCatalogOnly || config.is_catalog;
        const matchesTags =
          selectedTags.length === 0 || selectedTags.every(tag => config.tags?.includes(tag));
        return matchesSearch && matchesCatalog && matchesTags;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'size': {
            if (!a.dimensions || !b.dimensions) return a.dimensions ? -1 : 1;
            const aVolume = a.dimensions.outer_height * a.dimensions.outer_width * a.dimensions.outer_depth;
            const bVolume = b.dimensions.outer_height * b.dimensions.outer_width * b.dimensions.outer_depth;
            return bVolume - aVolume;
          }
          case 'price': {
            if (a.sell_price === null || b.sell_price === null) return a.sell_price ? -1 : 1;
            return b.sell_price - a.sell_price;
          }
          default:
            return 0;
        }
      });
  }, [debouncedSearchTerm, showCatalogOnly, selectedTags, sortBy, configurations]);

  const handleRefresh = useCallback(async () => {
    try {
      const configs = await getAllConfigurations();
      if (Array.isArray(configs)) {
        setConfigurations(configs);
      } else {
        setError('Format de données invalide');
      }
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
      setConfigurations([]);
    }
  }, [getAllConfigurations]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh, refreshKey]);

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return;
    try {
      setIsDeleting(true);
      await deleteConfiguration(deleteConfirmation.id);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  }, [deleteConfirmation, deleteConfiguration]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const data = filteredConfigurations.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        status: config.status,
        is_catalog: config.is_catalog,
        dimensions: config.dimensions,
        created_at: config.created_at,
        sell_price: config.sell_price,
      }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configurations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting configurations:', err);
      setError('Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  }, [filteredConfigurations]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    configurations.forEach(config => {
      config.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [configurations]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setShowCatalogOnly(false);
    setSelectedTags([]);
    setSortBy('date');
  }, []);

  const displayError = error || apiError;
  const isLoadingData = isLoading;

  const renderConfiguration = useCallback((config: Configuration) => {
    return (
      <div
        key={config.id}
        className={`${
          viewMode === 'grid'
            ? 'border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-200'
            : 'border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200'
        } p-6`}
      >
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 flex flex-wrap gap-2 items-center">
              <Box className="h-5 w-5 text-indigo-600" />
              <span className="break-all">{config.name}</span>
              {config.status === 'draft' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Brouillon
                </span>
              )}
              {config.is_catalog && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  Catalogue
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {config.description === 'Aucune description' ? (
                <span className="italic text-gray-400">{config.description}</span>
              ) : (
                config.description
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(config.created_at).toLocaleString()}
              </div>
              {config.dimensions && (
                <div className="flex items-center text-sm text-gray-600 font-medium">
                  <Box className="h-4 w-4 mr-1" />
                  {config.dimensions.outer_height}m x {config.dimensions.outer_width}m x {config.dimensions.outer_depth}m
                </div>
              )}
              {config.sell_price !== null && (
                <div className="flex items-center text-sm font-medium text-indigo-600">
                  {config.sell_price.toLocaleString('fr-FR')} €
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/editor/${config.id}`)}
              aria-label={`Ouvrir la configuration ${config.name}`}
              className="focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Ouvrir
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDeleteRequest(config.id, config.name)}
              aria-label={`Supprimer la configuration ${config.name}`}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }, [viewMode, navigate, handleDeleteRequest]);

  return (
    <div className="p-4">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Configurations</h1>
            <button
              onClick={handleRefresh}
              aria-label="Rafraîchir la liste"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title={`Dernière mise à jour: ${lastRefresh.toLocaleTimeString()}`}
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${isLoadingData ? 'animate-spin text-indigo-600' : 'group-hover:text-gray-600'}`} />
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <p>
              {configurations.length} configuration{configurations.length > 1 ? 's' : ''} 
              {configurations.filter(c => c.status === 'draft').length > 0 && (
                <span className="text-yellow-600">
                  {' '}• {configurations.filter(c => c.status === 'draft').length} brouillon{configurations.filter(c => c.status === 'draft').length > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0 flex items-center gap-4">
          <div className="bg-gray-100 rounded-lg p-1">
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Vue en grille"
                className={`p-2 rounded transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Vue en liste"
                className={`p-2 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ListIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || filteredConfigurations.length === 0}
            aria-label="Exporter les configurations"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {isExporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
            Exporter
          </Button>
          <Button
            onClick={() => navigate('/editor')}
            aria-label="Créer une nouvelle configuration"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle Configuration
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {searchTerm && (
                  <span className="text-xs text-gray-400">
                    {filteredConfigurations.length} résultat{filteredConfigurations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Rechercher une configuration"
                placeholder="Rechercher..."
                className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Trier les configurations"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    Trier par {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <label className="text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showCatalogOnly}
                  onChange={(e) => setShowCatalogOnly(e.target.checked)}
                  aria-label="Afficher uniquement le catalogue"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                />
                Afficher uniquement le catalogue
              </label>
            </div>
            <div className="relative">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTags(prev =>
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      )
                    }
                    aria-label={`Filtrer par le tag ${tag}`}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    {tag}
                    <span className="ml-1 text-xs opacity-60">
                      ({configurations.filter(c => c.tags?.includes(tag)).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : displayError ? (
          <div className="p-8 text-center">
            <div className="text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">{displayError}</p>
              <Button onClick={() => setRefreshKey(k => k + 1)} className="mt-4">
                Réessayer
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 min-h-[600px]">
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-1 gap-2'}`}>
              {filteredConfigurations.map(renderConfiguration)}
            </div>
            {filteredConfigurations.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900">Aucune configuration trouvée</p>
                <p className="mt-1 text-gray-500">
                  Modifiez vos critères de recherche pour voir plus de résultats
                </p>
                <Button variant="secondary" onClick={resetFilters} className="mt-4">
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirmation && (
        <DeleteModal
          deleteConfirmation={deleteConfirmation}
          isDeleting={isDeleting}
          onCancel={() => setDeleteConfirmation(null)}
          onConfirm={confirmDelete}
        />
      )}

      <FloatingToolbox
        context="catalog"
        data={{
          filters: { searchTerm, showCatalogOnly, selectedTags, sortBy, viewMode },
          stats: { totalConfigs: configurations.length, filteredConfigs: filteredConfigurations.length, availableTags: allTags },
          loading,
          error,
          refreshKey,
        }}
        debugTitle="Catalog Debug"
        apiTitle="IceCore API Console"
      />
      <ApiConsole
        title="API Test Console"
        position="bottom-right"
        maxHeight="64"
      />
    </div>
  );
}