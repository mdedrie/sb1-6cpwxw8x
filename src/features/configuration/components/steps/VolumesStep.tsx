import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Box as Box3d, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import { VolumeLegend } from '../volumes/VolumeLegend';
import type { ModelingData, Temperature } from '../../../../types';
import { VolumeVisualizer } from '../volumes/VolumeVisualizer';
import { VolumeTemperatureTable } from '../volumes/VolumeTemperatureTable';
import { useVolumesApi } from '../../../../services/api/hooks/useVolumesApi';

interface VolumesStepProps {
  configId: string | null;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
}

export const VolumesStep: React.FC<VolumesStepProps> = ({
  configId,
  onBack,
  onSave,
  isSaving,
  error,
}) => {
  const [modelingData, setModelingData] = useState<ModelingData | null>(null);
  const [modelingLoaded, setModelingLoaded] = useState(false);
  const [selectedVolumes, setSelectedVolumes] = useState<Record<string | number, Temperature>>({});
  const [hasExistingVolumes, setHasExistingVolumes] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const mounted = useRef(true);

  const {
    generateVolumes,
    fetchModelingData,
    fetchVolumeAnnotations,
    annotateVolumes,
    isLoading,
    error: apiError,
  } = useVolumesApi();

  const loadVolumes = useCallback(async (shouldGenerate = false) => {
    if (!configId) return;
    try {
      setLocalLoading(true);
      setModelingLoaded(false);

      if (shouldGenerate) {
        await generateVolumes(configId);
      }
      const [data, annotations] = await Promise.all([
        fetchModelingData(configId),
        fetchVolumeAnnotations(configId),
      ]);
      if (mounted.current && data) {
        const hasShapes = Array.isArray(data.shapes)
          && data.shapes.length > 0
          && data.shapes.some(shape => Array.isArray(shape.parts) && shape.parts.length > 0);
        setHasExistingVolumes(hasShapes);

        const volumeAnnotations: Record<string | number, Temperature> = {};
        data.shapes.forEach(shape => {
          shape.parts.forEach(part => {
            if (
              part.merge_group_id !== undefined &&
              part.volume_id &&
              annotations[part.volume_id]
            ) {
              volumeAnnotations[part.merge_group_id] = annotations[part.volume_id];
            }
          });
        });
        setSelectedVolumes(volumeAnnotations);
        setModelingData(data);
        setModelingLoaded(true);
      }
    } catch (err) {
      if (mounted.current) {
        setModelingData(null);
        setHasExistingVolumes(false);
        setSaveError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLocalLoading(false);
    }
  }, [configId, generateVolumes, fetchModelingData, fetchVolumeAnnotations]);

  useEffect(() => {
    mounted.current = true;
    const checkVolumes = async () => {
      if (!configId) return;
      try {
        setSaveError(null);
        setLocalLoading(true);
        setModelingLoaded(false);

        const data = await fetchModelingData(configId);
        const annotations = await fetchVolumeAnnotations(configId);

        const hasShapes = Array.isArray(data.shapes)
          && data.shapes.length > 0
          && data.shapes.some(shape => Array.isArray(shape.parts) && shape.parts.length > 0);
        setHasExistingVolumes(hasShapes);

        if (hasShapes) {
          const volumeAnnotations: Record<string | number, Temperature> = {};
          data.shapes.forEach(shape => {
            shape.parts.forEach(part => {
              if (
                part.merge_group_id !== undefined &&
                part.volume_id &&
                annotations[part.volume_id]
              ) {
                volumeAnnotations[part.merge_group_id] = annotations[part.volume_id];
              }
            });
          });
          setSelectedVolumes(volumeAnnotations);
          setModelingData(data);
        } else {
          setSelectedVolumes({});
          setModelingData(null);
        }
        setModelingLoaded(true);
      } catch (err) {
        setModelingData(null);
        setHasExistingVolumes(false);
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        setLocalLoading(false);
      }
    };
    checkVolumes();
    return () => {
      mounted.current = false;
    };
  }, [configId, fetchModelingData, fetchVolumeAnnotations]);

  const handleVolumeSelect = (mergeGroupId: string | number, temperature: Temperature) => {
    setSelectedVolumes(prev => {
      if (prev[mergeGroupId] === temperature) {
        const { [mergeGroupId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [mergeGroupId]: temperature };
    });
  };

  const allMergeGroupIds: Array<string | number> = modelingData
    ? Array.from(
        new Set(
          modelingData.shapes.flatMap(shape =>
            shape.parts.map(part => part.merge_group_id)
          )
        )
      )
    : [];

  const missing = allMergeGroupIds.filter(mgid => !selectedVolumes[mgid]);

  const handleSave = async () => {
    if (!configId || !modelingData) return;
    setSaveError(null);

    if (missing.length > 0) {
      setSaveError('Veuillez sélectionner une température pour tous les volumes : ' + missing.join(', '));
      return;
    }

    const mergeGroupToVolumeId: Record<string | number, string> = {};
    modelingData.shapes.forEach(shape => {
      shape.parts.forEach(part => {
        if (part.merge_group_id !== undefined && part.volume_id) {
          if (!(part.merge_group_id in mergeGroupToVolumeId)) {
            mergeGroupToVolumeId[part.merge_group_id] = part.volume_id;
          }
        }
      });
    });

    const volumeAnnotations: Record<string, Temperature> = {};
    Object.entries(selectedVolumes).forEach(([mergeGroupId, temperature]) => {
      const volumeId = mergeGroupToVolumeId[mergeGroupId];
      if (volumeId && temperature) {
        volumeAnnotations[volumeId] = temperature;
      }
    });

    try {
      await annotateVolumes(configId, volumeAnnotations);
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  return (
    <div aria-busy={isSaving || isLoading || localLoading}>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Box3d className="h-4 w-4 text-gray-500 mr-2" />
                {hasExistingVolumes ? 'Volumes existants' : 'Aucun volume généré'}
              </h3>
              <div className="flex items-center gap-4">
                <VolumeLegend className="w-auto" />
                {hasExistingVolumes && (
                  <Button
                    variant="secondary"
                    onClick={() => loadVolumes(true)}
                    disabled={isLoading || localLoading}
                    className="flex items-center text-sm"
                    type="button"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || localLoading ? 'animate-spin' : ''}`} />
                    Regénérer
                  </Button>
                )}
              </div>
              {(isLoading || localLoading) && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Génération des volumes...
                </div>
              )}
            </div>

            {(error || apiError || saveError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error || apiError || saveError}</p>
              </div>
            )}

            {!hasExistingVolumes && !(isLoading || localLoading) ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
                <p className="mb-3 text-gray-700">
                  Aucun volume généré pour cette configuration.
                </p>
                <Button
                  variant="primary"
                  onClick={() => loadVolumes(true)}
                  disabled={isLoading || localLoading}
                  className="flex items-center"
                  type="button"
                >
                  <Box3d className="mr-2 h-4 w-4" />
                  Générer les volumes
                </Button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <div
                  className={`w-full bg-white transition-all duration-300 ${
                    modelingLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <VolumeVisualizer
                    data={modelingData}
                    selectedVolumes={selectedVolumes}
                    onVolumeSelect={handleVolumeSelect}
                    onLoad={() => setModelingLoaded(true)}
                  />
                </div>
                {!modelingLoaded && !error && !saveError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Chargement de la visualisation...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <Button
                variant="secondary"
                onClick={onBack}
                className="flex items-center"
                disabled={isSaving || isLoading || localLoading}
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleSave}
                type="button"
                className="flex items-center"
                disabled={isSaving || isLoading || localLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {(isSaving || isLoading || localLoading)
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <VolumeTemperatureTable
            data={modelingData}
            selectedVolumes={selectedVolumes}
            onVolumeSelect={handleVolumeSelect}
          />
        </div>
      </div>
    </div>
  );
};