export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  status: number;
}

// ─────────────────────────────────────────────
// Structure d'une colonne dans l'interface
export interface Column {
  id: string;
  position: number;

  // Paramètres sélectionnés (refs)
  thickness: string;
  inner_height: string;
  inner_width: string;
  inner_depth: string;
  design: string;
  finish: string;
  door: string;
  two_way_opening?: string;
  knob_direction?: string;
  foam_type?: string;

  body_count?: number;
}

// ─────────────────────────────────────────────
// Structure utilisée dans les formulaires de création/édition de colonnes
export type Step2bisFormData = Partial<Omit<Column, 'id' | 'position'>>;

// ─────────────────────────────────────────────
// Représente un paramètre venant du backend
export interface ParameterItem {
  id: number;
  ref: string;
  value: string;
  desc?: string;
  dim?: number;
  infos?: Record<string, any>;
  image?: string;
  has_image?: boolean;
  is_compatible_with?: Record<string, string[]>;
}

// ─────────────────────────────────────────────
// Métadonnées complètes reçues du backend
export interface StepMetadata {
  categories: string[];
  parameters_by_category: Record<string, ParameterItem[]>;
  parameters_by_id: Record<string, ParameterItem>;
  compatibilities_by_parameter: Record<string, Record<string, string[]>>;
  compatibilities_by_ref: Record<string, Record<string, string[]>>;
  incompatibilities_by_ref: Record<string, Record<string, string[]>>;
  parameter_index: Record<string, { ref: string; category: string }>;
  valid_dimensions: number[];
  last_updated: string;
  step_filters: Record<string, string[]>;
}
