import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../layout/Navigation';
import { Sidebar } from '../layout/Sidebar';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Facilite l'usage, et stabilise la référence
  const handleToggleSidebar = useCallback(
    () => setIsSidebarOpen(open => !open),
    []
  );

  // Meilleur suivi de la classe, synchronisation avec Sidebar w-64
  const mainClass = `flex-1 transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'} py-12 px-4 sm:px-6 lg:px-8`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} /* tu peux propager onClose={handleToggleSidebar} ici en cas de mobile overlay */ />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation onToggleSidebar={handleToggleSidebar} />
        <main className={mainClass}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}