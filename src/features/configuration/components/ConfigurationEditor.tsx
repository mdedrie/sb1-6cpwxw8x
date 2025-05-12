import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ConfigurationHeader,
  ConfigurationSteps,
} from '../components';
import { Step1Form } from '../components/steps/BasicInfoStep';
import { DimensionsStep } from '../components/steps/DimensionsStep';
import { Step2bisForm } from '../components/steps/ColumnsStep';
import { VolumesStep } from '../components/steps/VolumesStep';
import { CornersStep } from '../components/steps/CornersStep';
import { useConfigurationsApi, useWorkflowApi } from '../../../services/api/hooks';
import type {
  Step1FormData,
  Step2FormData,
  Step2bisFormData,
  Column,
  StepMetadata,
  StepStatus,
} from '../../../types';

const stepOrder = [
  'basic',
  'dimensions',
  'columns',
  'volumes',
  'corners',
  'summary',
] as const;
type Step = typeof stepOrder[number];

const STEP_LABELS: Record<Step, { name: string; description: string }> = {
  basic:    { name: 'Infos',     description: 'Nom + catalogue' },
  dimensions:{ name: 'Dimensions', description: 'Dimensions' },
  columns:  { name: 'Colonnes',  description: 'Gestion des colonnes' },
  volumes:  { name: 'Volumes',   description: 'Volumes et structure' },
  corners:  { name: 'Coins',     description: 'Coins et angles' },
  summary:  { name: 'Résumé',    description: 'Validation finale' }
};

const getStepStatus = (step: Step, currentStep: Step): StepStatus =>
  step === currentStep
    ? 'current'
    : stepOrder.indexOf(currentStep) > stepOrder.indexOf(step)
    ? 'complete'
    : 'upcoming';

export const ConfigurationEditor: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const [currentStep, setCurrentStep] = useState<Step>('basic');

  const [step1Data, setStep1Data] = useState<Step1FormData>({
    config_name: '',
    is_catalog: false,
  });

  const [dimensionsData, setDimensionsData] = useState<Step2FormData>({
    outer_height: 0,
    outer_width: 0,
    outer_depth: 0,
    configuration_description: '',
  });

  const [columnData, setColumnData] = useState<Step2bisFormData>({
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
    body_count: 0,
  });

  type ExistingColumn = Column & { column_order: number };

  const [columns, setColumns] = useState<Column[]>([]);
  const [existingColumns, setExistingColumns] = useState<ExistingColumn[]>([]);
  const [metadata, setMetadata] = useState<StepMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  const { createConfiguration, updateConfiguration } = useConfigurationsApi();
  const { getColumns } = useWorkflowApi();

  // Config ID sync
  useEffect(() => {
    if (params.id && params.id !== configId) setConfigId(params.id);
  }, [params.id, configId]);

  // Columns load/sync
  useEffect(() => {
    if (!configId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cols = await getColumns(configId);
        if (!cancelled) {
          setColumns(cols);
          setExistingColumns(
            cols.map(col => ({
              ...col,
              column_order: typeof col.column_order !== 'undefined'
                ? col.column_order!
                : typeof col.position !== 'undefined'
                ? col.position!
                : 0,
            }))
          );
        }
      } catch {
        if (!cancelled) setError('Erreur lors du chargement des colonnes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [configId, getColumns]);

  // Step1 submit
  const handleBasicInfoSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        is_catalog: step1Data.is_catalog,
      };
      let newConfigId = configId;
      if (!params.id) {
        newConfigId = await createConfiguration(payload);
        setConfigId(newConfigId);
        navigate(`/editor/${newConfigId}`, { replace: true });
      } else {
        await updateConfiguration(params.id, payload);
      }
      setCurrentStep('dimensions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [params.id, configId, createConfiguration, updateConfiguration, navigate, step1Data]);

  // Columns reload
  const handleColumnsSaveAndRefetch = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    setError(null);
    try {
      const cols = await getColumns(configId);
      setColumns(cols);
      setExistingColumns(
        cols.map(col => ({
          ...col,
          column_order: typeof col.column_order !== 'undefined'
            ? col.column_order
            : typeof col.position !== 'undefined'
            ? col.position
            : 0,
        }))
      );
    } catch {
      setError('Erreur lors du rechargement des colonnes');
    } finally {
      setLoading(false);
    }
  }, [configId, getColumns]);

  const steps = stepOrder.map(step => ({
    name: STEP_LABELS[step].name,
    description: STEP_LABELS[step].description,
    status: getStepStatus(step, currentStep),
  }));

  return (
    <div className="p-4">
      <ConfigurationHeader
        title="Éditeur de configuration"
        subtitle="Créer ou modifier une configuration"
        configId={configId || undefined}
        totalPrice={0}
      />

      <ConfigurationSteps
        steps={steps}
        onStepClick={index => {
          if (steps[index].status === 'current' || steps[index].status === 'complete') {
            setCurrentStep(stepOrder[index]);
          }
        }}
      />

      {error && (
        <div className="text-red-600 bg-red-50 p-2 rounded mb-4">{error}</div>
      )}

      {currentStep === 'basic' && (
        <Step1Form
          data={step1Data}
          onChange={setStep1Data}
          onNext={handleBasicInfoSubmit}
          loading={loading}
          error={error || undefined}
        />
      )}

      {currentStep === 'dimensions' && (
        <DimensionsStep
          data={dimensionsData}
          onChange={setDimensionsData}
          onNext={() => setCurrentStep('columns')}
          onBack={() => setCurrentStep('basic')}
          loading={loading}
          error={error || undefined}
        />
      )}

      {currentStep === 'columns' && (
        <Step2bisForm
          columns={columns}
          existingColumns={existingColumns}
          configId={configId}
          columnData={columnData}
          onColumnDataChange={setColumnData}
          metadata={metadata}
          onColumnsChange={setColumns}
          onAddColumn={() => {}}
          onDeleteColumn={() => {}}
          onDuplicateColumn={() => {}}
          onBack={() => setCurrentStep('dimensions')}
          onSave={handleColumnsSaveAndRefetch}
          onContinue={async () => {
            if (columns.length === 0) {
              setError("Vous devez ajouter au moins une colonne avant de continuer.");
              return;
            }
            await handleColumnsSaveAndRefetch();
            setCurrentStep('volumes');
          }}
          loading={loading}
          error={error || undefined}
        />
      )}

      {currentStep === 'volumes' && (
        <VolumesStep
          configId={configId}
          onBack={() => setCurrentStep('columns')}
          onSave={() => setCurrentStep('corners')}
          isSaving={loading}
          error={error || undefined}
        />
      )}

      {currentStep === 'corners' && (
        <CornersStep
          configId={configId}
          onSave={() => setCurrentStep('summary')}
          onBack={() => setCurrentStep('volumes')}
        />
      )}

      {currentStep === 'summary' && (
        <div className="mt-6">
          <p className="text-gray-600 text-sm">Récapitulatif à venir...</p>
        </div>
      )}
    </div>
  );
};