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
    '2ways': 'two_way_opening'
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
  const columnValuesWithDefaults = useMemo(() => {
    return columnValues ? { ...columnValues } : undefined;
  }, [columnValues]);

  const filteredOptions = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options || !isCheckable(parameterType)) {
      return options;
    }

    const normCurrentType = normalizeParameterType(parameterType);

    return options.filter((option) => {
      if (option.ref === currentValue) return true;

      return !Object.entries(columnValuesWithDefaults).some(([key, val]) => {
        if (!val || key === 'body_count') return false;
        const normKey = normalizeParameterType(key);

        const direct = metadata.incompatibilities_by_ref[option.ref]?.[normKey]?.includes(val);
        const reverse = metadata.incompatibilities_by_ref[val]?.[normCurrentType]?.includes(option.ref);

        return direct || reverse;
      });
    });
  }, [metadata, columnValuesWithDefaults, parameterType, options, currentValue]);

  const incompatibilityReasons = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options || !isCheckable(parameterType)) {
      return null;
    }

    const reasons = new Map<string, string>();
    const normType = normalizeParameterType(parameterType);

    for (const option of options) {
      for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
        if (!val || key === 'body_count') continue;

        const normKey = normalizeParameterType(key);
        const direct = metadata.incompatibilities_by_ref[option.ref]?.[normKey]?.includes(val);
        const reverse = metadata.incompatibilities_by_ref[val]?.[normType]?.includes(option.ref);

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

  const incompatibilityDebug = useMemo(() => {
    if (!metadata || !columnValuesWithDefaults || !parameterType || !options || !debugOption) {
      return [];
    }

    const debug: IncompatibilityDebug[] = [];
    const normType = normalizeParameterType(parameterType);
    const target = options.find((o) => o.ref === debugOption);
    if (!target) return [];

    for (const [key, val] of Object.entries(columnValuesWithDefaults)) {
      if (!val || key === 'body_count') continue;

      const normKey = normalizeParameterType(key);

      if (metadata.incompatibilities_by_ref[debugOption]?.[normKey]?.includes(val)) {
        debug.push({
          option: debugOption,
          parameter: key,
          value: val,
          source: 'direct',
          rule: `${debugOption} est incompatible avec ${key} = ${val}`
        });
      }

      if (metadata.incompatibilities_by_ref[val]?.[normType]?.includes(debugOption)) {
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
