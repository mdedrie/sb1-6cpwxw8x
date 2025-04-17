import {
  handleResponse,
  handleFetchError,
  API_BASE_URL,
  DEFAULT_HEADERS,
  fetchWithTimeout,
  retryRequest,
  TIMEOUT
} from './config';
import type { ApiResponse } from './types';

interface SetDimensionsPayload {
  configuration_name: string;
  configuration_description: string;
  configuration_outer_height: number;
  configuration_outer_width: number;
  configuration_outer_depth: number;
  configuration_buy_price: number;
  configuration_sell_price: number;
  is_catalog: boolean;
  user_id: string;
}

interface ParameterIndex {
  ref: string;
  category: string;
}

export const workflowApi = {
  /**
   * Récupère les colonnes existantes d'une configuration
   */
  async getColumns(configId: string): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(
          `${API_BASE_URL}/configuration_workflow/step2bis/columns/${configId}`,
          {
            headers: DEFAULT_HEADERS
          }
        )
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  /**
   * Récupère les métadonnées nécessaires à l'affichage du workflow
   */
  async getMetadata(filters?: string[]): Promise<ApiResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/configuration_workflow/step_metadata`);
      if (filters?.length) {
        filters.forEach(filter => url.searchParams.append('filters', filter));
      }

      // Only use AbortSignal.timeout if available (Node 18+, certains navigateurs). Sinon, fallback sans signal (le helper gère déjà un timeout interne)
      const fetchOptions: RequestInit = {
        headers: DEFAULT_HEADERS,
      };

      // @ts-ignore: AbortSignal.timeout peut ne pas exister selon l'environnement
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        // @ts-ignore
        fetchOptions.signal = AbortSignal.timeout(TIMEOUT);
      }

      const response = await retryRequest(() =>
        fetchWithTimeout(url.toString(), fetchOptions, TIMEOUT)
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  /**
   * Ajoute une colonne à une configuration (étape 2bis)
   */
  async addColumn(
    configId: string,
    data: {
      column_thickness_id: number;
      column_inner_height_id: number;
      column_inner_width_id: number;
      column_inner_depth_id: number;
      column_design_id: number;
      column_finish_id: number;
      column_door_type_id: number;
      column_two_way_opening_id?: number;
      column_knob_direction_id?: number;
      column_foam_type_id?: number;
      column_body_count: number;
      column_order: number;
      configuration_id: string;
    }
  ): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(
          `${API_BASE_URL}/configuration_workflow/step2bis/add_column/${configId}`,
          {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(data)
          }
        )
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  /**
   * Met à jour les dimensions d'une configuration (étape 2)
   */
  async setDimensions(
    configId: string,
    data: SetDimensionsPayload
  ): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(
          `${API_BASE_URL}/configuration_workflow/step2/set_dimensions/${configId}`,
          {
            method: 'PUT',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(data)
          }
        )
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  }
};