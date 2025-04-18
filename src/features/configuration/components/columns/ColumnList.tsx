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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <section
        aria-labelledby="column-list-heading"
        className="relative w-full"
      >
        {/* Hidden heading for accessibility */}
        <h2 id="column-list-heading" className="sr-only">
          Liste de colonnes configurables
        </h2>
        {columns.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400 font-medium">
            Aucune colonne ajoutée pour le moment.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto pb-2">
            <div
              role="list"
              className="flex gap-4 w-full min-w-0"
              tabIndex={-1}
            >
              <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <div
                    key={column.id}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`Colonne ${column.position} (${column.design ?? ''})`}
                    className={`min-w-[240px] max-w-[240px] flex-shrink-0
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      focus:outline-none focus:ring-2 focus:ring-indigo-600`}
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
            {/* Gradient de fin pour scroll visuel */}
            <div className="absolute top-0 right-0 h-full w-12 pointer-events-none bg-gradient-to-l from-white to-transparent z-10" />
          </div>
        )}
      </section>
    </DndContext>
  );
};