export const API_BASE_URL = 'https://icecoreapi-production.up.railway.app/api';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
export const TIMEOUT = 60000;
const BACKOFF_FACTOR = 1.5;

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const headers = {
    ...DEFAULT_HEADERS,
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
      credentials: 'include',
      mode: 'cors'
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('La requête a expiré. Veuillez vérifier votre connexion et réessayer.');
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Add more specific error handling for network issues
        const isSSL = url.startsWith('https://');
        if (!isSSL) {
          throw new Error('La connexion sécurisée a échoué. Veuillez utiliser HTTPS.');
        }
        throw new Error('Impossible de contacter le serveur. Veuillez vérifier que vous êtes connecté à Internet et que le serveur est accessible.');
      }
    }
    throw error;
  }
}

export async function retryRequest(
  fn: () => Promise<Response>,
  retries = MAX_RETRIES,
  attempt = 1
): Promise<Response> {
  try {
    const response = await fn();
    
    // Check for CORS issues
    if (response.status === 0) {
      throw new Error('CORS Error: The server is not allowing requests from this origin');
    }
    
    if (!response.ok && retries > 0) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries > 0) {
      const delay = RETRY_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1);
      console.warn(`Request failed, retrying in ${delay}ms... (${retries} attempts left)`);

      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Request timed out, increasing timeout for retry');
        return retryRequest(
          () => fetchWithTimeout(fn.toString(), {}, TIMEOUT * 2),
          retries - 1,
          attempt + 1
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, attempt + 1);
    }
    throw err;
  }
}

export async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const status = response.status;
  
  if (status === 0) {
    return {
      data: null as T,
      error: 'Le serveur est inaccessible. Veuillez vérifier votre connexion internet et réessayer.',
      status
    };
  }

  if (!response.ok) {
    let error = 'Une erreur est survenue lors de la communication avec le serveur';
    try {
      const data = await response.json();
      if (status === 422) {
        error = Array.isArray(data.detail) 
          ? data.detail.map(d => d.msg).join(', ')
          : data.detail || 'Données invalides';
      }
      if (status === 500) {
        error = 'Erreur serveur interne. Veuillez réessayer dans quelques instants.';
      }
      if (status === 404) {
        error = 'La ressource demandée n\'existe pas.';
      }
      if (status === 403) {
        error = 'Accès non autorisé. Veuillez vous reconnecter.';
      }
    } catch (e) {
      error = response.statusText || `Erreur ${status}: La requête n'a pas pu aboutir`;
    }
    return { data: null as T, error, status };
  }

  try {
    const data = await response.json();
    return { data, error: undefined, status };
  } catch (err) {
    return {
      data: null as T,
      error: err instanceof Error 
        ? 'Erreur lors du traitement de la réponse du serveur: ' + err.message
        : 'Erreur inattendue lors du traitement de la réponse',
      status
    };
  }
}

export async function handleFetchError(err: unknown): Promise<ApiResponse> {
  console.error('API request failed:', err);
  
  let errorMessage = 'Une erreur inattendue est survenue lors de la communication avec le serveur';
  
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      errorMessage = 'La requête a expiré. Veuillez vérifier votre connexion et réessayer.';
    } else if (err.message === 'Failed to fetch') {
      errorMessage = 'Impossible de contacter le serveur. Veuillez vérifier que vous êtes connecté à Internet et que le serveur est accessible.';
    } else if (err.message.includes('NetworkError')) {
      errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion Internet.';
    } else if (err.message.includes('CORS')) {
      errorMessage = 'Erreur de sécurité CORS. Le serveur n\'autorise pas les requêtes depuis cette origine.';
    } else {
      errorMessage = err.message;
    }
  }
  
  return {
    data: null,
    error: errorMessage,
    status: 0
  };
}