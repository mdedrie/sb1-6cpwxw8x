import React, { FC } from 'react';
import {
  GripVertical, Trash2, Copy, Pencil
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column } from '../../../../types';
import { getDesignImage } from '../../../../utils/getDesignImage';

const directionMap: Record<string, string> = {
  C: 'Centre',
  G: 'Gauche',
  D: 'Droite',
  N: 'Non applicable'
} as const;

interface FieldProps {
  label: string;
  value: React.ReactNode;
}

const Field: FC<FieldProps> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <code className="ml-2 text-xs font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-700">
      {value}
    </code>
  </div>
);

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

const ActionButton: FC<ActionButtonProps> = ({ onClick, icon, label, disabled, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={`text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 rounded ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : variant === 'danger'
        ? 'hover:text-red-500'
        : 'hover:text-indigo-500'
    }`}
    disabled={disabled}
    aria-label={label}
    title={label}
    type="button"
  >
    {icon}
  </button>
);

interface ColumnCardProps {
  column: Column;
  onDelete: (id: string) => void;
  onDuplicate: (column: Column) => void;
  onEdit: (column: Column) => void;
  disabled?: boolean;
  viewMode?: 'grid' | 'list';
}

export const ColumnCard: FC<ColumnCardProps> = ({
  column,
  onDelete,
  onDuplicate,
  onEdit,
  disabled,
  viewMode = 'grid'
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const dragListeners = disabled ? {} : listeners;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  const formatValue = (value: string | undefined, type: string): string => {
    if (!value) return '—';
    if (type === 'direction') return directionMap[value] || value;
    return value;
  };

  // Utilise l'image locale correspondant au design
  const imageSrc = getDesignImage(column.design);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 ${
        isDragging ? 'ring-2 ring-indigo-500 ring-opacity-50 rotate-2 scale-105' : ''
      } ${viewMode === 'grid' ? 'w-[280px] p-4' : 'p-3 w-full max-w-2xl mx-auto'}`}
      {...attributes}
    >
      <div
        className={`${
          viewMode === 'grid' ? 'aspect-[3/4] mb-4' : 'w-32 h-32 float-left mr-6'
        } bg-gray-100 rounded-lg overflow-hidden relative group`}
        role={column.design ? "img" : undefined}
        aria-label={column.design ? `Aperçu du design ${column.design}` : undefined}
      >
        {column.design ? (
          <img
            src={imageSrc}
            alt={`Design ${column.design}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Design non disponible</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center p-2 transition-opacity duration-300">
          <span className="text-white text-sm truncate">{column.design || "Non renseigné"}</span>
        </div>
      </div>

      <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mb-4' : 'mb-2'}`}>
        <div className="flex items-center gap-2">
          <div {...dragListeners} className={`cursor-grab ${disabled ? "cursor-not-allowed" : ""}`} title="Déplacer la colonne">
            <GripVertical className="h-5 w-5 text-gray-400 hover:text-indigo-500 transition-colors duration-200" />
          </div>
          <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
            Colonne {column.position}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => onDuplicate(column)}
            icon={<Copy className="h-4 w-4" />}
            label="Dupliquer la colonne"
            disabled={disabled}
          />
          <ActionButton
            onClick={() => onEdit(column)}
            icon={<Pencil className="h-4 w-4" />}
            label="Modifier la colonne"
            disabled={disabled}
          />
          <ActionButton
            onClick={() => column.id && onDelete(column.id)}
            icon={<Trash2 className="h-4 w-4" />}
            label="Supprimer la colonne"
            variant="danger"
            disabled={disabled || !column.id}
          />
        </div>
      </div>

      <div className={`text-sm divide-y divide-gray-100 ${viewMode === 'list' ? 'clear-both' : ''}`}>
        <section className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Dimensions</h4>
          <Field label="Épaisseur" value={column.thickness} />
          <Field label="Hauteur" value={column.inner_height} />
          <Field label="Largeur" value={column.inner_width} />
          <Field label="Profondeur" value={column.inner_depth} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Apparence</h4>
          <Field label="Design" value={column.design} />
          <Field label="Finition" value={column.finish} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Porte</h4>
          <Field label="Type" value={column.door} />
          <Field label="Ouverture" value={formatValue(column.two_way_opening, 'direction')} />
          <Field label="Poignée" value={formatValue(column.knob_direction, 'direction')} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Options</h4>
          <Field label="Mousse" value={formatValue(column.foam_type, 'foam')} />
          <Field label="Corps" value={column.body_count || 1} />
        </section>
      </div>
    </div>
  );
};