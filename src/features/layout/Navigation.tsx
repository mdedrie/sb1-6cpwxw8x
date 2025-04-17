import { FC, useState, useRef, useEffect } from 'react';
import {
  Menu,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  HelpCircle,
  Home,
  FileText,
  BookOpen,
  Mail,
  BugPlay
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal, FormField, Button } from '../../components/ui';

interface NavigationProps {
  onToggleSidebar: () => void;
}

export const Navigation: FC<NavigationProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickNav, setShowQuickNav] = useState(false);
  const quickNavRef = useRef<HTMLDivElement>(null);
  const [showBugReport, setShowBugReport] = useState(false);

  // Fermer les menus si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (quickNavRef.current && !quickNavRef.current.contains(event.target as Node)) {
        setShowQuickNav(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickNavItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: FileText, label: 'Documentation', path: '/docs' },
    { icon: BookOpen, label: 'Tutoriels', path: '/tutorials' },
    { icon: Mail, label: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-sm" role="navigation" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Bouton de bascule de la sidebar */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bouton de recherche */}
            <button
              onClick={() => setShowSearch(prev => !prev)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label="Search"
              aria-expanded={showSearch}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Bouton de signalement d'un bug */}
            <button
              onClick={() => setShowBugReport(true)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label="Report a bug"
            >
              <BugPlay className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 relative focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            {/* Paramètres */}
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Menu utilisateur */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <span className="text-white text-sm font-medium">JD</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50" role="menu" aria-label="User menu">
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="inline mr-2 h-4 w-4" /> Profil
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => navigate('/logout')}
                  >
                    <LogOut className="inline mr-2 h-4 w-4" /> Déconnexion
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    role="menuitem"
                    onClick={() => navigate('/help')}
                  >
                    <HelpCircle className="inline mr-2 h-4 w-4" /> Aide
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de recherche */}
      {showSearch && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md p-4 z-40">
          <FormField
            label="Rechercher"
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="Rechercher..."
            required
          />
        </div>
      )}

      {/* Panneau de navigation rapide (Quick Nav) */}
      {showQuickNav && (
        <div ref={quickNavRef} className="absolute top-16 right-0 bg-white shadow-md rounded-md p-4 z-40">
          {quickNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modal pour le signalement d'un bug */}
      {showBugReport && (
        <Modal
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          title="Signaler un bug"
        >
          <FormField
            label="Description du bug"
            textarea
            rows={4}
            placeholder="Décrivez le problème rencontré"
            required
          />
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowBugReport(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowBugReport(false)}>
              Envoyer
            </Button>
          </div>
        </Modal>
      )}
    </nav>
  );
};
