import React from 'react';
import { SelectField } from '../../../../components/ui';
import type { Column, StepMetadata } from '../../../../types';

export interface ColumnFormProps {
  data: Partial<Column>;
  onChange: (data: Partial<Column>) => void;
  metadata: StepMetadata | null;
  mode?: 'edit' | 'create';
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const ColumnForm: React.FC<ColumnFormProps> = ({
  data,
  onChange,
  metadata,
  mode = 'create',
  onSubmit,
  onCancel,
  disabled = false,
}) => {
  const safeColumnValues: Record<string, string> = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v?.toString() ?? ''])
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectField
          label="Épaisseur"
          id="thickness"
          required
          aria-required="true"
          options={metadata?.parameters_by_category?.thicknesses}
          value={data.thickness || ''}
          metadata={metadata}
          columnValues={safeColumnValues}
          parameterType="thicknesses"
          onChange={(v) => onChange({ ...data, thickness: v })}
          disabled={disabled}
        />
        <SelectField
          label="Hauteur"
          id="inner_height"
          required
          aria-required="true"
          options={metadata?.parameters_by_category?.inner_heights}
          value={data.inner_height || ''}
          metadata={metadata}
          columnValues={safeColumnValues}
          parameterType="inner_heights"
          onChange={(v) => onChange({ ...data, inner_height: v })}
          disabled={disabled}
        />
        <SelectField
          label="Largeur"
          id="inner_width"
          required
          aria-required="true"
          options={metadata?.parameters_by_category?.inner_widths}
          value={data.inner_width || ''}
          metadata={metadata}
          columnValues={safeColumnValues}
          parameterType="inner_widths"
          onChange={(v) => onChange({ ...data, inner_width: v })}
          disabled={disabled}
        />
        <SelectField
          label="Profondeur"
          id="inner_depth"
          required
          aria-required="true"
          options={metadata?.parameters_by_category?.inner_depths}
          value={data.inner_depth || ''}
          metadata={metadata}
          columnValues={safeColumnValues}
          parameterType="inner_depths"
          onChange={(v) => onChange({ ...data, inner_depth: v })}
          disabled={disabled}
        />
      </div>

      <SelectField
        label="Design"
        id="design"
        required
        aria-required="true"
        options={metadata?.parameters_by_category?.designs}
        value={data.design || ''}
        metadata={metadata}
        columnValues={safeColumnValues}
        parameterType="designs"
        onChange={(v) => onChange({ ...data, design: v })}
        disabled={disabled}
      />
      <SelectField
        label="Finition"
        id="finish"
        required
        aria-required="true"
        options={metadata?.parameters_by_category?.finishes}
        value={data.finish || ''}
        metadata={metadata}
        columnValues={safeColumnValues}
        parameterType="finishes"
        onChange={(v) => onChange({ ...data, finish: v })}
        disabled={disabled}
      />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase">Configuration de la porte</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Type de porte"
            id="door"
            required
            aria-required="true"
            options={metadata?.parameters_by_category?.doors}
            value={data.door || ''}
            metadata={metadata}
            columnValues={safeColumnValues}
            parameterType="doors"
            onChange={(v) => onChange({ ...data, door: v })}
            disabled={disabled}
          />
          <SelectField
            label="Ouverture"
            id="two_way_opening"
            options={metadata?.parameters_by_category?.['2ways']}
            value={data.two_way_opening || ''}
            metadata={metadata}
            columnValues={safeColumnValues}
            parameterType="2ways"
            onChange={(v) => onChange({ ...data, two_way_opening: v as 'C' | 'G' | 'D' })}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Direction poignée"
            id="knob_direction"
            options={metadata?.parameters_by_category?.knobs}
            value={data.knob_direction || ''}
            metadata={metadata}
            columnValues={safeColumnValues}
            parameterType="knobs"
            onChange={(v) => onChange({ ...data, knob_direction: v as 'C' | 'G' | 'D' })}
            disabled={disabled}
          />
          <div>
            <label htmlFor="body_count" className="block text-xs font-medium text-gray-700">
              Nombre de corps
            </label>
            <input
              id="body_count"
              name="body_count"
              type="number"
              min={1}
              max={10}
              value={data.body_count ?? 1}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...data,
                  body_count: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm h-9"
              aria-required="true"
            />
          </div>
        </div>
      </div>

      <SelectField
        label="Type de mousse"
        id="foam_type"
        options={metadata?.parameters_by_category?.foams}
        value={data.foam_type || ''}
        metadata={metadata}
        columnValues={safeColumnValues}
        parameterType="foams"
        onChange={(v) => onChange({ ...data, foam_type: v })}
        disabled={disabled}
      />

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            formNoValidate
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm"
        >
          {mode === 'edit' ? 'Mettre à jour' : 'Ajouter'} la colonne
        </button>
      </div>
    </form>
  );
};