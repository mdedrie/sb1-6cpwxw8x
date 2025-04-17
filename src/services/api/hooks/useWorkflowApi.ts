import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { StepMetadata, Column } from '../../../types';

interface UseWorkflowApiReturn {
  getMetadata: (filters?: string[]) => Promise<StepMetadata>;
  addColumn: (configId: string, columnData: Record<string, any>) => Promise<void>;
  getColumns: (configId: string) => Promise<Column[]>;
  isLoading: boolean;
  error: string | null;
}

export function useWorkflowApi(): UseWorkflowApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = ApiController.getInstance();

  const getMetadata = useCallback(async (filters?: string[]): Promise<StepMetadata> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL('/configuration_workflow/step_metadata', api.baseUrl);
      if (filters?.length) {
        filters.forEach(filter => url.searchParams.append('filters', filter));
      }
      const { data, error } = await api.get<StepMetadata>(url.pathname + url.search);
      if (error) throw new ApiError(error, 0);
      if (!data) throw new Error('Aucune métadonnée reçue');
      return data;
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Erreur lors de la récupération des métadonnées';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [api.baseUrl]);

  // POST utilisé pour add ET update (le backend upserte)
  const addColumn = useCallback(async (configId: string, columnData: Record<string, any>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await api.post(
        `/configuration_workflow/step2bis/add_column/${configId}`,
        columnData
      );
      if (error) throw new ApiError(error, 0);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : "Erreur lors de l'ajout ou modification de la colonne";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getColumns = useCallback(async (configId: string): Promise<Column[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<Column[]>(
        `/configuration_workflow/step2bis/columns/${configId}`
      );
      if (error) throw new ApiError(error, 0);
      return data ?? [];
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Erreur lors de la récupération des colonnes';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getMetadata,
    addColumn,
    getColumns,
    isLoading,
    error,
  };
}