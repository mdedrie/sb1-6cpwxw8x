import React, { useState } from 'react';
import { FormField, Button } from '../../../../components/ui';
import { ArrowRight, AlertCircle } from 'lucide-react';
import type { Step1FormData } from '../../../../types';

interface BasicInfoStepProps {
  data: Step1FormData;
  onChange: (data: Step1FormData) => void;
  onNext: () => void;
  configId?: string;
  isExistingConfig?: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onChange,
  onNext,
  isExistingConfig,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): string | null => {
    const name = data.config_name.trim();
    if (!name) return 'Le nom de la configuration est requis';
    if (name.length < 3) return 'Le nom doit contenir au moins 3 caractères';
    if (name.length > 100) return 'Le nom ne peut pas dépasser 100 caractères';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateForm();
    if (validation) {
      setValidationError(validation);
      return;
    }

    setIsSubmitting(true);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{validationError}</p>
        </div>
      )}

      <FormField
        label="Nom de la configuration"
        id="config_name"
        placeholder="Ex : Configuration Standard A1"
        value={data.config_name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange({ ...data, config_name: e.target.value })
        }
        className="transition-all duration-200 focus:ring-2"
        required
        error={validationError ?? undefined}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? 'config_name_error' : undefined}
      />

      <div className="flex items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200">
        <input
          type="checkbox"
          id="is_catalog"
          checked={data.is_catalog}
          onChange={(e) => onChange({ ...data, is_catalog: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="is_catalog" className="ml-2 text-sm text-gray-600">
          Cataloguée ?
        </label>
        <span className="ml-auto text-xs text-gray-500">
          Visible dans le catalogue public
        </span>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          type="submit"
          className="flex items-center"
          disabled={isSubmitting}
          aria-label={isSubmitting ? 'Chargement...' : 'Suivant'}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              {isExistingConfig ? 'Mise à jour...' : 'Chargement...'}
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export const Step1Form = BasicInfoStep;
