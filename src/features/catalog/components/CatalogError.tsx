import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';

interface CatalogErrorProps {
  error: string;
  onRetry: () => void;
}

export const CatalogError: React.FC<CatalogErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="p-8 text-center" role="alert">
      <div className="text-red-600">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Une erreur est survenue</p>
        <p className="text-sm text-red-500">{error}</p>
        <Button
          onClick={onRetry}
          className="mt-4"
          variant="secondary"
        >
          Réessayer
        </Button>
      </div>
    </div>
  );
};
