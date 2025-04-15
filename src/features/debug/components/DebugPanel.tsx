import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X, Maximize2, Minimize2, Copy, Check, Eye, EyeOff, Search, Filter, RefreshCw } from 'lucide-react';

interface DebugPanelProps {
  data: unknown;
  title?: string;
  initiallyOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  maxHeight?: string;
  refreshInterval?: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  data,
  title = 'Debug Panel',
  initiallyOpen = false,
  position = 'bottom-right',
  maxHeight = '96',
  refreshInterval = 0,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpty, setFilterEmpty] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  React.useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shouldShowValue = (key: string, value: unknown): boolean => {
    if (searchTerm && !key.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterEmpty) {
      if (value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value || {}).length === 0)) {
        return false;
      }
    }
    return true;
  };

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-orange-600">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-blue-600">{value}</span>;
    if (typeof value === 'string') {
      if (hideValues && value.length > 0) {
        return <span className="text-green-600">"••••••"</span>;
      }
      return <span className="text-green-600">"{value}"</span>;
    }
    if (Array.isArray(value)) {
      return (
        <NestedValue
          summary={`Array(${value.length})`}
          details={
            <div className="pl-4">
              {value.map((item, index) => (
                <div key={index} className="flex">
                  <span className="text-gray-500 mr-2">{index}:</span>
                  {renderValue(item)}
                </div>
              ))}
            </div>
          }
        />
      );
    }
    if (typeof value === 'object') {
      return (
        <NestedValue
          summary={value.constructor.name}
          details={
            <div className="pl-4">
              {Object.entries(value).map(([key, val]) => (
                shouldShowValue(key, val) && (
                <div key={key} className="flex">
                  <span className="text-gray-500 mr-2">{key}:</span>
                  {renderValue(val)}
                </div>
                )
              ))}
            </div>
          }
        />
      );
    }
    return String(value);
  };

  return (
    <div
      className={`fixed ${isFullscreen ? 'inset-4' : positionClasses[position]} z-50 transition-all duration-200 ease-in-out`}
    >
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-200 ${
        isMinimized ? 'w-auto' : isFullscreen ? 'w-full h-full' : 'w-96'
      }`}>
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200 select-none">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              title={refreshInterval > 0 ? `Last update: ${lastUpdate.toLocaleTimeString()}` : undefined}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span>{title}</span>
              {refreshInterval > 0 && (
                <RefreshCw className="h-3 w-3 ml-2 text-gray-400 animate-spin" />
              )}
            </button>
            {!isMinimized && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-4 w-px bg-gray-300" />
                <button
                  onClick={() => setHideValues(!hideValues)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 group"
                  title={hideValues ? "Show values" : "Hide values"}
                >
                  {hideValues ? (
                    <EyeOff className="h-4 w-4 group-hover:text-indigo-600" />
                  ) : (
                    <Eye className="h-4 w-4 group-hover:text-indigo-600" />
                  )}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 group"
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 group-hover:text-indigo-600" />
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {!isMinimized && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded transition-colors duration-200" title="Close">
              <X className="h-4 w-4 hover:text-red-500" />
            </button>
          </div>
        </div>
        {isOpen && !isMinimized && (
          <>
          <div className="border-b border-gray-200 p-2 bg-gray-50">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setFilterEmpty(!filterEmpty)}
                className={`p-1 rounded ${filterEmpty ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
                title="Filter empty values"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={`p-4 ${isFullscreen ? 'h-[calc(100%-40px)]' : `max-h-${maxHeight}`} overflow-auto font-mono text-sm`}>
            {renderValue(data)}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

interface NestedValueProps {
  summary: string;
  details: React.ReactNode;
}

const NestedValue: React.FC<NestedValueProps> = ({ summary, details }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 hover:text-gray-700 group"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 group-hover:text-indigo-600" />
        ) : (
          <ChevronRight className="h-3 w-3 group-hover:text-indigo-600" />
        )}
        <span className="text-purple-600 font-medium">{summary}</span>
      </button>
      {isOpen && (
        <div className="mt-1 pl-3 border-l-2 border-indigo-50 hover:border-indigo-100 transition-colors duration-200">
          {details}
        </div>
      )}
    </div>
  );
};