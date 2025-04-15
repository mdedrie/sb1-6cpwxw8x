import React, { useState, useCallback, useMemo } from 'react';
import { Play, ChevronDown, ChevronRight, Copy, Check, X, Clock, AlertCircle, Search, Filter, RefreshCw, Trash2, ExternalLink, Download, Share2, Bookmark, Zap } from 'lucide-react';
import { Button } from '../../../components/ui';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

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

export const ApiConsole: React.FC<ApiConsoleProps> = ({
  title = 'API Console',
  initiallyOpen = false,
  position = 'bottom-right',
  maxHeight = '96',
  itemsPerPage = 5,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState(itemsPerPage);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApiLog | null>(null);

  const handleSaveRequest = (log: ApiLog) => {
    const newSavedRequest: SavedRequest = {
      id: crypto.randomUUID(),
      name: `${log.request.method} ${new URL(log.request.url).pathname}`,
      request: log.request,
      createdAt: new Date()
    };
    setSavedRequests([...savedRequests, newSavedRequest]);
  };

  const handleExportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShareRequest = (log: ApiLog) => {
    const shareData = {
      method: log.request.method,
      url: log.request.url,
      headers: log.request.headers,
      body: log.request.body
    };
    navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
  };

  const positionClasses = useMemo(() => ({
    'bottom-right': 'right-4',
    'bottom-left': 'left-4',
  }), []);

  const handleCopy = useCallback(async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Monkey patch fetch to intercept API calls
  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Only intercept API calls
      if (!url.includes('icecoreapi-production.up.railway.app')) {
        return originalFetch(input, init);
      }

      const request: ApiRequest = {
        method: init?.method || 'GET',
        url,
        headers: init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {},
        body: init?.body,
        timestamp: new Date()
      };

      const startTime = performance.now();
      
      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        
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
          timing: Math.round(endTime - startTime)
        };

        setLogs(prev => [{
          request,
          response: apiResponse,
          timestamp: new Date()
        }, ...prev]);

        return response;
      } catch (error) {
        setLogs(prev => [{
          request,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }, ...prev]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search term filter
      if (searchTerm && !log.request.url.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filterStatus === 'success' && (!log.response || log.response.status >= 400)) {
        return false;
      }
      if (filterStatus === 'error' && log.response && log.response.status < 400) {
        return false;
      }

      // Method filter
      if (filterMethod !== 'all' && log.request.method !== filterMethod) {
        return false;
      }

      return true;
    });
  }, [logs, searchTerm, filterStatus, filterMethod]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * selectedItemsPerPage;
    const end = start + selectedItemsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, selectedItemsPerPage]);

  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.request.method)));
  }, [logs]);

  return (
    <div className={`fixed bottom-4 ${positionClasses[position]} z-50 w-[800px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden`}>
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>{title}</span>
          {logs.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
              {logs.length}
            </span>
          )}
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLogs([])}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-red-500" />
          </button>
          <button
            onClick={handleExportLogs}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
            title="Export logs"
          >
            <Download className="h-4 w-4 text-gray-500 group-hover:text-indigo-500" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
          >
            <X className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 overflow-auto" style={{ maxHeight: `${maxHeight}vh` }}>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'error')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Methods</option>
              {uniqueMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {paginatedLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No API calls logged yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedLogs.map((log, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200"
                >
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        log.response?.status < 300 ? 'bg-green-100 text-green-700' :
                        log.response?.status < 400 ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.request.method}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.response && (
                        <span className={`text-xs ${
                          log.response.timing < 300 ? 'text-green-600' :
                          log.response.timing < 1000 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {log.response.timing}ms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(log.request.url, '_blank')}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-indigo-500" />
                      </button>
                      <button
                        onClick={() => handleSaveRequest(log)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                        title="Save request"
                      >
                        <Bookmark className="h-4 w-4 text-gray-500 group-hover:text-indigo-500" />
                      </button>
                      <button
                        onClick={() => handleShareRequest(log)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                        title="Share request"
                      >
                        <Share2 className="h-4 w-4 text-gray-500 group-hover:text-indigo-500" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(log);
                          setShowJsonViewer(!showJsonViewer);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                        title="Toggle JSON viewer"
                      >
                        <Zap className="h-4 w-4 text-gray-500 group-hover:text-indigo-500" />
                      </button>
                      <button
                        onClick={() => setExpandedLog(expandedLog === index.toString() ? null : index.toString())}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 group"
                      >
                        {expandedLog === index.toString() ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 text-sm relative">
                    <div className="font-mono text-xs truncate text-gray-600">
                      {log.request.url}
                    </div>
                    
                    {showJsonViewer && selectedRequest === log && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <JsonView
                          data={log.response?.data || log.request.body || {}}
                          shouldExpandNode={() => true}
                        />
                      </div>
                    )}

                    {expandedLog === index.toString() && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Request</h4>
                          <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Headers:</span>
                              <button
                                onClick={() => handleCopy(log.request.headers)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                            <pre className="mt-1 text-gray-700 overflow-auto">
                              <code className="language-json">
                                {Prism.highlight(
                                  JSON.stringify(log.request.headers, null, 2),
                                  Prism.languages.json,
                                  'json'
                                )}
                              </code>
                            </pre>
                            {log.request.body && (
                              <>
                                <div className="mt-2 flex justify-between">
                                  <span className="text-gray-500">Body:</span>
                                  <button
                                    onClick={() => handleCopy(log.request.body)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                                <pre className="mt-1 text-gray-700 overflow-auto">
                                  <code className="language-json">
                                    {Prism.highlight(
                                      typeof log.request.body === 'string'
                                        ? JSON.stringify(JSON.parse(log.request.body), null, 2)
                                        : JSON.stringify(log.request.body, null, 2),
                                      Prism.languages.json,
                                      'json'
                                    )}
                                  </code>
                                </pre>
                              </>
                            )}
                          </div>
                        </div>

                        {log.response && (
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Response</h4>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {log.response.timing}ms
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Headers:</span>
                                <button
                                  onClick={() => handleCopy(log.response.headers)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                              <pre className="mt-1 text-gray-700 overflow-auto">
                                <code className="language-json">
                                  {Prism.highlight(
                                    JSON.stringify(log.response.headers, null, 2),
                                    Prism.languages.json,
                                    'json'
                                  )}
                                </code>
                              </pre>
                              <div className="mt-2 flex justify-between">
                                <span className="text-gray-500">Body:</span>
                                <button
                                  onClick={() => handleCopy(log.response.data)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                              <pre className="mt-1 text-gray-700 overflow-auto">
                                <code className="language-json">
                                  {Prism.highlight(
                                    JSON.stringify(log.response.data, null, 2),
                                    Prism.languages.json,
                                    'json'
                                  )}
                                </code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {log.error && (
                          <div>
                            <h4 className="text-xs font-medium text-red-500 uppercase mb-2">Error</h4>
                            <div className="bg-red-50 text-red-700 rounded p-2 font-mono text-xs">
                              {log.error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredLogs.length > selectedItemsPerPage && (
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {currentPage} of {Math.ceil(filteredLogs.length / selectedItemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLogs.length / selectedItemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredLogs.length / selectedItemsPerPage)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Saved Requests Panel */}
              {savedRequests.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Saved Requests</h3>
                  <div className="space-y-2">
                    {savedRequests.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{saved.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(saved.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSavedRequests(savedRequests.filter(r => r.id !== saved.id));
                          }}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};