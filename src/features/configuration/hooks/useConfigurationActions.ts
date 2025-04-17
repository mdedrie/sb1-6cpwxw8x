import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigurationsApi } from '../../../services/api/hooks/useConfigurationsApi';
import type { Step1FormData, Step2FormData } from '../../../types';

interface UseConfigurationActionsProps {
  configId: string | null;
  setConfigId: (id: string) => void;
  setCurrentStep: (step: 'basic' | 'dimensions' | 'columns') => void;
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

  const handleBasicInfoSubmit = useCallback(async (
    step1Data: Step1FormData,
    isExistingConfig: boolean
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

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
        navigate(`/editor/${finalConfigId}`, { replace: true }); // ← redirection après création
      }

      setCurrentStep('dimensions');
      return finalConfigId!;
    } catch (err) {
      console.error('Erreur lors de la création ou mise à jour de la configuration :', err);
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }, [setConfigId, setCurrentStep, createConfiguration, updateConfiguration, navigate]);

  const handleDimensionsSubmit = useCallback(async (
    step1Data: Step1FormData,
    step2Data: Step2FormData
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!step2Data.configuration_description.trim()) {
        throw new Error('La description est requise');
      }

      const currentId = configIdRef.current;
      if (!currentId) {
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

      await updateConfiguration(currentId, dimensionsPayload);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des dimensions :', err);
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }, [updateConfiguration]);

  return {
    loading,
    error,
    setError,
    handleBasicInfoSubmit,
    handleDimensionsSubmit
  };
}
