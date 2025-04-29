import { FC, useState, useCallback, useMemo, useEffect, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Library, LayoutGrid, PlusSquare, ChevronRight,
  Star, History, Users
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { path: '/', icon: LayoutGrid, label: 'Catalogue' },
  { path: '/editor', icon: PlusSquare, label: 'Nouvelle Configuration' },
];

const CATALOG_ITEMS: NavItem[] = [
  { path: '/favorites', icon: Star, label: 'Favoris' },
  { path: '/history', icon: History, label: 'Historique' },
  { path: '/shared', icon: Users, label: 'Partagées' },
];

const isPathActive = (currentPath: string, targetPath: string) =>
  currentPath === targetPath ||
  (targetPath !== '/' && currentPath.startsWith(targetPath + '/'));

const SidebarLink: FC<{
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}> = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 outline-none focus:ring-2 focus:ring-indigo-500
        ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
      `}
      aria-current={active ? 'page' : undefined}
      tabIndex={0}
      role="menuitem"
    >
      <Icon className={`mr-3 h-5 w-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
      {item.label}
    </Link>
  );
};

export const Sidebar: FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Ouvre le catalogue si on navigue vers un link inclus dedans.
  useEffect(() => {
    if (CATALOG_ITEMS.some(item => isPathActive(location.pathname, item.path))) {
      setExpandedSection('catalog');
    }
  }, [location.pathname]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  }, []);

  const handleKeyToggle = useCallback(
    (e: KeyboardEvent) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        toggleSection('catalog');
      }
    },
    [toggleSection]
  );

  const navLinks = useMemo(
    () =>
      NAVIGATION_ITEMS.map(item => (
        <SidebarLink
          key={item.path}
          item={item}
          active={isPathActive(location.pathname, item.path)}
        />
      )),
    [location.pathname]
  );

  const catalogLinks = useMemo(
    () =>
      CATALOG_ITEMS.map(item => (
        <SidebarLink
          key={item.path}
          item={item}
          active={isPathActive(location.pathname, item.path)}
        />
      )),
    [location.pathname]
  );

  const sidebarClasses =
    `fixed inset-y-0 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out flex flex-col`;

  const catalogSectionClasses =
    `transition-all duration-200 overflow-hidden ${
      expandedSection === 'catalog'
        ? 'max-h-[400px] opacity-100'
        : 'max-h-0 opacity-0 pointer-events-none'
    }`;

  return (
    <div className={sidebarClasses} aria-label="Menu latéral" role="navigation">
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-3">
          <Library className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">IceCore</span>
        </Link>
      </div>
      <nav className="flex-1 mt-6 px-4" aria-label="Navigation principale">
        <div className="space-y-1">{navLinks}</div>

        {/* SECTION DEROULANTE */}
        <div className="mt-6">
          <button
            onClick={() => toggleSection('catalog')}
            onKeyDown={handleKeyToggle}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 group"
            aria-expanded={expandedSection === 'catalog'}
            aria-controls="catalog-section"
            tabIndex={0}
            role="button"
            type="button"
          >
            <ChevronRight
              className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                expandedSection === 'catalog' ? 'rotate-90 text-indigo-600' : 'text-gray-400'
              } group-focus:text-indigo-700`}
            />
            <span className="font-semibold">Catalogue</span>
          </button>
          <div
            id="catalog-section"
            aria-hidden={expandedSection !== 'catalog'}
            className={catalogSectionClasses}
          >
            <div className="mt-1 space-y-1 pl-8 overflow-y-auto">{catalogLinks}</div>
          </div>
        </div>
      </nav>
    </div>
  );
};