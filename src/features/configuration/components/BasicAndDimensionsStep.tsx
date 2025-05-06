import React from 'react';
import type { Step1FormData } from '../../../types';

interface BasicAndDimensionsStepProps {
  step1Data: Step1FormData & { configuration_description?: string };
  onStep1Change: (data: Step1FormData & { configuration_description?: string }) => void;
  onNext: () => void;
  loading?: boolean;
}

export const BasicAndDimensionsStep: React.FC<BasicAndDimensionsStepProps> = ({ step1Data, onStep1Change, onNext, loading }) => (
  <form
    onSubmit={e => { e.preventDefault(); onNext(); }}
    className="space-y-8"
  >
    <section className="bg-white p-4 rounded-md border border-gray-100">
      <h3 className="text-base font-semibold mb-2">Informations de base</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="config_name">Nom</label>
          <input
            id="config_name"
            type="text"
            required
            value={step1Data.config_name}
            onChange={e => onStep1Change({ ...step1Data, config_name: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="is_catalog"
            type="checkbox"
            checked={step1Data.is_catalog}
            onChange={e => onStep1Change({ ...step1Data, is_catalog: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="is_catalog" className="text-sm">Est un catalogue ?</label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="configuration_description">Description</label>
          <textarea
            id="configuration_description"
            value={step1Data.configuration_description || ''}
            onChange={e => onStep1Change({ ...step1Data, configuration_description: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm shadow-sm"
          />
        </div>
      </div>
    </section>
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow"
      >
        Continuer
      </button>
    </div>
  </form>
);