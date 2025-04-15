import { useState, useEffect, useCallback } from 'react';
import type { Configuration } from '../../../types';

interface RawConfig {
  configuration_id: string;
  configuration_name: string;
  configuration_description: string | null;
  configuration_outer_height: string | null;
  configuration_outer_width: string | null;
  configuration_outer_depth: string | null;
  configuration_buy_price: string | null;
  configuration_sell_price: string | null;
  user_id: string;
  created_at: string;
  is_catalog: boolean;
}

export function useCatalogData() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://icecoreapi-production.up.railway.app/api/configurations/');
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des configurations (${response.status})`);
      }

      const rawData: RawConfig[] = await response.json();
      const now = new Date();

      const parsed = rawData.map((config) => {
        const { configuration_outer_height, configuration_outer_width, configuration_outer_depth } = config;

        const hasValidDimensions =
          configuration_outer_height !== null &&
          configuration_outer_width !== null &&
          configuration_outer_depth !== null;

        return {
          id: config.configuration_id,
          name: config.configuration_name,
          is_catalog: config.is_catalog,
          description: config.configuration_description || 'Aucune description',
          created_at: config.created_at,
          dimensions: hasValidDimensions
            ? {
                outer_height: parseFloat(configuration_outer_height),
                outer_width: parseFloat(configuration_outer_width),
                outer_depth: parseFloat(configuration_outer_depth),
              }
            : null,
          user_id: config.user_id,
          buy_price: config.configuration_buy_price !== null ? parseFloat(config.configuration_buy_price) : null,
          sell_price: config.configuration_sell_price !== null ? parseFloat(config.configuration_sell_price) : null,
          status: hasValidDimensions ? 'complete' : 'draft' as 'complete' | 'draft'
        };
      });

      setConfigurations(parsed);
      setLastRefresh(now);
    } catch (err) {
      console.error('Erreur lors du chargement des configurations :', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    configurations,
    loading,
    error,
    lastRefresh,
    handleRefresh,
    setConfigurations,
  };
}
