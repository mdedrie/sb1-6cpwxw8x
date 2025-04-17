// src/pages/ConfigurationEditor.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ConfigurationHeader,
  ConfigurationSteps,
} from '../components';
import { Step1Form } from '../components/steps/BasicInfoStep';
import { DimensionsStep } from '../components/steps/DimensionsStep';
import { Step2bisForm  } from '../components/steps/ColumnsStep';
import { VolumesStep } from '../components/steps/VolumesStep';
import { useConfigurationsApi, useEditorApi } from '../../../services/api/hooks';
import type { Step1FormData, Column, StepMetadata } from '../../../types';

// Step type
const stepOrder = ['basic', 'dimensions', 'summary'] as const;
type Step = typeof stepOrder[number];

export const ConfigurationEditor: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [step1Data, setStep1Data] = useState<Step1FormData>({ config_name: '', is_catalog: false });
  const [columns, setColumns] = useState<Column[]>([]);
  const [metadata, setMetadata] = useState<StepMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  const { createConfiguration, updateConfiguration } = useConfigurationsApi();
  const { getConfiguration } = useEditorApi();

  // Initial load from URL param
  useEffect(() => {
    if (params.id && params.id !== configId) {
      setConfigId(params.id);
      // Possibilité de charger la configuration ici avec getConfiguration(params.id)
    }
  }, [params.id, configId]);

  // Handle step change via click
  const handleStepChange = (index: number) => {
    setCurrentStep(stepOrder[index]);
  };

  // Submit Basic Info
  const handleBasicInfoSubmit = useCallback(async (step1: Step1FormData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        configuration_name: step1.config_name.trim().toUpperCase(),
        is_catalog: step1.is_catalog
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
      console.error('Erreur création/mise à jour :', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [params.id, configId, createConfiguration, updateConfiguration, navigate]);

  const steps: { name: string; description: string; status: 'current' | 'complete' | 'upcoming' }[] =
  stepOrder.map((step, i) => ({
    name: ['Infos', 'Colonnes', 'Résumé'][i],
    description: ['Nom + mode catalogue', 'Dimensions & design', 'Validation finale'][i],
    status: step === currentStep ? 'current' : stepOrder.indexOf(currentStep) > i ? 'complete' : 'upcoming'
  }));


  return (
    <div className="p-4">
      <ConfigurationHeader
        title="Éditeur de configuration"
        subtitle="Créer ou modifier une configuration"
        configId={configId}
        totalPrice={0}
      />

      <ConfigurationSteps steps={steps} onStepClick={handleStepChange} />

      {currentStep === 'basic' && (
        <Step1Form
        data={step1Data}
        onChange={setStep1Data}
        onNext={() => handleBasicInfoSubmit(step1Data)}
      />
      )}

      {currentStep === 'dimensions' && (
        <Step2bisForm
          columns={columns}
          metadata={metadata}
          onColumnsChange={setColumns}
          onBack={() => setCurrentStep('basic')}
          onNext={() => setCurrentStep('summary')}
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