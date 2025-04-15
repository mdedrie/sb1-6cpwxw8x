import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';

interface CatalogErrorProps {
  error: string;
  onRetry: () => void;
}

export const CatalogError: React.FC<CatalogErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="p-8 text-center">
      <div className="text-red-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <Button
          onClick={onRetry}
          className="mt-4"
        >
          Réessayer
        </Button>
      </div>
    </div>
  );
};