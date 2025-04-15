import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { Configuration } from '../../../types';

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
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await api.get<any>(`/configurations/${id}`);
      
      if (error) {
        throw new ApiError(error, 0);
      }

      return {
        id: data.configuration_id,
        name: data.configuration_name,
        is_catalog: data.is_catalog,
        description: data.configuration_description || 'Aucune description',
        created_at: data.created_at,
        dimensions: data.configuration_outer_height !== null ? {
          outer_height: parseFloat(data.configuration_outer_height),
          outer_width: parseFloat(data.configuration_outer_width),
          outer_depth: parseFloat(data.configuration_outer_depth),
        } : null,
        user_id: data.user_id,
        buy_price: data.configuration_buy_price !== null ? parseFloat(data.configuration_buy_price) : null,
        sell_price: data.configuration_sell_price !== null ? parseFloat(data.configuration_sell_price) : null,
        status: data.configuration_outer_height !== null ? 'complete' : 'draft'
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
    try {
      setIsLoading(true);
      setError(null);

      const { data: response, error } = await api.post<{ configuration_id: string }>('/configurations/', data);
      
      if (error) {
        throw new ApiError(error, 0);
      }

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
    try {
      setIsLoading(true);
      setError(null);

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
    try {
      setIsLoading(true);
      setError(null);

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