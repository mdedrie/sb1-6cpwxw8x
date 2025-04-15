import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Info,
  X,
  DollarSign,
  Box as Box3d,
  Ruler
} from 'lucide-react';

import { Button } from '../../../components/ui';
import {
  ConfigurationHeader,
  ConfigurationSteps,
  Step1Form,
  Step2bisForm,
  ConfigurationSummary
} from '../components';
import type { Step1FormData, Column, StepMetadata } from '../../../types';
import { useConfigurationsApi, useEditorApi } from '../../../services/api/hooks';

type Step = 'basic' | 'dimensions' | 'summary';

export const ConfigurationEditor: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const configIdFromParams = params.id;

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [step1Data, setStep1Data] = useState<Step1FormData>({
    config_name: '',
    is_catalog: false
  });

  const [columns, setColumns] = useState<Column[]>([]);
  const [metadata, setMetadata] = useState<StepMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const { createConfiguration } = useConfigurationsApi();
  const { getConfiguration } = useEditorApi();

  // Chargement initial si ID dans l’URL
  useEffect(() => {
    if (configIdFromParams) {
      setConfigId(configIdFromParams);
      // TODO: appel à getConfiguration(configIdFromParams) si besoin
    }
  }, [configIdFromParams]);

  const handleBasicInfoSubmit = useCallback(
    async (step1Data: Step1FormData, isExistingConfig: boolean) => {
      try {
        setLoading(true);
        setError(null);

        const basePayload = {
          configuration_name: step1Data.config_name.trim().toUpperCase(),
          is_catalog: step1Data.is_catalog
        };

        if (!isExistingConfig) {
          const newConfigId = await createConfiguration(basePayload);
          setConfigId(newConfigId);
        }

        setStep1Data(step1Data);
        setCurrentStep('dimensions');
      } catch (err) {
        console.error('Erreur lors de l’initialisation de la configuration :', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    },
    [createConfiguration]
  );

  const handleStepChange = (index: number) => {
    const steps: Step[] = ['basic', 'dimensions', 'summary'];
    setCurrentStep(steps[index]);
  };

  return (
    <div className="p-4">
      <ConfigurationHeader
        title="Éditeur de configuration"
        subtitle="Créer ou modifier une configuration"
        configId={configId}
        totalPrice={0}
      />

      <ConfigurationSteps
        steps={[
          { name: 'Infos', description: 'Nom + mode catalogue', status: currentStep === 'basic' ? 'current' : 'complete' },
          { name: 'Colonnes', description: 'Dimensions & design', status: currentStep === 'dimensions' ? 'current' : currentStep === 'summary' ? 'complete' : 'upcoming' },
          { name: 'Résumé', description: 'Validation finale', status: currentStep === 'summary' ? 'current' : 'upcoming' }
        ]}
        onStepClick={handleStepChange}
      />

      {currentStep === 'basic' && (
        <Step1Form
          defaultValues={step1Data}
          onSubmit={handleBasicInfoSubmit}
          loading={loading}
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
        <ConfigurationSummary
          configId={configId}
          step1Data={step1Data}
          columns={columns}
          onBack={() => setCurrentStep('dimensions')}
        />
      )}
    </div>
  );
};
