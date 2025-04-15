import React, { useState } from 'react';
import {
  Plus,
  Box as Box3d,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ColumnForm } from '../columns/ColumnForm';
import { ColumnList } from '../columns/ColumnList';
import { ColumnPreview } from '../columns/ColumnPreview';
import type { Column, StepMetadata } from '../../../../types';

interface ColumnsStepProps {
  columns: Column[];
  metadata: StepMetadata | null;
  onColumnsChange: (columns: Column[]) => void;
}

export const ColumnsStep: React.FC<ColumnsStepProps> = ({
  columns,
  metadata,
  onColumnsChange,
}) => {
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [editingColumn, setEditingColumn] = useState<Partial<Column> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      editingColumn?.thickness &&
      editingColumn.inner_height &&
      editingColumn.inner_width &&
      editingColumn.inner_depth &&
      editingColumn.design &&
      editingColumn.finish &&
      editingColumn.door
    ) {
      const newColumn = editingColumn as Column;
      const updatedColumns = editingColumn.id
        ? columns.map((col) => (col.id === editingColumn.id ? newColumn : col))
        : [...columns, newColumn];

      onColumnsChange(updatedColumns);
      setEditingColumn(null);
      setIsFormCollapsed(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
    setIsFormCollapsed(false);
  };

  return (
    <div>
      <div className="flex flex-col xl:flex-row relative min-h-[600px]">
        <div
          className={`flex-1 transition-all duration-300 ease-in-out relative ${
            isFormCollapsed ? 'xl:ml-0' : 'xl:ml-[400px]'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-gray-900 flex items-center">
              <Box3d className="h-5 w-5 text-indigo-600 mr-2" />
              Colonnes
            </h4>
          </div>

          <ColumnPreview columns={columns} metadata={metadata} />

          <ColumnList
            columns={columns}
            onColumnsChange={onColumnsChange}
            onEdit={(column) => {
              setEditingColumn(column);
              setIsFormCollapsed(false);
            }}
            onDelete={(id) => {
              const updated = columns.filter((c) => c.id !== id);
              onColumnsChange(updated);
            }}
            onDuplicate={(column) => {
              const duplicate = { ...column, id: crypto.randomUUID() };
              onColumnsChange([...columns, duplicate]);
            }}
            viewMode={viewMode}
          />
        </div>

        <div
          className={`fixed left-0 top-0 h-full w-[400px] bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
            isFormCollapsed ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <button
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="absolute -right-10 top-1/2 -translate-y-1/2 z-10 bg-white rounded-r-lg p-2 shadow-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 group"
            title={isFormCollapsed ? 'Ouvrir le panneau' : 'Fermer le panneau'}
          >
            {isFormCollapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
            )}
          </button>

          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center">
                <Plus className="h-5 w-5 text-indigo-600 mr-2" />
                <h4 className="text-base font-semibold text-gray-900">
                  {editingColumn?.id ? 'Modifier la colonne' : 'Nouvelle colonne'}
                </h4>
              </div>
              <button
                onClick={() => setIsFormCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ColumnForm
                data={editingColumn || {}}
                metadata={metadata}
                onSubmit={handleSubmit}
                onCancel={editingColumn ? handleCancelEdit : undefined}
                onChange={(updated) =>
                  setEditingColumn({
                    ...(editingColumn || {
                      id: crypto.randomUUID(),
                      position: columns.length + 1,
                    }),
                    ...updated,
                  })
                }
                disabled={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
