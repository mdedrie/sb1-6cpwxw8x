import { FC, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Library,
  LayoutGrid,
  PlusSquare,
  ChevronRight,
  Star,
  History,
  Users
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

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out z-30 flex flex-col`}
      aria-label="Sidebar"
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-3">
          <Library className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">IceCore</span>
        </Link>
      </div>

      <nav className="flex-1 mt-6 px-4" aria-label="Main Navigation">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Section Catalogue avec items déroulants */}
        <div className="mt-6">
          <button
            onClick={() => toggleSection('catalog')}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={expandedSection === 'catalog'}
            aria-controls="catalog-section"
          >
            <ChevronRight
              className={`mr-3 h-5 w-5 transform transition-transform duration-150 ${
                expandedSection === 'catalog' ? 'rotate-90 text-indigo-600' : 'text-gray-400'
              }`}
            />
            <span>Catalogue</span>
          </button>
          {expandedSection === 'catalog' && (
            <div id="catalog-section" className="mt-1 space-y-1 pl-8">
              {catalogItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};
