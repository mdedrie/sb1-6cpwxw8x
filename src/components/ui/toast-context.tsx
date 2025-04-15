import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from './toast';

export interface ToastOptions {
  header: ReactNode;
  description?: ReactNode;
  variant?: 'default' | 'destructive';
  action?: ReactNode;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const showToast = (options: ToastOptions) => {
    setToasts((prev) => [...prev, options]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
  {toasts.map((toast, index) => (
    <Toast
      key={index}
      header={toast.header}
      description={toast.description}
      variant={toast.variant}
      action={toast.action}
    />
  ))}
</div>

    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
