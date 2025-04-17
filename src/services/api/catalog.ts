import { ApiController } from './ApiController';
import type { ApiResponse } from './ApiController';

const api = ApiController.getInstance();

export const catalogApi = {
  async getConfigurations(): Promise<ApiResponse> {
    return api.get('/configurations/');
  },

  async deleteConfiguration(id: string): Promise<ApiResponse> {
    return api.delete(`/configurations/${id}`);
  }
};