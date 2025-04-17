import { useState, useCallback } from 'react';
import { useWorkflowApi } from '../../../services/api/hooks';
import type { Column, StepMetadata } from '../../../types';
import { getIdFromRef } from '../../../utils/parameters';

const RESTRICTED_FIRST_POSITION = ['0', 'Fr', '1r'];
const RESTRICTED_LAST_POSITION = ['0', 'Fl', '1l'];

interface ExistingColumn {
  column_order: number;
  column_body_count?: number;
  [key: string]: any;
}

interface UseColumnActionsProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  configId: string | null;
  metadata: StepMetadata | null;
  existingColumns?: ExistingColumn[];
}

export function useColumnActions({
  columns,
  configId,
  metadata,
  existingColumns = []
}: UseColumnActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addColumn } = useWorkflowApi(); // 

  // ... validateColumnPosition, compareColumns, validateAllPositions inchangés

  const validateColumnPosition = useCallback((column: Column, columns: Column[]): string | null => {
    const isFirstPosition = column.position === 1;
    const isLastPosition = column.position === columns.length;
    const designCode = column.design.split('-')[0];

    if (isFirstPosition && RESTRICTED_FIRST_POSITION.includes(designCode)) {
      return `Le design ${designCode} ne peut pas être en première position`;
    }
    if (isLastPosition && RESTRICTED_LAST_POSITION.includes(designCode)) {
      return `Le design ${designCode} ne peut pas être en dernière position`;
    }
    return null;
  }, []);

  const compareColumns = useCallback((newColumn: Column, existingColumn: ExistingColumn): boolean => {
    if (!metadata) return false;
    const parameterCategories = {
      thickness: 'thicknesses',
      inner_height: 'inner_heights',
      inner_width: 'inner_widths',
      inner_depth: 'inner_depths',
      design: 'designs',
      finish: 'finishes',
      door: 'doors',
      two_way_opening: '2ways',
      knob_direction: 'knobs',
      foam_type: 'foams'
    } as const;
    if (newColumn.position !== existingColumn.column_order) return false;
    if ((newColumn.body_count || 1) !== existingColumn.column_body_count) return false;
    for (const [field, category] of Object.entries(parameterCategories)) {
      const newValue = newColumn[field as keyof Column];
      if (!newValue) continue;
      const fieldName = field === 'door' ? 'door_type' : field === 'foam_type' ? 'foam_type' : field;
      const existingId = existingColumn[`column_${fieldName}_id`];
      const newId = getIdFromRef(metadata, category, newValue as string);
      if (existingId !== newId) return false;
    }
    return true;
  }, [metadata]);

  const validateAllPositions = useCallback((columns: Column[]): string | null => {
    for (const column of columns) {
      const err = validateColumnPosition(column, columns);
      if (err) return err;
    }
    return null;
  }, [validateColumnPosition]);

  const handleSaveColumns = useCallback(async () => {
    if (!configId) {
      setError('ID de configuration manquant');
      return false;
    }
    const positionError = validateAllPositions(columns);
    if (positionError) {
      setError(positionError);
      return false;
    }
    const sortedExistingColumns = [...existingColumns].sort((a, b) => a.column_order - b.column_order);
    const hasChanges = columns.some((col, idx) => {
      const existingColumn = sortedExistingColumns[idx];
      return !existingColumn || !compareColumns(col, existingColumn);
    });
    if (!hasChanges) {
      console.log('No changes detected in columns, skipping save');
      return true;
    }

    try {
      setIsSaving(true);
      setError(null);

      const parameterCategories = {
        thickness: 'thicknesses',
        inner_height: 'inner_heights',
        inner_width: 'inner_widths',
        inner_depth: 'inner_depths',
        design: 'designs',
        finish: 'finishes',
        door: 'doors',
        two_way_opening: '2ways',
        knob_direction: 'knobs',
        foam_type: 'foams'
      } as const;

      for (const column of columns) {
        const mappedIds = Object.entries(parameterCategories).reduce((acc, [field, category]) => {
          const value = column[field as keyof Column];
          if (value) {
            const params = metadata?.parameters_by_category?.[category];
            const param = params?.find(p => p.ref === value);
            if (param && typeof param.id === 'number') {
              const fieldName = field === 'door' ? 'door_type' : field === 'foam_type' ? 'foam_type' : field;
              acc[`column_${fieldName}_id`] = param.id;
            }
          }
          return acc;
        }, {} as Record<string, number>);

        const columnData = {
          ...mappedIds,
          column_body_count: column.body_count || 1,
          column_order: column.position,
          configuration_id: configId
        };

        // 🔥 Unifié : toujours addColumn (le back gère create/update)
        await addColumn(configId, columnData);

        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return true;
    } catch (err) {
      console.error('Error saving columns:', err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    configId,
    columns,
    metadata,
    addColumn,
    existingColumns,
    compareColumns,
    validateAllPositions,
  ]);

  return {
    error,
    isSaving,
    handleSaveColumns,
    validateColumnPosition
  };
}