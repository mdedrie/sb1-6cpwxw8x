import { FC, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Library, LayoutGrid, PlusSquare, ChevronRight,
  Star, History, Users
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationItems = [
    { path: '/', icon: LayoutGrid, label: 'Catalogue' },
    { path: '/editor', icon: PlusSquare, label: 'Nouvelle Configuration' },
  ];

  const catalogItems = [
    { path: '/favorites', icon: Star, label: 'Favoris' },
    { path: '/history', icon: History, label: 'Historique' },
    { path: '/shared', icon: Users, label: 'Partagées' },
  ];

  // Améliore l'active : supporte aussi sous-routes
  const checkActive = (itemPath: string) => (
    location.pathname === itemPath ||
    (itemPath.length > 1 && location.pathname.startsWith(itemPath + '/'))
  );

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleKeyToggle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection('catalog');
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out flex flex-col`}
      aria-label="Menu latéral"
      role="navigation"
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-3">
          <Library className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">IceCore</span>
        </Link>
      </div>

      <nav className="flex-1 mt-6 px-4" aria-label="Navigation principale">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = checkActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 outline-none focus:ring-2 focus:ring-indigo-500
                  ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
                role="menuitem"
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* SECTION DEROULEE */}
        <div className="mt-6">
          <button
            onClick={() => toggleSection('catalog')}
            onKeyDown={handleKeyToggle}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md 
              hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500
              group`}
            aria-expanded={expandedSection === 'catalog'}
            aria-controls="catalog-section"
            tabIndex={0}
            role="button"
          >
            <ChevronRight
              className={`mr-3 h-5 w-5 transition-transform duration-200
                ${expandedSection === 'catalog' ? 'rotate-90 text-indigo-600' : 'text-gray-400'}
                group-focus:text-indigo-700
              `}
            />
            <span className="font-semibold">Catalogue</span>
          </button>
          <div 
            id="catalog-section"
            aria-hidden={expandedSection !== 'catalog'}
            className={`transition-all duration-200 overflow-hidden ${
              expandedSection === 'catalog' ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="mt-1 space-y-1 pl-8">
              {catalogItems.map((item) => {
                const Icon = item.icon;
                const isActive = checkActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 outline-none focus:ring-2 focus:ring-indigo-500
                      ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={0}
                    role="menuitem"
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};