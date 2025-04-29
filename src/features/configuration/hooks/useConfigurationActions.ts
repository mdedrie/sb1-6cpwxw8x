import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigurationsApi } from '../../../services/api/hooks/useConfigurationsApi';
import type { Step1FormData, Step2FormData } from '../../../types';

type StepName = 'basic' | 'dimensions' | 'columns';

interface UseConfigurationActionsProps {
  configId: string | null;
  setConfigId: (id: string) => void;
  setCurrentStep: (step: StepName) => void;
}

export function useConfigurationActions({
  configId,
  setConfigId,
  setCurrentStep
}: UseConfigurationActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configIdRef = useRef<string | null>(configId);
  const { createConfiguration, updateConfiguration } = useConfigurationsApi();
  const navigate = useNavigate();

  // Sync ref si le prop `configId` change
  useEffect(() => {
    configIdRef.current = configId;
  }, [configId]);

  const handleBasicInfoSubmit = useCallback(
    async (
      step1Data: Step1FormData,
      isExistingConfig: boolean
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const basePayload = {
          configuration_name: step1Data.config_name.trim().toUpperCase(),
          is_catalog: step1Data.is_catalog
        };

        let finalConfigId = configIdRef.current;

        if (isExistingConfig && finalConfigId) {
          await updateConfiguration(finalConfigId, basePayload);
        } else {
          finalConfigId = await createConfiguration(basePayload);
          configIdRef.current = finalConfigId;
          setConfigId(finalConfigId);
          navigate(`/editor/${finalConfigId}`, { replace: true });
        }

        setCurrentStep('dimensions');
        return finalConfigId ?? "";
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
        setError(msg);
        throw msg;
      } finally {
        setLoading(false);
      }
    },
    [setConfigId, setCurrentStep, createConfiguration, updateConfiguration, navigate]
  );

  const handleDimensionsSubmit = useCallback(
    async (
      step1Data: Step1FormData,
      step2Data: Step2FormData
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        if (!step2Data.configuration_description.trim()) {
          throw 'La description est requise';
        }

        const currentId = configIdRef.current;
        if (!currentId) {
          throw "ID de configuration manquant";
        }

        const dimensionsPayload = {
          user_id: "00000000-0000-0000-0000-000000000000",
          configuration_name: step1Data.config_name.trim().toUpperCase(),
          configuration_description: step2Data.configuration_description.trim(),
          configuration_outer_height: step2Data.outer_height,
          configuration_outer_width: step2Data.outer_width,
          configuration_outer_depth: step2Data.outer_depth,
          configuration_buy_price: 0,
          configuration_sell_price: 0,
          is_catalog: step1Data.is_catalog
        };

        await updateConfiguration(currentId, dimensionsPayload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw msg;
      } finally {
        setLoading(false);
      }
    },
    [updateConfiguration]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    setError,
    clearError,
    handleBasicInfoSubmit,
    handleDimensionsSubmit
  };
}