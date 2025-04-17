import {
  handleResponse,
  handleFetchError,
  API_BASE_URL,
  DEFAULT_HEADERS,
  fetchWithTimeout,
  retryRequest,
  TIMEOUT
} from './config';
import type { ApiResponse } from './ApiController'; // utilise ton vrai chemin de ApiResponse

interface ConfigurationCreate {
  configuration_name: string;
  is_catalog?: boolean;
  user_id?: string;
  configuration_description?: string;
  configuration_outer_height?: number;
  configuration_outer_width?: number;
  configuration_outer_depth?: number;
  configuration_buy_price?: number;
  configuration_sell_price?: number;
}

export const configurationApi = {
  // Fetch a single configuration
  async getConfiguration(id: string): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(`${API_BASE_URL}/configurations/${id}`, {
          headers: DEFAULT_HEADERS,
        })
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  // Initialize a new configuration
  async initializeConfiguration(data: ConfigurationCreate): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(`${API_BASE_URL}/configurations/`, {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify(data),
        })
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  // Update an existing configuration
  async updateConfiguration(id: string, data: Partial<ConfigurationCreate>): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(`${API_BASE_URL}/configurations/${id}/`, {
          method: 'PUT',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ ...data, configuration_id: id }),
        }, TIMEOUT)
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  // Set dimensions for a configuration
  async setDimensions(
    configId: string,
    data: {
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
  ): Promise<ApiResponse> {
    try {
      const response = await retryRequest(() =>
        fetchWithTimeout(`${API_BASE_URL}/configurations/${configId}`, {
          method: 'PUT',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify(data),
        })
      );
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  }
};