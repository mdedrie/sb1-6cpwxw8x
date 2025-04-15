import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, X, Clock, AlertCircle, Search, ExternalLink, Download, Share2, Bookmark, Zap, Trash2 } from 'lucide-react';

interface ApiRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
}

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  timing: number;
}

interface ApiLog {
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
  timestamp: Date;
}

interface ApiConsoleProps {
  title?: string;
  initiallyOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  maxHeight?: string;
  itemsPerPage?: number;
}

interface SavedRequest {
  id: string;
  name: string;
  request: ApiRequest;
  createdAt: Date;
}

// Hook pour journaliser les requêtes
export function useApiLogger(enabled = true) {
  const [logs, setLogs] = useState<ApiLog[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

      if (!url.includes('icecoreapi-production.up.railway.app')) {
        return originalFetch(input, init);
      }

      const request: ApiRequest = {
        method: init?.method || 'GET',
        url,
        headers: init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {},
        body: init?.body,
        timestamp: new Date(),
      };

      const start = performance.now();

      try {
        const response = await originalFetch(input, init);
        const end = performance.now();

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const responseData = await response.clone().json();

        const apiResponse: ApiResponse = {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: responseHeaders,
          timing: Math.round(end - start),
        };

        setLogs(prev => [{ request, response: apiResponse, timestamp: new Date() }, ...prev]);

        return response;
      } catch (error) {
        setLogs(prev => [{
          request,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        }, ...prev]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  return logs;
}
