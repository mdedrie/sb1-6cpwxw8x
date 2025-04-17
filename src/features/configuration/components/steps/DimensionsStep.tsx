import React from 'react';
import { FormField, Button } from '../../../../components/ui';
import { ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import type { Step2FormData } from '../../../../types';

interface DimensionsStepProps {
  data: Step2FormData;
  onChange: (data: Step2FormData) => void;
  onNext: (e: React.FormEvent) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  configId?: string | null;
  isExistingConfig?: boolean;
}

export const DimensionsStep: React.FC<DimensionsStepProps> = ({
  data,
  onChange,
  onNext,
  onBack,
  loading = false,
  configId,
  isExistingConfig = false
}) => {
  return (
    <form onSubmit={onNext} className="space-y-4">
      {(isExistingConfig || configId) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-700">
              {isExistingConfig ? 'Mise à jour des dimensions' : 'Nouvelle configuration'}
            </h4>
            <p className="mt-1 text-sm text-blue-600">
              {isExistingConfig
                ? 'Les dimensions seront mises à jour lors de la configuration des colonnes.'
                : `Configuration créée avec l'identifiant : ${configId}`}
            </p>
          </div>
        </div>
      )}

      <FormField
        label="Description"
        id="configuration_description"
        value={data.configuration_description}
        onChange={(e) =>
          onChange({ ...data, configuration_description: e.target.value })
        }
        placeholder="Décrivez les caractéristiques principales de cette configuration..."
        textarea
        className="transition-all duration-200 focus:ring-2"
        required
        aria-required="true"
        aria-label="Description de la configuration"
      />

      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="secondary"
          className="flex items-center"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button type="submit" className="flex items-center" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
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

export const Step2bisForm = DimensionsStep;
