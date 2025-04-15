import { useState, useCallback, useEffect } from 'react';
import { useConfigurationsApi } from '../../../services/api/hooks/useConfigurationsApi';
import type { Step1FormData, Step2FormData, Column } from '../../../types';

interface UseConfigurationActionsProps {
  configId: string | null;
  setCurrentStep: (step: 'basic' | 'dimensions' | 'columns') => void;
}

export function useConfigurationActions({
  configId,
  setCurrentStep,
}: UseConfigurationActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { createConfiguration, updateConfiguration } = useConfigurationsApi();

  const handleBasicInfoSubmit = useCallback(async (
    step1Data: Step1FormData,
    isExistingConfig: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);

      const basePayload = {
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        is_catalog: step1Data.is_catalog
      };
      
      if (isExistingConfig) {
        await updateConfiguration(configId!, basePayload);
      }

      setCurrentStep('dimensions');
    } catch (err) {
      console.error('Configuration update/init error:', err);
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [configId, setCurrentStep]);

  const handleDimensionsSubmit = useCallback(async (
    step1Data: Step1FormData,
    step2Data: Step2FormData,
    isExistingConfig: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!step2Data.configuration_description.trim()) {
        throw new Error('La description est requise');
      }

      const currentConfigId = isExistingConfig ? configId : configId;
      if (!currentConfigId) {
        throw new Error('ID de configuration manquant');
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
      await updateConfiguration(currentConfigId, dimensionsPayload);
    } catch (err) {
      console.error('Configuration dimensions update error:', err);
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour des dimensions');
    } finally {
      setLoading(false);
    }
  }, [configId, setCurrentStep]);
  
  return {
    loading,
    error,
    isSaving,
    setError,
    handleBasicInfoSubmit,
    handleDimensionsSubmit,
  };
}