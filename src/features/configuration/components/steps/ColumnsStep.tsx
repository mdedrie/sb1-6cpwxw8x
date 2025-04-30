import React, { useState, useRef } from 'react';
import { Plus, Box as Box3d, ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { ColumnForm } from '../columns/ColumnForm';
import { ColumnList } from '../columns/ColumnList';
import { ColumnPreview } from '../columns/ColumnPreview';
import { useColumnActions } from '../../hooks/useColumnActions';
import type { Column, StepMetadata, Step2bisFormData } from '../../../../types';

type ExistingColumn = Column & { column_order: number };

interface ColumnsStepProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  configId: string | null;
  existingColumns?: ExistingColumn[];
  columnData: Step2bisFormData;
  onColumnDataChange: (data: Step2bisFormData) => void;
  metadata: StepMetadata | null;
  onAddColumn: () => void | Promise<void>;
  onDeleteColumn: (id: string) => void;
  onDuplicateColumn: (column: Column) => void;
  onBack: () => void;
  onSave: () => void | Promise<void>;
  loading?: boolean;
  isSaving?: boolean;
  error?: string | null;
}

const MAX_COLUMNS = 15;

export const ColumnsStep: React.FC<ColumnsStepProps> = ({
  columns,
  configId,
  existingColumns = [],
  onColumnsChange,
  columnData,
  onColumnDataChange,
  metadata,
  onAddColumn,
  onDeleteColumn,
  onDuplicateColumn,
  onBack,
  onSave,
  loading,
  isSaving: externalIsSaving,
  error: externalError
}) => {
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { handleSaveColumns, error: saveError, isSaving: internalIsSaving } = useColumnActions({
    columns,
    onColumnsChange,
    configId,
    metadata,
    existingColumns
  });

  const handleSave = async () => {
    try {
      const success = await handleSaveColumns();
      if (success) {
        await onSave();
      }
    } catch (err) {
      console.error('Failed to save columns:', err);
    }
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    onColumnDataChange({
      thickness: column.thickness ?? '',
      inner_height: column.inner_height ?? '',
      inner_width: column.inner_width ?? '',
      inner_depth: column.inner_depth ?? '',
      design: column.design ?? '',
      finish: column.finish ?? '',
      door: column.door ?? '',
      two_way_opening: column.two_way_opening as 'C' | 'G' | 'D',
      knob_direction: column.knob_direction as 'C' | 'G' | 'D',
      foam_type: column.foam_type ?? '',
      body_count: typeof column.body_count === 'number' ? column.body_count : parseInt(column.body_count ?? '0', 10),
    });
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    onColumnDataChange({
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
      body_count: 0,
    });
  };

  const handleSubmit = () => {
    if (editingColumn) {
      const updatedColumns = columns.map(col =>
        col.id === editingColumn.id ? { ...col, ...columnData } : col
      );
      onColumnsChange(updatedColumns);
      handleCancelEdit();
    } else {
      onAddColumn();
    }
  };

  const isSavingState = externalIsSaving || internalIsSaving;
  const errorMessage = externalError || saveError;

  return (
    <div className="space-y-8" aria-busy={loading || isSavingState}>
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-base font-semibold text-gray-900 flex items-center">
                <Box3d className="h-5 w-5 text-indigo-600 mr-2" />
                Colonnes
              </h4>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors duration-200 ${
                  columns.length >= MAX_COLUMNS
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {columns.length}/{MAX_COLUMNS}
              </span>
            </div>
          </div>
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}
          <ColumnPreview columns={columns} metadata={metadata} />
          {columns.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <Box3d className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune colonne</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Commencez par ajouter une colonne en utilisant le formulaire
                </p>
                <Button
                  type="button"
                  onClick={() =>
                    !editingColumn && formRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                  disabled={!!editingColumn}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter une colonne
                </Button>
              </div>
            </div>
          ) : (
            <ColumnList
              columns={columns}
              onColumnsChange={onColumnsChange}
              onEdit={handleEditColumn}
              onDelete={onDeleteColumn}
              onDuplicate={onDuplicateColumn}
              viewMode={viewMode}
              disabled={columns.length >= MAX_COLUMNS}
            />
          )}
        </div>
        <div className="xl:w-96 flex-shrink-0">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-base font-semibold text-gray-900 flex items-center mb-6">
                <Plus className="h-5 w-5 text-indigo-600 mr-2" />
                {editingColumn ? 'Modifier la colonne' : 'Nouvelle colonne'}
              </h4>
              <div id="column-form" ref={formRef}>
                <ColumnForm
                  data={columnData}
                  onChange={(partial) =>
                    onColumnDataChange({
                      ...columnData,
                      ...partial,
                    } as Step2bisFormData)
                  }
                  metadata={metadata}
                  mode={editingColumn ? 'edit' : 'create'}
                  onSubmit={handleSubmit}
                  onCancel={editingColumn ? handleCancelEdit : undefined}
                  disabled={loading || isSavingState}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-8 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onBack}
          className="flex items-center"
          disabled={loading || isSavingState}
          type="button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSave}
            type="button"
            className="flex items-center"
            disabled={loading || isSavingState}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSavingState ? 'Enregistrement...' : 'Enregistrer et continuer'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Step2bisForm = ColumnsStep;