import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, Database, Info, X } from 'lucide-react';
import { DebugPanel } from './DebugPanel';
import { ApiConsole } from './ApiConsole';

type ScreenContext = 'catalog' | 'editor';

interface FloatingToolboxProps extends React.HTMLAttributes<HTMLDivElement> {
  debugData: unknown;
  debugTitle?: string;
  apiTitle?: string;
  context?: ScreenContext;
}

export const FloatingToolbox: React.FC<FloatingToolboxProps> = ({
  debugData,
  debugTitle = 'Debug Panel',
  apiTitle = 'API Console',
  context = 'catalog'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'debug' | 'api' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [closedPanels, setClosedPanels] = useState<Set<string>>(new Set());

  const handleToolClick = (toolId: 'debug' | 'api') => {
    setActivePanel(prev => (prev === toolId ? null : toolId));
  };

  const handleClosePanel = (panelId: string) => {
    setClosedPanels(prev => new Set([...prev, panelId]));
    if (activePanel === panelId) {
      setActivePanel(null);
    }
  };

  const handleReopenPanel = (panelId: string) => {
    setClosedPanels(prev => {
      const newSet = new Set(prev);
      newSet.delete(panelId);
      return newSet;
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsOpen(false);
    setActivePanel(null);
  };

  const getAvailableTools = (): {
    id: 'debug' | 'api';
    label: string;
    closed: boolean;
    icon: JSX.Element;
  }[] => {
    switch (context) {
      case 'catalog':
      case 'editor':
        return [
          {
            id: 'debug',
            label: debugTitle,
            closed: closedPanels.has('debug'),
            icon: <Info className="mr-2 h-4 w-4" />
          },
          {
            id: 'api',
            label: apiTitle,
            closed: closedPanels.has('api'),
            icon: <Database className="mr-2 h-4 w-4" />
          }
        ];
      default:
        return [];
    }
  };

  const tools = getAvailableTools();

  return (
    isVisible && (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsOpen(prev => !prev)}
                  className="flex items-center space-x-2 hover:bg-gray-200 px-2 py-1 rounded transition-colors duration-200"
                  aria-expanded={isOpen}
                  aria-controls="toolbox-content"
                >
                  <Wrench className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Outils</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
                title="Fermer complètement"
              >
                <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </button>
            </div>

            {isOpen && (
              <div id="toolbox-content" className="p-4 space-y-2">
                {tools.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        tool.closed ? handleReopenPanel(tool.id) : handleToolClick(tool.id)
                      }
                      className={`flex-1 text-left px-3 py-2 text-sm transition-colors duration-200 ${
                        activePanel === tool.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : tool.closed
                          ? 'text-gray-400 hover:text-gray-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      } rounded-md flex items-center`}
                    >
                      {tool.icon}
                      {tool.label}
                      {tool.closed && (
                        <span className="ml-2 text-xs">(Fermé)</span>
                      )}
                      {activePanel === tool.id && (
                        <span className="ml-auto text-xs text-indigo-500">Actif</span>
                      )}
                    </button>
                    {!tool.closed && (
                      <button
                        onClick={() => handleClosePanel(tool.id)}
                        className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        title="Fermer l'outil"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {activePanel === 'debug' && !closedPanels.has('debug') && (
            <div className="mt-2">
              <DebugPanel
                data={debugData}
                title={debugTitle}
                position="bottom-left"
                maxHeight="64"
                refreshInterval={1000}
              />
            </div>
          )}
          {activePanel === 'api' && !closedPanels.has('api') && (
            <div className="mt-2">
              <ApiConsole
                title={apiTitle}
                position="bottom-right"
                maxHeight="64"
              />
            </div>
          )}
        </div>
      </div>
    )
  );
};
