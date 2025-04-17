import { API_BASE_URL, DEFAULT_HEADERS, TIMEOUT } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestConfig {
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
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
  // Plus besoin de controller ici : ils sont par-requête
  public readonly baseUrl: string = API_BASE_URL;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {}

  public static getInstance(): ApiController {
    if (!ApiController.instance) {
      ApiController.instance = new ApiController();
    }
    return ApiController.instance;
  }

  /**
   * Annulation "globale" : (ici on laisse vide ou à compléter selon logique de l'app)
   */
  public abort(): void {
    // Peut être implémentée plus tard si tu veux annuler toutes les requêtes (cf. architecture)
    // Ici à supprimer ou à améliorer
  }

  private serializeQueryParams(params?: Record<string, string | number | boolean>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
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

    let data: any = null;
    try {
      // Certains endpoints peuvent ne pas renvoyer de JSON (statut 204 par exemple)
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      }
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      let message = 'Une erreur est survenue';

      if (status === 422) {
        message = Array.isArray(data?.detail)
          ? data.detail.map((d: any) => d.msg).join(', ')
          : data?.detail || 'Données invalides';
      } else if (status === 500) {
        message = 'Erreur serveur interne';
      } else if (data?.message) {
        message = data.message;
      }

      throw new ApiError(message, status, data);
    }

    return { data, status };
  }

  private isRetriableError(error: any) {
    // On ne retry pas pour les 4xx hors 429
    if (error instanceof ApiError) {
      if (error.status >= 400 && error.status < 500 && error.status !== 429) return false;
    }
    // Peut-être affiner la logique ici
    return true;
  }

  private async retryRequest<T>(
    request: () => Promise<ApiResponse<T>>,
    retries = this.retryCount
  ): Promise<ApiResponse<T>> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.isRetriableError(error)) {
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
      signal: userSignal,
      timeout = TIMEOUT
    } = config;

    const url = `${API_BASE_URL}${endpoint}${this.serializeQueryParams(params)}`;

    // Combine abort signals (si timeout ET signal utilisateur)
    const timeoutController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    // Combine les signaux si nécessaire : on crée un signal qui sera aborted si l'un des deux est aborted
    const combinedSignal = (() => {
      if (!userSignal) return timeoutController.signal;
      if (userSignal.aborted) timeoutController.abort(); // déjà aborted
      const combined = new AbortController();

      // Propagation abort
      userSignal.addEventListener('abort', () => combined.abort(), { once: true });
      timeoutController.signal.addEventListener('abort', () => combined.abort(), { once: true });
      return combined.signal;
    })();

    if (timeout > 0) {
      timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    }

    let requestBody: BodyInit | undefined;
    let contentType: string | undefined;

    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        requestBody = body;
        // ne PAS définir Content-Type: le navigateur le gère !
      } else {
        requestBody = JSON.stringify(body);
        contentType = 'application/json';
      }
    }

    const mergedHeaders = {
      ...DEFAULT_HEADERS,
      ...headers,
      ...(contentType ? { 'Content-Type': contentType } : {})
    };

    try {
      return await this.retryRequest(async () => {
        const response = await fetch(url, {
          method,
          headers: mergedHeaders,
          body: requestBody,
          signal: combinedSignal,
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
          throw new ApiError('La requête a été annulée ou le délai a expiré', 0);
        }
        throw new ApiError(error.message, 0);
      }
      throw new ApiError('Une erreur inconnue est survenue', 0);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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