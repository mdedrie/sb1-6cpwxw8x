import { FC, useState, useRef, useEffect, useCallback } from 'react';
import {
  Menu, Settings, Bell, Search, User, LogOut, HelpCircle,
  Home, FileText, BookOpen, Mail, BugPlay
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal, FormField, Button } from '../../components/ui';

interface NavigationProps {
  onToggleSidebar: () => void;
}

const quickNavItems = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: FileText, label: 'Documentation', path: '/docs' },
  { icon: BookOpen, label: 'Tutoriels', path: '/tutorials' },
  { icon: Mail, label: 'Contact', path: '/contact' },
];

type Panel = 'userMenu' | 'quickNav' | 'search' | 'bugReport' | null;

export const Navigation: FC<NavigationProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();

  // Un seul état pour tous les panneaux
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const menuRefs = {
    userMenu: useRef<HTMLDivElement>(null),
    quickNav: useRef<HTMLDivElement>(null),
  };

  // Ferme le panneau quand clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      (['userMenu', 'quickNav'] as const).forEach(panel => {
        if (
          openPanel === panel &&
          menuRefs[panel].current &&
          !menuRefs[panel].current!.contains(event.target as Node)
        ) {
          setOpenPanel(null);
        }
      });
    }
    // Pas besoin pour search et bugReport (modals)
    if (openPanel === 'userMenu' || openPanel === 'quickNav') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPanel, menuRefs]);

  // ESC = ferme tout
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenPanel(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // DRY : toggle générique
  const togglePanel = useCallback(
    (panel: Panel) => setOpenPanel(p => (p === panel ? null : panel)),
    []
  );

  // Pour ne garder qu'un seul panel ouvert à la fois :
  const handleBugClick = () => setOpenPanel('bugReport');

  // Bouton factorisé
  const PanelButton: FC<{
    label: string;
    Icon: React.ElementType;
    panel: Panel;
    className?: string;
    onClick?: () => void;
    [x: string]: any;
  }> = ({ label, Icon, panel, className = '', onClick, ...rest }) => (
    <button
      onClick={() => {
        if (onClick) onClick();
        else togglePanel(panel);
      }}
      className={`p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${className}`}
      aria-label={label}
      aria-haspopup="true"
      aria-expanded={openPanel === panel}
      tabIndex={0}
      {...rest}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  return (
    <nav className="w-full relative bg-white shadow-sm z-40" role="navigation" aria-label="Main Navigation">
      <div className="w-full max-w-none px-2 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              aria-label="Ouvrir le menu"
              tabIndex={0}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <PanelButton label="Raccourcis" Icon={Home} panel="quickNav" />
            <PanelButton label="Recherche" Icon={Search} panel="search" />
            <PanelButton
              label="Signaler un bug"
              Icon={BugPlay}
              panel="bugReport"
              onClick={handleBugClick}
              aria-haspopup={undefined}
              aria-expanded={undefined}
            />
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 relative focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              aria-label="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="relative" ref={menuRefs.userMenu}>
              <button
                onClick={() => togglePanel('userMenu')}
                className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                aria-label="Menu utilisateur"
                aria-haspopup="true"
                aria-expanded={openPanel === 'userMenu'}
                tabIndex={0}
              >
                <span className="text-white text-sm font-medium">JD</span>
              </button>
              {openPanel === 'userMenu' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50" role="menu" aria-label="User menu">
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => { setOpenPanel(null); navigate('/profile'); }}
                  >
                    <User className="inline mr-2 h-4 w-4" /> Profil
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => { setOpenPanel(null); navigate('/logout'); }}
                  >
                    <LogOut className="inline mr-2 h-4 w-4" /> Déconnexion
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => { setOpenPanel(null); navigate('/help'); }}
                  >
                    <HelpCircle className="inline mr-2 h-4 w-4" /> Aide
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      {openPanel === 'search' && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md p-4 z-40">
          <FormField
            label="Rechercher"
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="Rechercher…"
            required
            autoFocus
            className="w-full max-w-xl"
          />
          {/* Résultats potentiels ici */}
        </div>
      )}

      {/* Quick Navigation Panel */}
      {openPanel === 'quickNav' && (
        <div
          ref={menuRefs.quickNav}
          className="absolute top-16 right-2 bg-white shadow-md rounded-md p-4 z-40 w-56"
        >
          {quickNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpenPanel(null);
                navigate(item.path);
              }}
              className="flex items-center space-x-2 p-2 w-full text-left hover:bg-gray-100 rounded-md transition-colors duration-200"
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bug Report Modal */}
      {openPanel === 'bugReport' && (
        <Modal
          isOpen={true}
          onClose={() => setOpenPanel(null)}
          title="Signaler un bug"
        >
          <FormField
            label="Description du bug"
            textarea
            rows={4}
            placeholder="Décrivez le problème rencontré…"
            required
          />
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setOpenPanel(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                // Logique d'envoi à implémenter ici
                setOpenPanel(null);
              }}
            >
              Envoyer
            </Button>
          </div>
        </Modal>
      )}
    </nav>
  );
};