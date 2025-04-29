import { useMemo } from 'react';
import type { StepMetadata, ParameterItem } from '../../../types';

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

interface IncompatibilityDebug {
  option: string;
  parameter: string;
  value: string;
  source: 'direct' | 'reverse';
  rule: string;
}

interface UseCompatibilityProps {
  metadata: StepMetadata | null;
  columnValues: Record<string, string> | undefined;
  parameterType: KnownParameterType | undefined;
  options: ParameterItem[] | undefined;
  currentValue: string;
  debugOption: string | null;
}

const normalizeParameterType = (type: string): string => {
  const map: Record<string, string> = {
    thicknesses: 'thickness',
    inner_heights: 'inner_height',
    inner_widths: 'inner_width',
    inner_depths: 'inner_depth',
    foams: 'foam_type',
    '2ways': 'two_way_opening',
  };
  return map[type] ?? type;
};

const isCheckable = (type?: KnownParameterType): boolean => type !== 'body_count' && !!type;

export function useCompatibility({
  metadata,
  columnValues,
  parameterType,
  options,
  currentValue,
  debugOption
}: UseCompatibilityProps) {
  // Mémoïsation défensive
  const columnValuesWithDefaults = useMemo(() => (
    columnValues ? { ...columnValues } : undefined
  ), [columnValues]);

  // Filtrage dynamique des options selon table d'incompatibilité
  const filteredOptions = useMemo<ParameterItem[] | undefined>(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options?.length || !isCheckable(parameterType)) {
      return options;
    }
    const normCurrentType = normalizeParameterType(parameterType);
    return options.filter((option) => {
      if (option.ref === currentValue) return true;

      return !Object.entries(columnValuesWithDefaults).some(([key, val]) => {
        if (!val || key === 'body_count') return false;
        const normKey = normalizeParameterType(key);

        const directArr = metadata.incompatibilities_by_ref[option.ref]?.[normKey];
        const reverseArr = metadata.incompatibilities_by_ref[val]?.[normCurrentType];

        const direct = !!(directArr && Array.isArray(directArr) && directArr.includes(val));
        const reverse = !!(reverseArr && Array.isArray(reverseArr) && reverseArr.includes(option.ref));

        return direct || reverse;
      });
    });
  }, [metadata, columnValuesWithDefaults, parameterType, options, currentValue]);

  // Raison textuelle pour chaque option incompatible
  const incompatibilityReasons = useMemo((): Map<string, string> | null => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options?.length || !isCheckable(parameterType)) {
      return null;
    }

    const reasons = new Map<string, string>();
    const normType = normalizeParameterType(parameterType);

    for (const option of options) {
      for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
        if (!val || key === 'body_count') continue;

        const normKey = normalizeParameterType(key);
        const directArr = metadata.incompatibilities_by_ref[option.ref]?.[normKey];
        const reverseArr = metadata.incompatibilities_by_ref[val]?.[normType];

        const direct = !!(directArr && Array.isArray(directArr) && directArr.includes(val));
        const reverse = !!(reverseArr && Array.isArray(reverseArr) && reverseArr.includes(option.ref));

        if (direct) {
          reasons.set(option.ref, `Incompatible avec ${key} (${val})`);
          break;
        }
        if (reverse) {
          reasons.set(option.ref, `${key} (${val}) est incompatible`);
          break;
        }
      }
    }

    return reasons;
  }, [metadata, columnValuesWithDefaults, parameterType, options]);

  // Mode debug : détails des règles qui s'appliquent à une option spécifique
  const incompatibilityDebug = useMemo<IncompatibilityDebug[]>(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options?.length || !debugOption) {
      return [];
    }

    const debug: IncompatibilityDebug[] = [];
    const normType = normalizeParameterType(parameterType);
    const target = options.find((o) => o.ref === debugOption);
    if (!target) return [];

    for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
      if (!val || key === 'body_count') continue;

      const normKey = normalizeParameterType(key);
      const directArr = metadata.incompatibilities_by_ref[debugOption]?.[normKey];
      const reverseArr = metadata.incompatibilities_by_ref[val]?.[normType];

      if (directArr && Array.isArray(directArr) && directArr.includes(val)) {
        debug.push({
          option: debugOption,
          parameter: key,
          value: val,
          source: 'direct',
          rule: `${debugOption} est incompatible avec ${key} = ${val}`
        });
      }

      if (reverseArr && Array.isArray(reverseArr) && reverseArr.includes(debugOption)) {
        debug.push({
          option: debugOption,
          parameter: key,
          value: val,
          source: 'reverse',
          rule: `${key} = ${val} est incompatible avec ${debugOption}`
        });
      }
    }

    return debug;
  }, [metadata, columnValuesWithDefaults, parameterType, options, debugOption]);

  // UI : nombre d’options non présentées à cause d'une incompatibilité
  const incompatibleCount = useMemo(() => {
    return options && filteredOptions ? options.length - filteredOptions.length : 0;
  }, [options, filteredOptions]);

  return {
    filteredOptions,
    incompatibilityReasons,
    incompatibilityDebug,
    incompatibleCount
  };
}