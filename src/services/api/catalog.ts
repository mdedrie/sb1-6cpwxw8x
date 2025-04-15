import { handleResponse, handleFetchError, API_BASE_URL } from './config';
import type { ApiResponse } from './types';

export const catalogApi = {
  // Fetch all configurations
  async getConfigurations(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/configurations/`);
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  },

  // Delete a configuration
  async deleteConfiguration(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/configurations/${id}`, {
        method: 'DELETE'
      });
      return handleResponse(response);
    } catch (err) {
      return handleFetchError(err);
    }
  }
};