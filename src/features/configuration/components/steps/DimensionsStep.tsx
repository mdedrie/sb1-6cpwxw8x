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
  loading,
  configId,
  isExistingConfig
}) => {
  const hasDimensions = data.outer_height > 0 || data.outer_width > 0 || data.outer_depth > 0;

  return (
    <form onSubmit={onNext} className="space-y-4">
      {hasDimensions && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Aperçu des dimensions</h4>
          {isExistingConfig && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
              <Info className="h-4 w-4 text-blue-500 mt-1 mr-2" />
              <p className="text-sm text-blue-700">
                Les dimensions seront mises à jour lors de la configuration des colonnes.
              </p>
            </div>
          )}
          {configId && !isExistingConfig && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
              <Info className="h-4 w-4 text-blue-500 mt-1 mr-2" />
              <p className="text-sm text-blue-700">
                Configuration créée avec l'identifiant: {configId}
              </p>
            </div>
          )}
          <div className="relative w-full h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div
              className="absolute bg-indigo-100 border border-indigo-200 rounded transition-all duration-200"
              style={{
                width: `${(data.outer_width / 3) * 100}%`,
                height: `${(data.outer_height / 3) * 100}%`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      )}

      {!hasDimensions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-700">Configuration des dimensions</h4>
            <p className="mt-1 text-sm text-blue-600">
              Les dimensions seront calculées automatiquement lors de la configuration des colonnes.
            </p>
          </div>
        </div>
      )}

      <FormField
        label="Description"
        id="configuration_description"
        value={data.configuration_description}
        onChange={(e) => onChange({ ...data, configuration_description: e.target.value })}
        placeholder="Décrivez les caractéristiques principales de cette configuration..."
        textarea
        className="transition-all duration-200 focus:ring-2"
        required
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