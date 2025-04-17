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

interface UseConfigurationsApiReturn {
  getAllConfigurations: () => Promise<Configuration[]>;
  createConfiguration: (data: CreateConfigData) => Promise<string>;
  updateConfiguration: (id: string, data: UpdateConfigData) => Promise<void>;
  deleteConfiguration: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface UpdateConfigData {
  configuration_name: string;
  is_catalog: boolean;
  configuration_description?: string;
}

interface CreateConfigData {
  configuration_name: string;
  is_catalog?: boolean;
  user_id?: string;
  configuration_description?: string;
  configuration_outer_height?: number;
  configuration_outer_width?: number;
  configuration_outer_depth?: number;
  configuration_buy_price?: number;
  configuration_sell_price?: number;
}

export function useConfigurationsApi(): UseConfigurationsApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = ApiController.getInstance();

  const getAllConfigurations = useCallback(async (): Promise<Configuration[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.get<ApiConfiguration[]>('/configurations/');
      if (apiErr) throw new ApiError(apiErr, 0);

      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide');
      }

      // Adapte le mapping selon le type "Configuration" de ton /types
      return data.map(config => ({
        id: config.configuration_id,
        name: config.configuration_name,
        is_catalog: config.is_catalog,
        description: config.configuration_description ?? 'Aucune description',
        created_at: config.created_at,
        dimensions: config.configuration_outer_height !== null && config.configuration_outer_height !== undefined
          ? {
              outer_height: parseFloat(config.configuration_outer_height ?? '0'),
              outer_width: parseFloat(config.configuration_outer_width ?? '0'),
              outer_depth: parseFloat(config.configuration_outer_depth ?? '0'),
            }
          : null,
        user_id: config.user_id,
        buy_price: config.configuration_buy_price !== null && config.configuration_buy_price !== undefined
          ? parseFloat(config.configuration_buy_price)
          : null,
        sell_price: config.configuration_sell_price !== null && config.configuration_sell_price !== undefined
          ? parseFloat(config.configuration_sell_price)
          : null,
        status: config.configuration_outer_height !== null && config.configuration_outer_height !== undefined ? 'complete' : 'draft',
        tags: config.tags || [],
      })) as Configuration[];
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de la récupération des configurations';
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
      const response = await api.post<{ configuration_id: string }>('/configurations/', data);
      if (!response.data?.configuration_id) {
        throw new Error('ID de configuration manquant dans la réponse');
      }
      return response.data.configuration_id;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de la création de la configuration';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConfiguration = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/configurations/${id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de la suppression de la configuration';
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
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de la mise à jour de la configuration';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getAllConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    isLoading,
    error,
  };
}