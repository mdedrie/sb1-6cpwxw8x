import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ColumnCard } from './ColumnCard';
import type { Column } from '../../../../types';
import { useColumnActions } from '../../hooks/useColumnActions';
import { useToast } from '../../../../components/ui/use-toast';

interface ColumnListProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onEdit: (column: Column) => void;
  onDelete: (id: string) => void;
  onDuplicate: (column: Column) => void;
  viewMode?: 'grid' | 'list';
  disabled?: boolean;
}

export const ColumnList: React.FC<ColumnListProps> = ({
  columns,
  onColumnsChange,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'grid',
  disabled = false,
}) => {
  const { validateColumnPosition } = useColumnActions({
    columns,
    onColumnsChange,
    configId: null,
    metadata: null,
    existingColumns: [],
  });
  const { showToast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.id === active.id);
    const newIndex = columns.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...columns];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const withNewPositions = reordered.map((col, idx) => ({
      ...col,
      position: idx + 1,
    }));
    const error = validateColumnPosition(withNewPositions[newIndex], withNewPositions);
    if (!error) {
      onColumnsChange(withNewPositions);
    } else {
      showToast({
        header: 'Position invalide',
        description: error,
        variant: 'destructive',
      });
    }
  };

  // Responsive : horizontal scroll flex sans chevauchement
  // Chaque carte garde min-w-[170px], pas de grid auto-flow colonne
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <section
        aria-labelledby="column-list-heading"
        className="relative w-full"
        aria-busy={disabled}
      >
        <h2 id="column-list-heading" className="sr-only">
          Colonnes configurables
        </h2>
        {columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 font-medium animate-in fade-in">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M8 7V5a4 4 0 018 0v2" /></svg>
            <span className="text-base">Aucune colonne ajoutée</span>
          </div>
        ) : (
          <div className={columns.length > 5 ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2' : ''}>
            <div
              role="list"
              className="flex gap-2"
              tabIndex={-1}
            >
              <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <div
                    key={column.id}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`Colonne ${column.position} (${column.design ?? ''})`}
                    aria-disabled={disabled}
                    className={`min-w-[170px] max-w-xs flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                  >
                    <ColumnCard
                      column={column}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onEdit={() => onEdit(column)}
                      disabled={disabled}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </SortableContext>
            </div>
            {columns.length > 5 && (
              <div className="absolute top-0 right-0 h-full w-10 pointer-events-none bg-gradient-to-l from-white to-transparent z-10" />
            )}
          </div>
        )}
      </section>
    </DndContext>
  );
};