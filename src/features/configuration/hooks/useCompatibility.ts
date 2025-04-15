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
  const mapping: Record<string, string> = {
    thicknesses: 'thickness',
    inner_heights: 'inner_height',
    inner_widths: 'inner_width',
    inner_depths: 'inner_depth',
    foams: 'foam_type',
    '2ways': 'two_way_opening'
  };
  return mapping[type] || type;
};

const shouldCheckIncompatibilities = (parameterType?: KnownParameterType): boolean => {
  return parameterType !== undefined && parameterType !== 'body_count';
};

export function useCompatibility({
  metadata,
  columnValues,
  parameterType,
  options,
  currentValue,
  debugOption
}: UseCompatibilityProps) {
  const columnValuesWithDefaults = useMemo(() => {
    if (!columnValues) return undefined;
    return { ...columnValues };
  }, [columnValues]);

  const filteredOptions = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options) return options;
    if (!shouldCheckIncompatibilities(parameterType)) return options;

    const normalizedCurrentType = normalizeParameterType(parameterType);

    return options.filter(option => {
      if (option.ref === currentValue) return true;

      for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
        if (!val || key === 'body_count') continue;

        const normalizedKey = normalizeParameterType(key);

        const directConflict = metadata.incompatibilities_by_ref[option.ref]?.[normalizedKey]?.includes(val);
        const reverseConflict = metadata.incompatibilities_by_ref[val]?.[normalizedCurrentType]?.includes(option.ref);

        if (directConflict || reverseConflict) return false;
      }

      return true;
    });
  }, [metadata, columnValuesWithDefaults, parameterType, options, currentValue]);

  const incompatibilityReasons = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options) return null;
    if (!shouldCheckIncompatibilities(parameterType)) return null;

    const normalizedCurrentType = normalizeParameterType(parameterType);
    const reasons = new Map<string, string>();

    options.forEach(option => {
      for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
        if (!val || key === 'body_count') continue;

        const normalizedKey = normalizeParameterType(key);

        const directConflict = metadata.incompatibilities_by_ref[option.ref]?.[normalizedKey]?.includes(val);
        const reverseConflict = metadata.incompatibilities_by_ref[val]?.[normalizedCurrentType]?.includes(option.ref);

        if (directConflict) {
          reasons.set(option.ref, `Incompatible avec ${key} (${val})`);
          break;
        }
        if (reverseConflict) {
          reasons.set(option.ref, `${key} (${val}) est incompatible`);
          break;
        }
      }
    });

    return reasons;
  }, [metadata, columnValuesWithDefaults, parameterType, options]);

  const incompatibilityDebug = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options || !debugOption) return [];

    const debug: IncompatibilityDebug[] = [];
    const normalizedType = normalizeParameterType(parameterType);
    const option = options.find(o => o.ref === debugOption);

    if (!option) return [];

    Object.entries(columnValuesWithDefaults).forEach(([key, val]) => {
      if (!val || key === 'body_count') return;

      const normalizedKey = normalizeParameterType(key);

      if (metadata.incompatibilities_by_ref[option.ref]?.[normalizedKey]?.includes(val)) {
        debug.push({
          option: option.ref,
          parameter: key,
          value: val,
          source: 'direct',
          rule: `${option.ref} est incompatible avec ${key} = ${val}`
        });
      }

      if (metadata.incompatibilities_by_ref[val]?.[normalizedType]?.includes(option.ref)) {
        debug.push({
          option: option.ref,
          parameter: key,
          value: val,
          source: 'reverse',
          rule: `${key} = ${val} est incompatible avec ${option.ref}`
        });
      }
    });

    return debug;
  }, [metadata, columnValuesWithDefaults, parameterType, options, debugOption]);

  const incompatibleCount = useMemo(() => {
    if (!options || !filteredOptions) return 0;
    return options.length - filteredOptions.length;
  }, [options, filteredOptions]);

  return {
    filteredOptions,
    incompatibilityReasons,
    incompatibilityDebug,
    incompatibleCount
  };
}
