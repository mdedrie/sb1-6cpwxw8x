import { useState, useCallback } from 'react';
import type { Column, Step2bisFormData } from '../../../types';

const emptyColumnData: Step2bisFormData = {
  thickness: '',
  inner_height: '',
  inner_width: '',
  inner_depth: '',
  design: '',
  finish: '',
  door: '',
  two_way_opening: 'C',
  knob_direction: 'C',
  foam_type: '',
};

export function useColumnForm(onColumnsChange: (columns: Column[]) => void) {
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [columnData, setColumnData] = useState<Step2bisFormData>({ ...emptyColumnData });
  const [formError, setFormError] = useState<string | null>(null);

  // Mémorisation pour best-practices si utilisé comme callback descendant :
  const resetForm = useCallback(() => {
    setColumnData({ ...emptyColumnData });
    setEditingColumn(null);
    setFormError(null);
  }, []);

  // Permet un feedback plus précis si besoin
  const validateColumnData = useCallback((): boolean => {
    const requiredFields: (keyof Step2bisFormData)[] = [
      'thickness',
      'inner_height',
      'design',
      'door',
    ];
    for (const field of requiredFields) {
      if (!columnData[field]) {
        setFormError('Tous les champs obligatoires ne sont pas remplis.');
        return false;
      }
    }
    setFormError(null);
    return true;
  }, [columnData]);

  const handleAddColumn = useCallback((columns: Column[]) => {
    if (!validateColumnData()) return;

    const newColumn: Column = {
      id: crypto.randomUUID(),
      ...columnData,
      position: columns.length + 1
    };

    onColumnsChange([...columns, newColumn]);
    resetForm();
  }, [columnData, onColumnsChange, resetForm, validateColumnData]);

  const handleUpdateColumn = useCallback((columns: Column[]) => {
    if (!editingColumn) return;

    const updatedColumns = columns.map((col) =>
      col.id === editingColumn.id ? { ...col, ...columnData } : col
    ).map((col, idx) => ({ ...col, position: idx + 1 }));

    onColumnsChange(updatedColumns);
    resetForm();
  }, [editingColumn, columnData, onColumnsChange, resetForm]);

  const handleDeleteColumn = useCallback((columns: Column[], id: string) => {
    const updatedColumns = columns
      .filter(col => col.id !== id)
      .map((col, idx) => ({ ...col, position: idx + 1 }));

    onColumnsChange(updatedColumns);
    if (editingColumn?.id === id) resetForm();
  }, [onColumnsChange, editingColumn, resetForm]);

  const handleDuplicateColumn = useCallback((columns: Column[], column: Column) => {
    const newColumn: Column = {
      ...column,
      id: crypto.randomUUID(),
      position: columns.length + 1
    };

    onColumnsChange([...columns, newColumn]);
  }, [onColumnsChange]);

  return {
    editingColumn,
    setEditingColumn,
    columnData,
    setColumnData,
    formError,
    setFormError,
    handleAddColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleDuplicateColumn,
    resetForm,
  };
}