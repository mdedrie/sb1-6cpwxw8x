import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { Configuration } from '../../../types';

interface ApiConfiguration {
  configuration_id: string;
  configuration_name: string;
  is_catalog: boolean;
  configuration_description?: string;
  created_at: string;
  configuration_outer_height?: string | null;
  configuration_outer_width?: string | null;
  configuration_outer_depth?: string | null;
  configuration_buy_price?: string | null;
  configuration_sell_price?: string | null;
  user_id?: string;
  tags?: string[];
}

interface UseEditorApiReturn {
  getConfiguration: (id: string) => Promise<Configuration>;
  createConfiguration: (data: CreateConfigData) => Promise<string>;
  updateConfiguration: (id: string, data: UpdateConfigData) => Promise<void>;
  setDimensions: (id: string, data: DimensionsData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface CreateConfigData {
  configuration_name: string;
  is_catalog: boolean;
}

interface UpdateConfigData {
  configuration_name: string;
  is_catalog: boolean;
  configuration_description?: string;
}

interface DimensionsData {
  configuration_name: string;
  configuration_description: string;
  configuration_outer_height: number;
  configuration_outer_width: number;
  configuration_outer_depth: number;
  configuration_buy_price: number;
  configuration_sell_price: number;
  is_catalog: boolean;
  user_id: string;
}

export function useEditorApi(): UseEditorApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = ApiController.getInstance();

  const getConfiguration = useCallback(async (id: string): Promise<Configuration> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await api.get<ApiConfiguration>(`/configurations/${id}`);
      if (apiError) throw new ApiError(apiError, 0);
      if (!data) throw new Error('La configuration est absente de la réponse');

      const hasDimensions = data.configuration_outer_height !== null && data.configuration_outer_height !== undefined;
      return {
        id: data.configuration_id,
        name: data.configuration_name,
        is_catalog: data.is_catalog,
        description: data.configuration_description || 'Aucune description',
        created_at: data.created_at,
        dimensions: hasDimensions ? {
          outer_height: parseFloat(data.configuration_outer_height ?? '0'),
          outer_width: parseFloat(data.configuration_outer_width ?? '0'),
          outer_depth: parseFloat(data.configuration_outer_depth ?? '0'),
        } : null,
        user_id: data.user_id,
        buy_price: data.configuration_buy_price !== null && data.configuration_buy_price !== undefined
          ? parseFloat(data.configuration_buy_price)
          : null,
        sell_price: data.configuration_sell_price !== null && data.configuration_sell_price !== undefined
          ? parseFloat(data.configuration_sell_price)
          : null,
        status: hasDimensions ? 'complete' : 'draft',
        tags: data.tags || []
      };
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la récupération de la configuration';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConfiguration = useCallback(async (data: CreateConfigData): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: apiError } = await api.post<{ configuration_id: string }>('/configurations/', data);
      if (apiError) throw new ApiError(apiError, 0);

      if (!response?.configuration_id) {
        throw new Error('ID de configuration manquant dans la réponse');
      }
      return response.configuration_id;
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la création de la configuration';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfiguration = useCallback(async (id: string, data: UpdateConfigData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/configurations/${id}`, { ...data, configuration_id: id });
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la mise à jour de la configuration';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDimensions = useCallback(async (id: string, data: DimensionsData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/configurations/${id}`, data);
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la mise à jour des dimensions';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getConfiguration,
    createConfiguration,
    updateConfiguration,
    setDimensions,
    isLoading,
    error
  };
}