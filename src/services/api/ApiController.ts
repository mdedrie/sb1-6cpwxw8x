import { API_BASE_URL, DEFAULT_HEADERS, TIMEOUT } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestConfig {
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error?: string;
  status: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiController {
  private static instance: ApiController;
  private controller: AbortController;
  public readonly baseUrl: string = API_BASE_URL;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {
    this.controller = new AbortController();
  }

  public static getInstance(): ApiController {
    if (!ApiController.instance) {
      ApiController.instance = new ApiController();
    }
    return ApiController.instance;
  }

  public abort(): void {
    this.controller.abort();
    this.controller = new AbortController();
  }

  private serializeQueryParams(params?: Record<string, string>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const serialized = searchParams.toString();
    return serialized ? `?${serialized}` : '';
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;

    if (status === 0) {
      throw new ApiError(
        'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
        0
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      let message = 'Une erreur est survenue';
      
      if (status === 422) {
        message = Array.isArray(data?.detail)
          ? data.detail.map((d: any) => d.msg).join(', ')
          : data?.detail || 'Données invalides';
      }
      
      if (status === 500) {
        message = 'Erreur serveur interne';
      }

      throw new ApiError(message, status, data);
    }

    return { data, status };
  }

  private async retryRequest<T>(
    request: () => Promise<ApiResponse<T>>,
    retries = this.retryCount
  ): Promise<ApiResponse<T>> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && !(error instanceof ApiError && error.status === 422)) {
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * (this.retryCount - retries + 1))
        );
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  public async request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      headers = {},
      body,
      params,
      signal = this.controller.signal,
      timeout = TIMEOUT
    } = config;

    const url = `${API_BASE_URL}${endpoint}${this.serializeQueryParams(params)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await this.retryRequest(async () => {
        const response = await fetch(url, {
          method,
          headers: {
            ...DEFAULT_HEADERS,
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit'
        });

        return this.handleResponse<T>(response);
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('La requête a été annulée', 0);
        }
        throw new ApiError(error.message, 0);
      }
      
      throw new ApiError('Une erreur inconnue est survenue', 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Méthodes utilitaires pour les verbes HTTP
  public async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, config);
  }

  public async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...config, body: data });
  }

  public async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...config, body: data });
  }

  public async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, config);
  }
}