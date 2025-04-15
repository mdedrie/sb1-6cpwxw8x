import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { ModelingData } from '../../../types';

interface UseVolumesApiReturn {
  generateVolumes: (configId: string) => Promise<void>;
  fetchModelingData: (configId: string) => Promise<ModelingData>;
  fetchVolumeAnnotations: (configId: string) => Promise<Record<string, 'positive' | 'negative'>>;
  annotateVolumes: (configId: string, annotations: Record<string, 'positive' | 'negative'>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useVolumesApi(): UseVolumesApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = ApiController.getInstance();

  const generateVolumes = useCallback(async (configId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/configuration_workflow/step3bis/sql_generate_volumes/${configId}`);
      
      // Wait for volumes to be generated
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la génération des volumes';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchModelingData = useCallback(async (configId: string): Promise<ModelingData> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await api.get<any[]>(
        `/configuration_workflow/step7/get_modeling_json/${configId}`
      );

      if (error) {
        throw new ApiError(error, 0);
      }

      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide');
      }

      if (data.length === 0) {
        throw new Error('Aucune donnée de modélisation disponible');
      }

      return {
        shapes: data.map(shape => ({
          ...shape,
          parts: Array.isArray(shape.parts) 
            ? shape.parts.map(part => ({
                ...part,
                volume_id: part.volume_id || `volume-${part.merge_group_id}`
              })) 
            : []
        }))
      };
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la récupération des données';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const annotateVolumes = useCallback(async (configId: string, annotations: Record<string, 'positive' | 'negative'>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Process annotations sequentially to avoid overwhelming the API
      for (const [volumeId, bodyType] of Object.entries(annotations)) {
        if (!volumeId || !bodyType || !['positive', 'negative'].includes(bodyType)) {
          console.warn(`Skipping invalid annotation for volume ${volumeId}`);
          continue;
        }

        const params = new URLSearchParams({ body_type: bodyType });

        await api.put(
          `/configuration_workflow/step4/annotate_volume/${volumeId}?${params.toString()}`
        );

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : err instanceof Error ? err.message : 'Erreur lors de l\'annotation des volumes';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVolumeAnnotations = useCallback(async (configId: string): Promise<Record<string, 'positive' | 'negative'>> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await api.get<any[]>(
        `/configuration_workflow/step4/get_volumes/${configId}`
      );

      if (error) {
        throw new ApiError(error, 0);
      }

      const annotations: Record<string, 'positive' | 'negative'> = {};
      data.forEach(volume => {
        if (volume.volume_id && volume.volume_body_type) {
          annotations[volume.volume_id] = volume.volume_body_type as 'positive' | 'negative';
        }
      });

      return annotations;
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : 'Erreur lors de la récupération des annotations';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateVolumes,
    fetchModelingData,
    fetchVolumeAnnotations,
    annotateVolumes,
    isLoading,
    error
  };
}