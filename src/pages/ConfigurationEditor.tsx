import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfigurationState } from '../features/configuration/hooks/useConfigurationState';
import { useMetadata } from '../features/configuration/hooks/useMetadata';
import { useEditorApi } from '../services/api/hooks';
import { useWorkflowApi } from '../services/api/hooks';
import { getRefFromId } from '../utils/parameters';

import {
  ConfigurationHeader,
  ConfigurationContainer,
  ConfigurationSteps,
  ConfigurationError,
  BasicInfoStep,
  DimensionsStep,
  ColumnsStep,
  VolumesStep,
  CornersStep
} from '../features/configuration/components';

import type { Column, Step1FormData, Step2bisFormData } from '../types';

// ===== Utilitaires d'initialisation =====
const EMPTY_COLUMN: Step2bisFormData = {
  thickness: '',
  inner_height: '',
  inner_width: '',
  inner_depth: '',
  design: '',
  finish: '',
  door: '',
  two_way_opening: 'C',
  knob_direction: 'C',
  foam_type: '',
  body_count: 1
};

export function ConfigurationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // -- State local pour la saisie colonne --
  const [columnData, setColumnData] = useState<Step2bisFormData>({ ...EMPTY_COLUMN });

  // -- Hooks de state/config métier --
  const {
    currentStep,
    setCurrentStep,
    step1Data,
    setStep1Data,
    step2Data,
    setStep2Data,
    columns,
    setColumns,
    totalPrice,
    handleCreateConfiguration,
    handleUpdateDimensions,
    loading: stateLoading,
    error: stateError,
    setError 
  } = useConfigurationState(id);

  const { metadata, loading: metadataLoading, error: metadataError } = useMetadata();

  const [isInitializing, setIsInitializing] = useState(true);

  const { 
    getConfiguration, 
    createConfiguration, 
    updateConfiguration,
    isLoading: isLoadingConfig, 
    error: configError 
  } = useEditorApi();

  const { getColumns, isLoading: isLoadingColumns, error: columnsError } = useWorkflowApi();
  const [configId, setConfigId] = useState<string | null>(id || null);
  const [existingColumns, setExistingColumns] = useState<Column[]>([]);

  // ********** Chargement config existante / initialisation **********
  useEffect(() => {
    const loadExistingConfiguration = async () => {
      if (!id) {
        setIsInitializing(false);
        return;
      }
      try {
        const config = await getConfiguration(id);
        const apiColumns = await getColumns(id);

        setStep1Data({
          config_name: config.name || '',
          is_catalog: config.is_catalog
        });

        // Si nom, on passe direct à dimensions
        if (config.name) setCurrentStep('dimensions');

        setStep2Data({
          outer_height: config.dimensions?.outer_height || 0,
          outer_width: config.dimensions?.outer_width || 0,
          outer_depth: config.dimensions?.outer_depth || 0,
          configuration_description: config.description || ''
        });

        // Colonnes existantes (mapping)
        if (apiColumns && Array.isArray(apiColumns)) {
          setExistingColumns(apiColumns);
          const mappedColumns: Column[] = apiColumns.map((col: any) => ({
            id: crypto.randomUUID(),
            position: col.column_order || 1,
            thickness: getRefFromId(metadata, 'thicknesses', col.column_thickness_id) || '',
            inner_height: getRefFromId(metadata, 'inner_heights', col.column_inner_height_id) || '',
            inner_width: getRefFromId(metadata, 'inner_widths', col.column_inner_width_id) || '',
            inner_depth: getRefFromId(metadata, 'inner_depths', col.column_inner_depth_id) || '',
            design: getRefFromId(metadata, 'designs', col.column_design_id) || '',
            finish: getRefFromId(metadata, 'finishes', col.column_finish_id) || '',
            door: getRefFromId(metadata, 'doors', col.column_door_type_id) || '',
            two_way_opening: getRefFromId(metadata, '2ways', col.column_two_way_opening_id) as 'C' | 'G' | 'D',
            knob_direction: getRefFromId(metadata, 'knobs', col.column_knob_direction_id) as 'C' | 'G' | 'D',
            foam_type: getRefFromId(metadata, 'foams', col.column_foam_type_id) ?? '',
            body_count: col.column_body_count || 1,
            body_id: col.column_body_id || null
          }));
          setColumns(mappedColumns);
          if (mappedColumns.length > 0) setCurrentStep('volumes');
        } else if (config.dimensions) {
          setCurrentStep('columns');
        }
      } catch (err) {
        console.error('Error loading configuration:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadExistingConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getConfiguration, getColumns, metadata]);

  // ========== HANDLERS MULTI-STEP ==========

  // Etape 1 (basique)
  const handleBasicInfoNext = async () => {
    try {
      const basePayload = {
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        is_catalog: step1Data.is_catalog
      };
      if (!id) {
        const newConfigId = await createConfiguration(basePayload);
        setConfigId(newConfigId);
        setCurrentStep('dimensions');
      } else {
        await updateConfiguration(id, basePayload);
        setCurrentStep('dimensions');
      }
    } catch (err) {
      // handled by hook
    }
  };

  // Etape 2 (dimensions)
  const handleDimensionsNext = async () => {
    try {
      const success = await handleUpdateDimensions();
      if (success) setCurrentStep('columns');
    } catch {
      // handled by hook
    }
  };
  const handleDimensionsBack = () => setCurrentStep('basic');

  // Etape 3 (colonnes)
  const handleAddColumn = () => {
    if (!columnData.thickness || !columnData.inner_height || !columnData.design || !columnData.door) return;
    const newColumn: Column = {
      id: crypto.randomUUID(),
      ...columnData,
      position: columns.length + 1
    };
    setColumns([...columns, newColumn]);
    setColumnData({ ...EMPTY_COLUMN });
  };
  
  const handleDeleteColumn = (id: string) => {
    const updatedColumns = columns.filter(col => col.id !== id).map((col, idx) => ({ ...col, position: idx + 1 }));
    setColumns(updatedColumns);
  };

  const handleDuplicateColumn = (columnToDuplicate: Column) => {
    const newColumn: Column = {
      ...columnToDuplicate,
      id: crypto.randomUUID(),
      position: columns.length + 1
    };
    setColumns([...columns, newColumn]);
  };

  const handleColumnsBack = () => setCurrentStep('dimensions');
  const handleColumnsSave = () => setCurrentStep('volumes');

  // Etape 4 (volumes)
  const handleVolumesBack = () => setCurrentStep('columns');
  const handleVolumesSave = () => setCurrentStep('corners');

  // Etape 5 (corners)
  const handleCornersBack = () => setCurrentStep('volumes');
  const handleCornersSave = () => navigate('/');

  // -- Steps affichage --
  type StepStatus = 'current' | 'complete' | 'upcoming';
  const steps: { name: string; description: string; status: StepStatus }[] = [
    {
      name: 'Informations de base',
      description: 'Nom et type de configuration',
      status:
        currentStep === 'basic'
          ? 'current'
          : ['dimensions', 'columns', 'volumes', 'corners'].includes(currentStep)
          ? 'complete'
          : 'upcoming'
    },
    {
      name: 'Dimensions',
      description: 'Dimensions et description',
      status:
        currentStep === 'dimensions'
          ? 'current'
          : ['columns', 'volumes', 'corners'].includes(currentStep)
          ? 'complete'
          : 'upcoming'
    },
    {
      name: 'Colonnes',
      description: 'Configuration des colonnes',
      status:
        currentStep === 'columns'
          ? 'current'
          : ['volumes', 'corners'].includes(currentStep)
          ? 'complete'
          : 'upcoming'
    },
    {
      name: 'Volumes',
      description: 'Visualisation des volumes',
      status:
        currentStep === 'volumes'
          ? 'current'
          : currentStep === 'corners'
          ? 'complete'
          : 'upcoming'
    },
    {
      name: 'Angles et Té',
      description: 'Configuration des angles',
      status: currentStep === 'corners' ? 'current' : 'upcoming'
    }
  ];

  // -- Gestion centralisée des statuts --
  const error = stateError || metadataError || configError || columnsError;
  const loading = stateLoading || metadataLoading || isLoadingConfig || isLoadingColumns;

  return (
<div className="w-full px-0 sm:px-4 lg:px-6">
      {isInitializing && id ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-gray-100 rounded mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <ConfigurationHeader 
              title={id ? 'Modifier la Configuration' : 'Nouvelle Configuration'} 
              subtitle="Configurez votre produit étape par étape" 
              configId={configId ?? undefined}
              totalPrice={totalPrice}
            />
          </div>

          <ConfigurationSteps 
            steps={steps}
            onStepClick={(index) => {
              const stepNames = ['basic', 'dimensions', 'columns', 'volumes'] as const;
              const targetStep = stepNames[index];
              if (steps[index].status === 'complete' || steps[index].status === 'current') {
                setCurrentStep(targetStep);
              }
            }}
          />

          {error && (
            <ConfigurationError error={error} onDismiss={() => setError(null)} />
          )}

          {currentStep === 'basic' && (
            <ConfigurationContainer title="Informations de base">
              <BasicInfoStep
                data={step1Data}
                onChange={setStep1Data}
                onNext={handleBasicInfoNext}
                configId={configId ?? undefined}
                isExistingConfig={Boolean(id)}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'dimensions' && (
            <ConfigurationContainer title="Dimensions et description">
              <DimensionsStep
                data={step2Data}
                onChange={setStep2Data}
                onNext={handleDimensionsNext}
                onBack={handleDimensionsBack}
                loading={loading}
                isExistingConfig={Boolean(id)}
                configId={configId ?? undefined}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'columns' && (
            <ConfigurationContainer title="Configuration des colonnes" isLast>
              <ColumnsStep
                columns={columns}
                configId={id ?? null}
                existingColumns={existingColumns}
                onColumnsChange={setColumns}
                columnData={columnData}
                onColumnDataChange={setColumnData}
                metadata={metadata}
                onAddColumn={handleAddColumn}
                onDeleteColumn={handleDeleteColumn}
                onDuplicateColumn={handleDuplicateColumn}
                onBack={handleColumnsBack}
                onSave={handleColumnsSave}
                loading={loading}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'volumes' && (
            <ConfigurationContainer title="Visualisation des volumes" isLast>
              <VolumesStep
                configId={id ?? null}
                onBack={handleVolumesBack}
                onSave={handleVolumesSave}
                isSaving={loading}
                error={error ?? undefined}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'corners' && (
            <ConfigurationContainer title="Angles et Té" isLast>
              <CornersStep
                configId={id ?? null}
                onBack={handleCornersBack}
                onSave={handleCornersSave}
                isSaving={loading}
                error={error ?? undefined}
              />
            </ConfigurationContainer>
          )}
        </>
      )}
    </div>
  );
}