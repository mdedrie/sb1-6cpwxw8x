import { useState, useCallback } from 'react';
import { useEditorApi } from '../../../services/api/hooks/useEditorApi';
import type { Step1FormData, Step2FormData, Column } from '../../../types';

type Step = 'basic' | 'dimensions' | 'columns' | 'volumes' | 'corners';

export function useConfigurationState(configId?: string) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [step1Data, setStep1Data] = useState<Step1FormData>({
    config_name: '',
    is_catalog: false,
  });
  const [step2Data, setStep2Data] = useState<Step2FormData>({
    outer_height: 0,
    outer_width: 0,
    outer_depth: 0,
    configuration_description: '',
  });
  const [columns, setColumns] = useState<Column[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createConfiguration, updateConfiguration, setDimensions } = useEditorApi();

  const validateStep1 = useCallback((): string | null => {
    const name = step1Data.config_name.trim();
    if (!name) return 'Le nom de la configuration est requis';
    if (name.length < 3) return 'Le nom doit contenir au moins 3 caractères';
    if (name.length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
    return null;
  }, [step1Data]);

  const validateStep2 = useCallback((): string | null => {
    if (!step2Data.configuration_description.trim()) {
      return 'La description est requise';
    }
    return null;
  }, [step2Data]);

  const handleCreateConfiguration = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      if (configId) {
        // Mise à jour existante
        await updateConfiguration(configId, {
          configuration_name: step1Data.config_name.trim().toUpperCase(),
          is_catalog: step1Data.is_catalog
        });
        setCurrentStep('dimensions');
        return configId;
      }
      // Création
      const errorStep1 = validateStep1();
      if (errorStep1) {
        setError(errorStep1);
        return null;
      }
      const newConfigId = await createConfiguration({
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        is_catalog: step1Data.is_catalog
      });
      setCurrentStep('dimensions');
      return newConfigId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return null;
    } finally {
      setLoading(false);
    }
  }, [step1Data, configId, createConfiguration, updateConfiguration, validateStep1]);

  const handleUpdateDimensions = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!configId) {
        setError('ID de configuration manquant');
        return false;
      }
      const errorStep2 = validateStep2();
      if (errorStep2) {
        setError(errorStep2);
        return false;
      }
      await setDimensions(configId, {
        configuration_name: step1Data.config_name.trim().toUpperCase(),
        configuration_description: step2Data.configuration_description.trim(),
        configuration_outer_height: step2Data.outer_height,
        configuration_outer_width: step2Data.outer_width,
        configuration_outer_depth: step2Data.outer_depth,
        configuration_buy_price: 0,
        configuration_sell_price: 0,
        is_catalog: step1Data.is_catalog,
        user_id: "00000000-0000-0000-0000-000000000000"
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  }, [configId, step1Data, step2Data, validateStep2, setDimensions]);

  const clearError = useCallback(() => setError(null), []);

  return {
    currentStep,
    setCurrentStep,
    step1Data,
    setStep1Data,
    step2Data,
    setStep2Data,
    columns,
    setColumns,
    totalPrice,
    setTotalPrice,
    validateStep1,
    validateStep2,
    handleCreateConfiguration,
    handleUpdateDimensions,
    loading,
    setError,
    clearError,
    error
  };
}