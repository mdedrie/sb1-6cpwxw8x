import React from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { Catalog } from './pages/Catalog';
import { ConfigurationEditor } from './pages/ConfigurationEditor';
import { Layout } from './features/layout/Layout';
import { ToastProvider } from './components/ui/toast-context';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Catalog /> },
      { path: 'editor', element: <ConfigurationEditor /> },
      { path: 'editor/:id', element: <ConfigurationEditor /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;