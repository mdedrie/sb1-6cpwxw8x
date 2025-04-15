import { useState, useEffect, useCallback } from 'react';
import type { Configuration } from '../../../types';

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

      const data = await response.json();
      setConfigurations(data.map((config: any) => {
        const hasValidDimensions = config.configuration_outer_height !== null && 
                                 config.configuration_outer_width !== null && 
                                 config.configuration_outer_depth !== null;
        
        return {
          id: config.configuration_id,
          name: config.configuration_name,
          is_catalog: config.is_catalog,
          description: config.configuration_description || 'Aucune description',
          created_at: config.created_at,
          dimensions: hasValidDimensions ? {
            outer_height: parseFloat(config.configuration_outer_height),
            outer_width: parseFloat(config.configuration_outer_width),
            outer_depth: parseFloat(config.configuration_outer_depth),
          } : null,
          user_id: config.user_id,
          buy_price: config.configuration_buy_price !== null ? parseFloat(config.configuration_buy_price) : null,
          sell_price: config.configuration_sell_price !== null ? parseFloat(config.configuration_sell_price) : null,
          status: !hasValidDimensions ? 'draft' : 'complete'
        };
      }));
    } catch (err) {
      console.error('Error fetching configurations:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLastRefresh(new Date());
  }, []);

  return {
    configurations,
    loading,
    error,
    refreshKey,
    lastRefresh,
    handleRefresh,
    setConfigurations
  };
}