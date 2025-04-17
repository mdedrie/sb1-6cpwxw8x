import { ArrowLeft, Save, Box as Box3d, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
  const { generateVolumes, fetchModelingData, fetchVolumeAnnotations, annotateVolumes, isLoading, error: apiError } = useVolumesApi();

  const loadVolumes = useCallback(async (shouldGenerate = false) => {
    if (!configId) return;

    try {
      setModelingLoaded(false);
      
      if (shouldGenerate) {
        await generateVolumes(configId);
      }

      const [data, annotations] = await Promise.all([
        fetchModelingData(configId),
        fetchVolumeAnnotations(configId)
      ]);
      
      if (mounted.current) {
        // Convert volume annotations to group annotations
        const groupAnnotations: Record<number, Temperature> = {};
        data.shapes.forEach(shape => {
          shape.parts.forEach(part => {
            if (part.volume_id && annotations[part.volume_id]) {
              groupAnnotations[part.merge_group_id] = annotations[part.volume_id];
            }
          });
        });
        
        setSelectedVolumes(groupAnnotations);
        setModelingData({ ...data, selectedVolumes });
        setModelingLoaded(true);
      }
    } catch (err) {
      console.error('Error loading volumes:', err);
      if (err instanceof Error) {
        setSaveError(err.message);
      }
    }
  }, [configId, generateVolumes, fetchModelingData, fetchVolumeAnnotations]);

  useEffect(() => {
    mounted.current = true;
    
    const checkAndLoadVolumes = async () => {
      if (!configId) return;

      try {
        // Check if volumes exist
        const annotations = await fetchVolumeAnnotations(configId);
        const hasVolumes = Object.keys(annotations).length > 0;
        setHasExistingVolumes(hasVolumes);

        if (hasVolumes) {
          await loadVolumes(false);
        } else {
          await loadVolumes(true);
        }
      } catch (err) {
        console.error('Error checking volumes:', err);
        if (err instanceof Error) {
          setSaveError(err.message);
        }
      }
    };

    checkAndLoadVolumes();

    return () => {
      mounted.current = false;
    };
  }, [configId, loadVolumes]);

  useEffect(() => {
    if (modelingData) {
      setModelingData(prev => prev ? { ...prev, selectedVolumes } : null);
    }
  }, [selectedVolumes]);

  const handleVolumeSelect = (groupId: number, value: Temperature) => {
    setSelectedVolumes(prev => {
      // If already selected with same value, remove selection
      if (prev[groupId] === value) {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      }
      // Otherwise update or add new selection
      return { ...prev, [groupId]: value };
    });
  };

  const handleSave = async () => {
    if (!configId || !modelingData) return;

    setSaveError(null);

    const volumeAnnotations: Record<string, Temperature> = {};

    const formatUUID = (id: string): string | null => {
      // Remove any prefix (e.g., "volume-")
      const cleanId = id.replace(/^volume-/, '');
      
      // If already properly formatted with hyphens
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
        return cleanId;
      }
      
      // If it's a continuous string of correct length
      if (/^[0-9a-f]{32}$/i.test(cleanId)) {
        return `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;
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

    if (Object.keys(volumeAnnotations).length === 0) {
      setSaveError('Veuillez sélectionner une température pour au moins un volume');
      return;
    }

    try {
      await annotateVolumes(configId, volumeAnnotations);
      onSave();
    } catch (err) {
      console.error('Error saving volume annotations:', err);
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
                {hasExistingVolumes ? 'Volumes existants' : 'Génération des volumes'}
              </h3>
              <div className="flex items-center gap-4">
                <VolumeLegend className="w-auto" />
                {hasExistingVolumes && (
                  <Button
                    variant="secondary"
                    onClick={() => loadVolumes(true)}
                    disabled={isLoading}
                    className="flex items-center text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Regénérer
                  </Button>
                )}
              </div>
              {isLoading && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Génération des volumes...
                </div>
              )}
            </div>

            {(error || apiError || saveError) ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error || apiError || saveError}</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <div
                  className={`w-full bg-white transition-all duration-300 ${
                    modelingLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}>
                  <VolumeVisualizer 
                    data={modelingData}
                    onVolumeSelect={handleVolumeSelect}
                    onLoad={() => setModelingLoaded(true)}
                  />
                </div>
                {!modelingLoaded && !error && (
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
              disabled={isLoading || isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              onClick={handleSave}
              type="button"
              className="flex items-center"
              disabled={isLoading || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving || isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
        
        <div className="xl:col-span-3 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <VolumeTemperatureTable 
            data={{
              ...modelingData,
              selectedVolumes
            }} 
          />
        </div>
      </div>
    </div>
  );
};