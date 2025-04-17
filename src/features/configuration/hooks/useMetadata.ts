import { useState, useEffect } from 'react';
import { useWorkflowApi } from '../../../services/api/hooks';
import type { StepMetadata } from '../../../types';

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
  }, [filters, getMetadata]);

  return { metadata, loading, error };
}