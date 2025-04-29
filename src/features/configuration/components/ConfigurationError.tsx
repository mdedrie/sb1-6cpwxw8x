import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfigurationErrorProps {
  error: string;
  onDismiss: () => void;
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({
  error,
  onDismiss
}) => {
  return (
    <div
      className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between text-red-700 animate-shake"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <p>{error}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-500 hover:text-red-600"
        aria-label="Fermer l’erreur"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};