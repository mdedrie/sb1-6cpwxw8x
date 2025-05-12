import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfigurationState } from '../features/configuration/hooks/useConfigurationState';
import { useMetadata } from '../features/configuration/hooks/useMetadata';
import { useEditorApi } from '../services/api/hooks';
import { useWorkflowApi } from '../services/api/hooks';
import { getRefFromId } from '../utils/parameters';
import { BasicAndDimensionsStep } from '../features/configuration/components/BasicAndDimensionsStep';
import { useColumnActions } from '../features/configuration/hooks/useColumnActions';

import {
  ConfigurationHeader,
  ConfigurationContainer,
  ConfigurationSteps,
  ConfigurationError,
  ColumnsStep,
  VolumesStep,
  CornersStep
} from '../features/configuration/components';

import type { Column, Step2bisFormData } from '../types';
import type { ConfigurationStepsResponse } from '../services/api/types';

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
  const [columnData, setColumnData] = useState<Step2bisFormData>({ ...EMPTY_COLUMN });

  const {
    currentStep,
    setCurrentStep,
    step1Data,
    setStep1Data,
    columns,
    setColumns,
    totalPrice,
    handleCreateConfiguration,
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

  const { getColumns, isLoading: isLoadingColumns, error: columnsError, getConfigurationSteps } = useWorkflowApi();
  const [configId, setConfigId] = useState<string | null>(id || null);
  const [existingColumns, setExistingColumns] = useState<Column[]>([]);

  // Mapping entre les noms d'étapes back et front
  const stepBackToFront: Record<string, string> = {
    informations: 'basic',
    colonnes: 'columns',
    volumes: 'volumes',
    coins: 'corners',
    angles_et_te: 'corners',
    resume: 'summary',
    dimensions: 'dimensions',
  };
  // Mapping front -> back pour la comparaison
  const stepFrontToBack: Record<string, string> = {
    basic: 'informations',
    columns: 'colonnes',
    volumes: 'volumes',
    corners: 'angles_et_te',
    summary: 'resume',
    dimensions: 'dimensions',
  };

  // Normalisation pour éviter le undefined sur column_order
  const normalizedExistingColumns = existingColumns.map(col => ({
    ...col,
    column_order: col.column_order ?? 0
  }));

  const { handleSaveColumns } = useColumnActions({
    columns,
    onColumnsChange: setColumns,
    configId,
    metadata,
    existingColumns: normalizedExistingColumns
  });

  useEffect(() => {
    const loadExistingConfiguration = async () => {
      if (!id) {
        setIsInitializing(false);
        return;
      }
      try {
        // Synchronisation de l'étape courante avec l'API
        const stepsData: ConfigurationStepsResponse = await getConfigurationSteps(id);
        const mappedStep = stepBackToFront[stepsData.currentStep] || 'basic';
        setCurrentStep(mappedStep as any);
        // Chargement des données existantes comme avant
        const config = await getConfiguration(id);
        const apiColumns = await getColumns(id);
        setStep1Data({
          config_name: config.name || '',
          is_catalog: config.is_catalog,
          configuration_description: config.description || ''
        });
        if (apiColumns && Array.isArray(apiColumns)) {
          const columnsWithOrder = apiColumns.map((col: any) => ({ ...col, column_order: typeof col.column_order === 'number' ? col.column_order : 1 }));
          setExistingColumns(columnsWithOrder);
          const mappedColumns: Column[] = columnsWithOrder.map((col: any) => ({ id: crypto.randomUUID(), position: col.column_order, thickness: getRefFromId(metadata, 'thicknesses', col.column_thickness_id) || '', inner_height: getRefFromId(metadata, 'inner_heights', col.column_inner_height_id) || '', inner_width: getRefFromId(metadata, 'inner_widths', col.column_inner_width_id) || '', inner_depth: getRefFromId(metadata, 'inner_depths', col.column_inner_depth_id) || '', design: getRefFromId(metadata, 'designs', col.column_design_id) || '', finish: getRefFromId(metadata, 'finishes', col.column_finish_id) || '', door: getRefFromId(metadata, 'doors', col.column_door_type_id) || '', two_way_opening: getRefFromId(metadata, '2ways', col.column_two_way_opening_id) as 'C' | 'G' | 'D', knob_direction: getRefFromId(metadata, 'knobs', col.column_knob_direction_id) as 'C' | 'G' | 'D', foam_type: getRefFromId(metadata, 'foams', col.column_foam_type_id) ?? '', body_count: col.body_count || 1, body_id: col.body_id || null, column_order: col.column_order }));
          setColumns(mappedColumns);
        }
      } catch (err) {
        console.error('Error loading configuration:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadExistingConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getConfiguration, getColumns, getConfigurationSteps, metadata]);

  const handleBasicInfoNext = async () => {
    try {
      const basePayload = {
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        is_catalog: step1Data.is_catalog,
        configuration_description: step1Data.configuration_description || ''
      };
      if (!id) {
        const newConfigId = await createConfiguration(basePayload);
        setConfigId(newConfigId);
        navigate(`/editor/${newConfigId}`);
      } else {
        await updateConfiguration(id, basePayload);
      }
      setCurrentStep('columns');
    } catch {
      // handled by hook
    }
  };

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

  const handleStepNavigation = async (targetStep: string) => {
    if (!id) return;
    try {
      const stepsData = await getConfigurationSteps(id);
      const currentBack = stepsData.currentStep;
      const nextBack = stepsData.nextStep;
      const targetBack = stepFrontToBack[targetStep];
      // Autorisé si on va à l'étape courante ou à la prochaine
      if (targetBack === currentBack || targetBack === nextBack) {
        setCurrentStep(targetStep as any);
        setError(null);
      } else {
        setError("Navigation non autorisée : l'étape demandée n'est pas accessible selon l'état du back-office.");
      }
    } catch (err) {
      setError("Erreur lors de la vérification de l'étape auprès du serveur.");
    }
  };

  const handleContinue = async (current: string, next: string) => {
    if (!id) return;
    setError(null);

    // Nouvelle logique : on passe directement à l'étape suivante après l'enregistrement
    try {
      const stepsData = await getConfigurationSteps(id);
      const nextBack = stepsData.nextStep;
      const nextFront = stepBackToFront[nextBack] || next;
      setCurrentStep(nextFront as any);
      setError(null);
    } catch (err) {
      setError("Erreur lors de la vérification de l'étape auprès du serveur.");
    }
  };

  // Handler générique pour chaque étape
  const handleStepSaveAndContinue = async (step: string, next: string) => {
    if (step === 'basic') {
      await handleBasicInfoNext();
      await handleContinue('basic', 'columns');
    } else if (step === 'columns') {
      await handleSaveColumns();
      await handleContinue('columns', 'volumes');
    } else if (step === 'volumes') {
      // VolumesStep gère déjà l'appel API et appelle onSave après succès
      await handleContinue('volumes', 'corners');
    } else if (step === 'corners') {
      // À compléter selon la logique d'enregistrement des coins/angles
      await handleContinue('corners', 'summary');
    }
  };

  type StepStatus = 'current' | 'complete' | 'upcoming';
  const steps: { name: string; description: string; status: StepStatus }[] = [
    {
      name: 'Informations',
      description: 'Nom, type et description',
      status:
        currentStep === 'basic'
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
            onStepClick={async (index) => {
              const stepNames = ['basic', 'columns', 'volumes', 'corners'] as const;
              const targetStep = stepNames[index];
              await handleStepNavigation(targetStep);
            }}
          />

          {error && (
            <ConfigurationError error={error} onDismiss={() => setError(null)} />
          )}

          {currentStep === 'basic' && (
            <ConfigurationContainer title="Informations">
              <BasicAndDimensionsStep
                step1Data={step1Data}
                onStep1Change={setStep1Data}
                onNext={async () => await handleStepSaveAndContinue('basic', 'columns')}
                loading={loading}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'columns' && (
            <ConfigurationContainer title="Configuration des colonnes" isLast>
              <ColumnsStep
                columns={columns}
                configId={id ?? null}
                onColumnsChange={setColumns}
                columnData={columnData}
                onColumnDataChange={setColumnData}
                metadata={metadata}
                onAddColumn={handleAddColumn}
                onDeleteColumn={handleDeleteColumn}
                onDuplicateColumn={handleDuplicateColumn}
                onBack={() => handleStepNavigation('basic')}
                onSave={async () => await handleStepSaveAndContinue('columns', 'volumes')}
                onContinue={async () => await handleStepSaveAndContinue('columns', 'volumes')}
                loading={loading}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'volumes' && (
            <ConfigurationContainer title="Visualisation des volumes" isLast>
              <VolumesStep
                configId={id ?? null}
                onBack={() => handleStepNavigation('columns')}
                onSave={async () => await handleStepSaveAndContinue('volumes', 'corners')}
                isSaving={loading}
                error={error ?? undefined}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'corners' && (
            <ConfigurationContainer title="Angles et Té" isLast>
              <CornersStep
                configId={id ?? null}
                onBack={() => handleStepNavigation('volumes')}
                onSave={async () => await handleStepSaveAndContinue('corners', 'summary')}
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