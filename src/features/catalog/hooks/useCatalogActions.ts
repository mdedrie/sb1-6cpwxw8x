import { useState, useCallback } from 'react';
import type { Configuration } from '../../../types';

interface UseCatalogActionsProps {
  configurations: Configuration[];
  setConfigurations: (configs: Configuration[]) => void;
  onRefresh: () => void;
}

export function useCatalogActions({
  onRefresh,
}: UseCatalogActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `https://icecoreapi-production.up.railway.app/api/configurations/${deleteConfirmation.id}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression (code ${response.status})`);
      }

      onRefresh();
      setDeleteConfirmation(null);
    } catch (error: unknown) {
      console.error('Erreur lors de la suppression :', error);
      throw new Error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmation, onRefresh]);

  const handleExport = useCallback(async (filteredConfigurations: Configuration[]) => {
    let url: string | null = null;

    try {
      setIsExporting(true);
      const exportData = filteredConfigurations.map(({ id, name, description, status, is_catalog, dimensions, created_at, sell_price }) => ({
        id, name, description, status, is_catalog, dimensions, created_at, sell_price
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `configurations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l’export :', error);
      throw new Error('Erreur lors de l’export des configurations');
    } finally {
      if (url) window.URL.revokeObjectURL(url);
      setIsExporting(false);
    }
  }, []);

  return {
    isDeleting,
    isExporting,
    deleteConfirmation,
    handleDelete: handleDeleteRequest,
    confirmDelete,
    handleExport,
    setDeleteConfirmation,
  };
}
