import { useState, useCallback } from 'react';
import type { Configuration } from '../../../types';

interface UseCatalogActionsProps {
  configurations: Configuration[];
  setConfigurations: (configs: Configuration[]) => void;
  onRefresh: () => void;
}

export function useCatalogActions({ configurations, setConfigurations, onRefresh }: UseCatalogActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = useCallback(async (id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`https://icecoreapi-production.up.railway.app/api/configurations/${deleteConfirmation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression (${response.status})`);
      }

      onRefresh();
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting configuration:', err);
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmation, onRefresh]);

  const handleExport = useCallback(async (filteredConfigurations: Configuration[]) => {
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
      throw new Error('Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isDeleting,
    isExporting,
    deleteConfirmation,
    handleDelete,
    confirmDelete,
    handleExport,
    setDeleteConfirmation
  };
}