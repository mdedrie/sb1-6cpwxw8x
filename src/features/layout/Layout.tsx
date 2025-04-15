import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../layout/Navigation';
import { Sidebar } from '../layout/Sidebar';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className={`flex-1 transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'} py-12 px-4 sm:px-6 lg:px-8`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}