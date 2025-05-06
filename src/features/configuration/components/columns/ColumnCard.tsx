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
  <div className="flex items-center justify-between text-[13px]">
    <span className="text-gray-400 font-medium">{label}</span>
    <code className="ml-2 text-xs font-bold bg-gray-50 px-2 py-0.5 rounded text-gray-700 tracking-tight border border-gray-100">
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
    className={`transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 rounded-full p-1.5 ${
      disabled
        ? 'opacity-30 cursor-not-allowed'
        : variant === 'danger'
        ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
        : 'text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700'
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
    opacity: isDragging ? 0.87 : 1
  };

  const formatValue = (value: string | undefined, type: string): string => {
    if (!value) return '—';
    if (type === 'direction') return directionMap[value] || value;
    return value;
  };

  const imageSrc = getDesignImage(column.design);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white border border-gray-100 hover:border-indigo-300 shadow-lg hover:shadow-2xl rounded-2xl transition-all mb-3 duration-200 flex flex-col ${isDragging ? 'ring-2 ring-indigo-400 rotate-2 scale-105' : ''} ${viewMode === 'grid' ? 'w-[310px] p-5' : 'p-3 w-full max-w-2xl mx-auto'}`}
      {...attributes}
    >
      <div className={`${viewMode === 'grid' ? 'aspect-[4/5] mb-4' : 'w-28 h-28 float-left mr-6'} bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden relative group`}
        role={column.design ? "img" : undefined}
        aria-label={column.design ? `Aperçu du design ${column.design}` : undefined}
      >
        {column.design ? (
          <img
            src={imageSrc}
            alt={`Design ${column.design}`}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Design non disponible</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-80">
          <span className="bg-indigo-600/80 text-white text-[10px] px-2 py-1 rounded shadow font-medium select-none uppercase">{column.design || 'N/A'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 mt-0.5">
        <div className="flex items-center gap-2">
          <div {...dragListeners} className={`cursor-grab ${disabled ? "cursor-not-allowed" : "active:cursor-grabbing"}`} title="Déplacer la colonne">
            <GripVertical className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-xs font-semibold text-indigo-600 tracking-wide bg-indigo-50 px-2 py-0.5 rounded-full">
            Colonne {column.position}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
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

      <div className="text-[13px] divide-y divide-dashed divide-gray-100">
        <section className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Dimensions</h4>
          <Field label="Épaisseur" value={column.thickness} />
          <Field label="Hauteur" value={column.inner_height} />
          <Field label="Largeur" value={column.inner_width} />
          <Field label="Profondeur" value={column.inner_depth} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Apparence</h4>
          <Field label="Design" value={column.design} />
          <Field label="Finition" value={column.finish} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Porte</h4>
          <Field label="Type" value={column.door} />
          <Field label="Ouverture" value={formatValue(column.two_way_opening, 'direction')} />
          <Field label="Poignée" value={formatValue(column.knob_direction, 'direction')} />
        </section>

        <section className="space-y-2 py-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Options</h4>
          <Field label="Mousse" value={formatValue(column.foam_type, 'foam')} />
          <Field label="Corps" value={column.body_count || 1} />
        </section>
      </div>
    </div>
  );
};