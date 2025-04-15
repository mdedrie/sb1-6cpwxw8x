import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { StepMetadata } from '../../../types';

interface UseWorkflowApiReturn {
  getMetadata: (filters?: string[]) => Promise<StepMetadata>;
  addColumn: (configId: string, columnData: any) => Promise<void>;
  updateColumn: (configId: string, columnId: string, columnData: any) => Promise<void>;
  getColumns: (configId: string) => Promise<any[]>;
  isLoading: boolean;
  error: string | null;
}


export function useWorkflowApi(): UseWorkflowApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = ApiController.getInstance();

  const getMetadata = useCallback(async (filters?: string[]): Promise<StepMetadata> => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL('/configuration_workflow/step_metadata', api.baseUrl);
      if (filters?.length) {
        filters.forEach(filter => url.searchParams.append('filters', filter));
      }

      const { data, error } = await api.get<StepMetadata>(url.pathname + url.search);
      
      if (error) {
        throw new ApiError(error, 0);
      }

      return data as StepMetadata;
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la récupération des métadonnées';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addColumn = useCallback(async (configId: string, columnData: any): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await api.post(
        `/configuration_workflow/step2bis/add_column/${configId}`,
        columnData
      );

      if (error) {
        throw new ApiError(error, 0);
      }
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de l\'ajout de la colonne';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getColumns = useCallback(async (configId: string): Promise<any[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await api.get<any[]>(
        `/configuration_workflow/step2bis/columns/${configId}`
      );

      if (error) {
        throw new ApiError(error, 0);
      }

      return data || [];
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

  const updateColumn = useCallback(async (configId: string, columnId: string | number, columnData: any): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
  
      const { error } = await api.put(
        `/configuration_workflow/step2bis/update_column/${configId}/${columnId}`,
        columnData
      );
  
      if (error) {
        throw new ApiError(error, 0);
      }
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Erreur lors de la mise à jour de la colonne';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  

  return {
    getMetadata,
    addColumn,
    updateColumn,
    getColumns,
    isLoading,
    error
  };
}