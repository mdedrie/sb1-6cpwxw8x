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

export const ConfigurationEditor: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

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

  const [columns, setColumns] = useState<Column[]>([]);
  const [existingColumns, setExistingColumns] = useState<Column[]>([]);
  const [metadata, setMetadata] = useState<StepMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  const { createConfiguration, updateConfiguration } = useConfigurationsApi();
  const { getColumns } = useWorkflowApi();

  // Initial load from URL param
  useEffect(() => {
    if (params.id && params.id !== configId) {
      setConfigId(params.id);
    }
  }, [params.id, configId]);

  // Always load columns for config (loader colonne persistées)
  useEffect(() => {
    if (!configId) return;
    (async () => {
      try {
        const cols = await getColumns(configId);
        setColumns(cols);
        setExistingColumns(
          cols.map((col) => ({
            ...col,
            column_order:
              (col as any).column_order ?? (col as any).position ?? 0,
          }))
        );
      } catch (e) {
        setError('Erreur lors du chargement des colonnes');
      }
    })();
  }, [configId, getColumns]);

  // Submit Basic Info
  const handleBasicInfoSubmit = useCallback(
    async (step1: Step1FormData) => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          configuration_name: step1.config_name.trim().toUpperCase(),
          is_catalog: step1.is_catalog,
        };

        let newConfigId = configId;

        if (!params.id) {
          newConfigId = await createConfiguration(payload);
          setConfigId(newConfigId);
          navigate(`/editor/${newConfigId}`, { replace: true });
        } else {
          await updateConfiguration(params.id, payload);
        }

        setStep1Data(step1);
        setCurrentStep('dimensions');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    },
    [params.id, configId, createConfiguration, updateConfiguration, navigate]
  );

  // Callback pour recharger la vraie base (colonnes persistées) après save columns
  const handleColumnsSaveAndRefetch = useCallback(async (_?: any) => {
    if (!configId) return;
    const cols = await getColumns(configId);
    setColumns(cols);
    setExistingColumns(
      cols.map((col) => ({
        ...col,
        column_order: (col as any).column_order ?? (col as any).position ?? 0,
      }))
    );
  }, [configId, getColumns]);

  const steps: {
    name: string;
    description: string;
    status: 'current' | 'complete' | 'upcoming';
  }[] = stepOrder.map((step, i) => ({
    name: [
      'Infos',
      'Dimensions',
      'Colonnes',
      'Volumes',
      'Coins',
      'Résumé',
    ][i],
    description: [
      'Nom + catalogue',
      'Dimensions',
      'Gestion des colonnes',
      'Volumes et structure',
      'Coins et angles',
      'Validation finale',
    ][i],
    status:
      step === currentStep
        ? 'current'
        : stepOrder.indexOf(currentStep) > i
        ? 'complete'
        : 'upcoming',
  }));

  return (
    <div className="p-4">
      <ConfigurationHeader
        title="Éditeur de configuration"
        subtitle="Créer ou modifier une configuration"
        configId={configId}
        totalPrice={0}
      />

      <ConfigurationSteps
        steps={steps}
        onStepClick={(index) => setCurrentStep(stepOrder[index])}
      />

      {currentStep === 'basic' && (
        <Step1Form
          data={step1Data}
          onChange={setStep1Data}
          onNext={() => setCurrentStep('dimensions')}
        />
      )}

      {currentStep === 'dimensions' && (
        <DimensionsStep
          data={dimensionsData}
          onChange={setDimensionsData}
          onNext={() => setCurrentStep('columns')}
          onBack={() => setCurrentStep('basic')}
        />
      )}

      {currentStep === 'columns' && (
        <Step2bisForm
          columns={columns}
          existingColumns={existingColumns.map((col) => ({
            ...col,
            column_order:
              (col as any).column_order ?? (col as any).position ?? 0,
          }))}
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
        />
      )}

      {currentStep === 'volumes' && (
        <VolumesStep
          configId={configId}
          onBack={() => setCurrentStep('columns')}
          onSave={() => setCurrentStep('corners')}
          isSaving={loading /* ou autre valeur */}
          error={error ?? undefined} // <-- PATCH qui REND 'undefined' au lieu de 'null'
          // Passe uniquement les props attendus par VolumesStepProps !
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