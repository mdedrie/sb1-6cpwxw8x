import React from 'react';
import { AlertTriangle, Check, Bug } from 'lucide-react';
import { useCompatibility } from '../../features/configuration/hooks/useCompatibility';
import type { ParameterItem, StepMetadata } from '../../types';
type KnownParameterType =
  | 'thicknesses'
  | 'inner_heights'
  | 'inner_widths'
  | 'inner_depths'
  | 'foams'
  | '2ways'
  | 'doors'
  | 'designs'
  | 'finishes'
  | 'knobs'
  | 'body_count';

interface SelectFieldProps {
  label: string;
  id: string;
  options?: ParameterItem[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  metadata?: StepMetadata | null;
  columnValues?: Record<string, string>;
  parameterType?: KnownParameterType;
}

export function SelectField({ 
  label, 
  id, 
  options, 
  value, 
  onChange,
  disabled,
  metadata,
  columnValues,
  parameterType
}: SelectFieldProps) {
  const [showDebug, setShowDebug] = React.useState(false);
  const [debugOption, setDebugOption] = React.useState<string | null>(null);

  const {
    filteredOptions,
    incompatibilityReasons,
    incompatibilityDebug,
    incompatibleCount
  } = useCompatibility({
    metadata,
    columnValues,
    parameterType,
    options,
    currentValue: value,
    debugOption
  });

  return (
    <div className="relative mb-3 group transition-all duration-200">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        <div className="flex items-center justify-between">
          <span>{label}</span>
          {value && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-white text-indigo-600 border border-indigo-100 flex items-center shadow-sm">
              <Check className="h-3 w-3 mr-1" />
              {value}
            </span>
          )}
        </div>
      </label>
      <div className="relative group">
        <select
          id={id}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
          }}
          className={`mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 sm:text-sm appearance-none bg-white pr-12 transition-all duration-200 
            ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:border-indigo-300'} 
            ${value ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/10 to-transparent' : 'border-gray-200'}
          } h-9`}
          disabled={disabled}
        >
          <option value="" className="text-gray-500">Sélectionnez une option</option>
          {filteredOptions?.map((item) => (
            <option 
              key={item.ref} 
              value={item.ref}
              title={incompatibilityReasons?.get(item.ref)}
              className={`py-1.5 ${value === item.ref ? 'bg-indigo-50 font-medium' : ''} ${
                debugOption === item.ref ? 'bg-amber-50' : ''
              }`}
            >
              {item.ref} - {item.desc}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none mt-1">
          <div className={`p-2 rounded-lg transition-all duration-200 ${
            value ? 'bg-gradient-to-br from-indigo-50 to-white shadow-sm' : 'bg-gray-50'
          }`}>
            <svg className={`h-4 w-4 transition-colors duration-200 ${
              value ? 'text-indigo-500' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
      {incompatibleCount > 0 && (
        <div className="mt-1">
          <div className="text-xs text-amber-600 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {incompatibleCount} option{incompatibleCount > 1 ? 's' : ''} masquée{incompatibleCount > 1 ? 's' : ''} pour incompatibilité
            </div>
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="ml-2 p-1 hover:bg-amber-100 rounded transition-colors duration-200"
              title="Afficher les détails des incompatibilités"
            >
              <Bug className="h-3 w-3" />
            </button>
          </div>
          {showDebug && options && (
            <div className="mt-2 space-y-2">
              {options.map(option => {
                const isIncompatible = !filteredOptions?.find(o => o.ref === option.ref);
                if (!isIncompatible) return null;
                
                return (
                  <button
                    key={option.ref}
                    type="button"
                    onClick={() => setDebugOption(option.ref === debugOption ? null : option.ref)}
                    className={`w-full text-left text-xs p-2 rounded-lg transition-colors duration-200 ${
                      debugOption === option.ref
                        ? 'bg-amber-50 border border-amber-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="font-medium">{option.ref}</div>
                    {debugOption === option.ref && incompatibilityDebug.length > 0 && (
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-200">
                        {incompatibilityDebug.map((debug, idx) => (
                          <div key={idx} className="text-amber-700">
                            {debug.rule}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}