import {
  ArrowLeft, Save, Box as Box3d, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import { VolumeLegend } from '../volumes/VolumeLegend';
import type { ModelingData, Temperature } from '../../../../types';
import { VolumeVisualizer } from '../volumes/VolumeVisualizer';
import { VolumeTemperatureTable } from '../volumes/VolumeTemperatureTable';
import { useVolumesApi } from '../../../../services/api/hooks/useVolumesApi';
import { useState, useEffect, useRef, useCallback } from 'react';

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
  error
}) => {
  const [modelingData, setModelingData] = useState<ModelingData | null>(null);
  const [modelingLoaded, setModelingLoaded] = useState(false);
  const mounted = useRef(true);
  const [selectedVolumes, setSelectedVolumes] = useState<Record<number, Temperature>>({});
  const [hasExistingVolumes, setHasExistingVolumes] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const {
    generateVolumes,
    fetchModelingData,
    fetchVolumeAnnotations,
    annotateVolumes,
    isLoading,
    error: apiError,
  } = useVolumesApi();

    // Charge les volumes ou les génère si besoin
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
          const groupAnnotations: Record<number, Temperature> = {};
          data.shapes.forEach(shape => {
            shape.parts.forEach(part => {
              if (part.volume_id && annotations[part.volume_id]) {
                groupAnnotations[part.merge_group_id] = annotations[part.volume_id];
              }
            });
          });
          setSelectedVolumes(groupAnnotations);
          setModelingData({ ...data, selectedVolumes: groupAnnotations });
          setModelingLoaded(true);
          setHasExistingVolumes(true);
        }
      } catch (err) {
        if (mounted.current) {
          setModelingData(null);
          setHasExistingVolumes(false);
          if (err instanceof Error) setSaveError(err.message);
        }
      } finally {
        setLocalLoading(false);
      }
    }, [configId, generateVolumes, fetchModelingData, fetchVolumeAnnotations]);
  
    // Vérifie la présence de volumes mais ne génère JAMAIS au montage
    useEffect(() => {
      mounted.current = true;
      const checkVolumes = async () => {
        if (!configId) return;
        try {
          const annotations = await fetchVolumeAnnotations(configId);
          const found = Object.keys(annotations).length > 0;
          setHasExistingVolumes(found);
          if (found) {
            await loadVolumes(false);
          } else {
            setModelingData(null);
          }
        } catch (err) {
          setModelingData(null);
          setHasExistingVolumes(false);
          if (err instanceof Error) setSaveError(err.message);
        }
      };
      checkVolumes();
      return () => {
        mounted.current = false;
      };
    }, [configId, loadVolumes, fetchVolumeAnnotations]);

    useEffect(() => {
      setModelingData(prev => prev ? { ...prev, selectedVolumes } : null);
      // eslint-disable-next-line
    }, [selectedVolumes]);

    const handleVolumeSelect = (groupId: number, value: Temperature) => {
      setSelectedVolumes(prev => {
        if (prev[groupId] === value) {
          const { [groupId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [groupId]: value };
      });
    };

      // Validation: tous les groupes visibles doivent avoir une température
  const allGroupsSelected = modelingData?.shapes
  ?.reduce((acc, s) => {
    s.parts.forEach((p) => acc.add(p.merge_group_id));
    return acc;
  }, new Set<number>()) ?? new Set();

const selectedGroupIds = Object.keys(selectedVolumes).map(Number);
const missing = Array.from(allGroupsSelected).filter(id => !selectedGroupIds.includes(id));

const handleSave = async () => {
  if (!configId || !modelingData) return;
  setSaveError(null);

  if (missing.length > 0) {
    setSaveError('Veuillez sélectionner une température pour tous les groupes : ' + missing.join(', '));
    return;
  }

  const volumeAnnotations: Record<string, Temperature> = {};

  const formatUUID = (id: string): string | null => {
    const cleanId = id.replace(/^volume-/, '');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      return cleanId;
    }
    if (/^[0-9a-f]{32}$/i.test(cleanId)) {
      return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20)}`;
    }
    return null;
  };

  modelingData.shapes.forEach(shape => {
    shape.parts.forEach(part => {
      const groupId = part.merge_group_id;
      const temperature = selectedVolumes[groupId];
      if (!part.volume_id || !temperature) return;
      const formattedUuid = formatUUID(part.volume_id);
      if (!formattedUuid) {
        console.warn(`Invalid UUID format: ${part.volume_id}`);
        return;
      }
      volumeAnnotations[formattedUuid] = temperature;
    });
  });

  try {
    await annotateVolumes(configId, volumeAnnotations);
    onSave();
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'enregistrement');
  }
};

return (
  <div>
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
        </div>

        <div className="flex justify-between mt-4">
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex items-center"
            disabled={isLoading || isSaving || localLoading}
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
            {(isSaving || isLoading || localLoading) ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="xl:col-span-3 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
        <VolumeTemperatureTable
      data={modelingData ? { ...modelingData, selectedVolumes } : null}
  />
      </div>
    </div>
  </div>
);
};