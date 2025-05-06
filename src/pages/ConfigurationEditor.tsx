import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfigurationState } from '../features/configuration/hooks/useConfigurationState';
import { useMetadata } from '../features/configuration/hooks/useMetadata';
import { useEditorApi } from '../services/api/hooks';
import { useWorkflowApi } from '../services/api/hooks';
import { getRefFromId } from '../utils/parameters';
import { BasicAndDimensionsStep } from '../features/configuration/components/BasicAndDimensionsStep';

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

  const { getColumns, isLoading: isLoadingColumns, error: columnsError } = useWorkflowApi();
  const [configId, setConfigId] = useState<string | null>(id || null);
  const [existingColumns, setExistingColumns] = useState<Column[]>([]);

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
          is_catalog: config.is_catalog,
          configuration_description: config.description || ''
        });
        // Assure column_order
        if (apiColumns && Array.isArray(apiColumns)) { // On garantit column_order: number pour chaque colonne 
          const columnsWithOrder = apiColumns.map((col: any) => ({ ...col, column_order: typeof col.column_order === 'number' ? col.column_order : 1 })); setExistingColumns(columnsWithOrder); 
          const mappedColumns: Column[] = columnsWithOrder.map((col: any) => ({ id: crypto.randomUUID(), position: col.column_order, thickness: getRefFromId(metadata, 'thicknesses', col.column_thickness_id) || '', inner_height: getRefFromId(metadata, 'inner_heights', col.column_inner_height_id) || '', 
          inner_width: getRefFromId(metadata, 'inner_widths', col.column_inner_width_id) || '', inner_depth: getRefFromId(metadata, 'inner_depths', col.column_inner_depth_id) || '', design: getRefFromId(metadata, 'designs', col.column_design_id) || '', finish: getRefFromId(metadata, 'finishes', col.column_finish_id) || '',
           door: getRefFromId(metadata, 'doors', col.column_door_type_id) || '', two_way_opening: getRefFromId(metadata, '2ways', col.column_two_way_opening_id) as 'C' | 'G' | 'D', knob_direction: getRefFromId(metadata, 'knobs', col.column_knob_direction_id) as 'C' | 'G' | 'D', foam_type: getRefFromId(metadata, 'foams', 
           col.column_foam_type_id) ?? '', body_count: col.body_count || 1, body_id: col.body_id || null, column_order: col.column_order // garanti: number 
          })); setColumns(mappedColumns); setCurrentStep('volumes'); }
      } catch (err) {
        console.error('Error loading configuration:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadExistingConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getConfiguration, getColumns, metadata]);

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

  const handleColumnsBack = () => setCurrentStep('basic');
  const handleColumnsSave = () => setCurrentStep('volumes');
  const handleVolumesBack = () => setCurrentStep('columns');
  const handleVolumesSave = () => setCurrentStep('corners');
  const handleCornersBack = () => setCurrentStep('volumes');
  const handleCornersSave = () => navigate('/');

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
            onStepClick={(index) => {
              const stepNames = ['basic', 'columns', 'volumes', 'corners'] as const;
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
            <ConfigurationContainer title="Informations">
              <BasicAndDimensionsStep
                step1Data={step1Data}
                onStep1Change={setStep1Data}
                onNext={handleBasicInfoNext}
                loading={loading}
              />
            </ConfigurationContainer>
          )}

          {currentStep === 'columns' && (
            <ConfigurationContainer title="Configuration des colonnes" isLast>
              <ColumnsStep
                columns={columns}
                configId={id ?? null}
              //  existingColumns={existingColumns}
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