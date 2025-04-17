import { useState, useCallback } from 'react';
import { ApiController, ApiError } from '../ApiController';
import type { ModelingData, Shape } from '../../../types';

type VolumeBodyType = 'positive' | 'negative';

interface VolumeAnnotation {
  volume_id: string;
  volume_body_type: VolumeBodyType;
}

interface UseVolumesApiReturn {
  generateVolumes: (configId: string) => Promise<void>;
  fetchModelingData: (configId: string) => Promise<ModelingData>;
  fetchVolumeAnnotations: (configId: string) => Promise<Record<string, VolumeBodyType>>;
  annotateVolumes: (configId: string, annotations: Record<string, VolumeBodyType>) => Promise<void>;
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
    //  await new Promise(resolve => setTimeout(resolve, 2000));
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

      // Mapping STRICt : on re-crée chaque shape selon l'interface Shape
      return {
        shapes: data.map((shape: any): Shape => ({
          order: shape.order,
          parameters: {
            depth: shape.parameters?.depth,
            width: shape.parameters?.width,
            height: shape.parameters?.height,
          },
          body_count: shape.body_count,
          description: shape.description,
          parts: Array.isArray(shape.parts)
            ? shape.parts.map((part: any) => ({
                index: part.index,
                height: part.height,
                volume: part.volume,
// Si volume_id existe, on le garde, sinon undefined (pas un faux-ID !)
                volume_id: part.volume_id ?? undefined,                
                addleft: part.addleft,
                y_start: part.y_start,
                addright: part.addright,
                can_merge: part.can_merge,
                merge_group_id: part.merge_group_id,
                merge_direction: part.merge_direction,
                merge_group_volume_m3: part.merge_group_volume_m3,
              }))
            : [],
          design_info: shape.design_info,
          inner_dimensions: shape.inner_dimensions
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

  const annotateVolumes = useCallback(
    async (configId: string, annotations: Record<string, VolumeBodyType>) => {
      try {
        setIsLoading(true);
        setError(null);
        for (const [volumeId, bodyType] of Object.entries(annotations)) {
          if (!volumeId || !bodyType || !['positive', 'negative'].includes(bodyType)) {
            console.warn(`Skipping invalid annotation for volume ${volumeId}`);
            continue;
          }
          const params = new URLSearchParams({ body_type: bodyType });
          await api.put(
            `/configuration_workflow/step4/annotate_volume/${volumeId}?${params.toString()}`
          );
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Erreur lors de l\'annotation des volumes';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchVolumeAnnotations = useCallback(async (configId: string): Promise<Record<string, VolumeBodyType>> => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await api.get<VolumeAnnotation[]>(
        `/configuration_workflow/step4/get_volumes/${configId}`
      );
      if (error) {
        throw new ApiError(error, 0);
      }
      if (!Array.isArray(data)) {
        throw new Error('Format de données des annotations invalide');
      }
      const annotations: Record<string, VolumeBodyType> = {};
      data.forEach((volume: VolumeAnnotation) => {
        if (
          volume.volume_id &&
          (volume.volume_body_type === 'positive' || volume.volume_body_type === 'negative')
        ) {
          annotations[volume.volume_id] = volume.volume_body_type;
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