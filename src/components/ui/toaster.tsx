import * as React from 'react';
import { Toast, ToastProps } from './toast';

interface ToasterProps {
  toasts: (ToastProps & { id: string })[];
  onDismiss: (id: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} onClick={() => onDismiss(toast.id)}>
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};
