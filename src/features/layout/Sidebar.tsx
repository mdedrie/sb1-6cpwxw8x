import { FC, useState, KeyboardEvent, useCallback, useMemo } from 'react';
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

/**
 * Factorise les listes d'items, évite la duplication et isoler le rendu d'un lien.
 */
const NAVIGATION_ITEMS: NavItem[] = [
  { path: '/', icon: LayoutGrid, label: 'Catalogue' },
  { path: '/editor', icon: PlusSquare, label: 'Nouvelle Configuration' },
];

const CATALOG_ITEMS: NavItem[] = [
  { path: '/favorites', icon: Star, label: 'Favoris' },
  { path: '/history', icon: History, label: 'Historique' },
  { path: '/shared', icon: Users, label: 'Partagées' },
];


// UTILITY: Gère active strict+sous-routes
const isPathActive = (currentPath: string, targetPath: string) =>
  currentPath === targetPath ||
  (targetPath !== '/' && currentPath.startsWith(targetPath + '/'));

// DRY: Isoler le rendu d'un lien (avec memo pour perf)
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

// Render principal du composant Sidebar
export const Sidebar: FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Evite une closure inutile sur chaque render
  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  }, []);

  // Maximum accessibilité + micro-optimisation: évite de recréer la fonction à chaque render
  const handleKeyToggle = useCallback(
    (e: KeyboardEvent) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        toggleSection('catalog');
      }
    },
    [toggleSection]
  );

  // Memoise le calcul des actives si besoin
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

  // Extrait les classes pour meilleure maintenance + animation propre
  const sidebarClasses =
    `fixed inset-y-0 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out flex flex-col`;

  const catalogSectionClasses =
    `transition-all duration-200 overflow-hidden ${
      expandedSection === 'catalog'
        ? 'max-h-64 opacity-100'
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
            <div className="mt-1 space-y-1 pl-8">{catalogLinks}</div>
          </div>
        </div>
      </nav>
    </div>
  );
};