import React, { useState, useRef, useEffect } from 'react';
import { FormField, Button } from '../../../../components/ui';
import { ArrowRight, AlertCircle, Info } from 'lucide-react';
import type { Step1FormData } from '../../../../types';

interface BasicInfoStepProps {
  data: Step1FormData;
  onChange: (data: Step1FormData) => void;
  onNext: () => void | Promise<void>;
  loading?: boolean;
  error?: string;
  configId?: string;
  isExistingConfig?: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onChange,
  onNext,
  loading = false,
  error,
  isExistingConfig,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (validationError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [validationError]);

  const validateForm = (): string | null => {
    const name = data.config_name.trim();
    if (!name) return 'Le nom de la configuration est requis.';
    if (name.length < 3) return 'Le nom doit contenir au moins 3 caractères.';
    if (name.length > 100) return 'Le nom ne peut pas dépasser 100 caractères.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const validation = validateForm();
    if (validation) {
      setValidationError(validation);
      return;
    }
    setIsSubmitting(true);
    try {
      await Promise.resolve(onNext());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full space-y-6 px-0 sm:px-4"
      noValidate
      data-testid="basic-info-step-form"
      aria-busy={isSubmitting || loading}
    >
      <div
        id="screen_general_helper"
        className="flex items-center w-full text-gray-600 text-sm gap-2 mb-1"
      >
        <Info className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
        <span>
          Donnez un nom distinctif à votre configuration pour la retrouver facilement.
        </span>
      </div>

      {(validationError || error) && (
        <div
          id="config_name_error"
          ref={errorRef}
          className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center text-red-700 outline-none w-full"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{validationError ?? error}</span>
        </div>
      )}

      <fieldset disabled={isSubmitting || loading} className="border-none p-0 m-0">
        <div className="w-full">
          <FormField
            label="Nom de la configuration"
            id="config_name"
            placeholder="Ex : Standard A1"
            value={data.config_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ ...data, config_name: e.target.value })
            }
            className="w-full transition-all duration-200 focus:ring-2"
            required
            error={validationError ?? error ?? undefined}
            aria-invalid={!!(validationError || error)}
            aria-describedby={[
              (validationError || error) && 'config_name_error',
              'config_name_helper',
              'screen_general_helper'
            ].filter(Boolean).join(' ')}
            autoFocus
          />
          <div
            id="config_name_helper"
            className="text-gray-400 text-xs mt-1 ml-1"
            aria-live="polite"
          >
            3 à 100 caractères.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center w-full bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-all duration-200 gap-2">
          <input
            type="checkbox"
            id="is_catalog"
            checked={data.is_catalog}
            onChange={e =>
              onChange({ ...data, is_catalog: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1 sm:mt-0"
            aria-describedby="is_catalog_helper"
            aria-checked={data.is_catalog}
          />
          <label htmlFor="is_catalog" className="ml-2 text-sm text-gray-700 select-none">
            Cataloguée&nbsp;?
          </label>
          <span
            title="Rendre cette configuration visible dans le catalogue partagé"
            className="inline-block align-middle ml-1"
          >
            <Info className="h-3 w-3 text-blue-300" aria-hidden="true" />
          </span>
          <div
            id="is_catalog_helper"
            className="text-gray-400 text-xs ml-7 sm:ml-2 mt-1"
          >
            Rendez cette configuration visible à tous.
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end w-full mt-8">
        <Button
          type="submit"
          className="flex items-center"
          disabled={isSubmitting || loading}
          aria-label={(isSubmitting || loading) ? 'Chargement...' : 'Suivant'}
        >
          {isSubmitting || loading ? (
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