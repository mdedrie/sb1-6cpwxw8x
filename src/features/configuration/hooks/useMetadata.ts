import { useState, useEffect, useCallback } from 'react';
import { useWorkflowApi } from '../../../services/api/hooks';
import type { StepMetadata } from '../../../types';

/**
 * Récupère les metadata du workflow.
 * @param filters (optionnel) : tableau de filtres, typiquement des string refs
 */
export function useMetadata(filters?: string[]) {
  const [metadata, setMetadata] = useState<StepMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getMetadata } = useWorkflowApi();

  useEffect(() => {
    let mounted = true;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMetadata(filters);
        if (mounted) setMetadata(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load configuration data');
          console.error(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMetadata();
    return () => { mounted = false; };
  // use JSON.stringify to break unwanted renders in case filters is a new ref each time
  }, [JSON.stringify(filters), getMetadata]);

  const clearError = useCallback(() => setError(null), []);

  return { metadata, loading, error, clearError };
}