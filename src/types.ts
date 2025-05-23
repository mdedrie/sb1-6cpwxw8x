// Coordonnée 3D
export type Coord3 = [number, number, number];

// Réutilisé à plusieurs endroits
export type ReverseCompatibilities = {
  [key: string]: {
    [key: string]: {
      [key: string]: string[];
    };
  };
};

// ------------------------------
// PARAMÉTRAGE ET MÉTADATA
// ------------------------------

export interface ParameterItem {
  id: number;
  ref: string;
  desc: string;
  dim?: number;
}

export interface StepMetadata {
  parameters_by_category: {
    thicknesses: ParameterItem[];
    inner_heights: ParameterItem[];
    designs: ParameterItem[];
    doors: ParameterItem[];
    "2ways": ParameterItem[];
    knobs: ParameterItem[];
    finishes: ParameterItem[];
    foams: ParameterItem[];
    inner_widths: ParameterItem[];
    inner_depths: ParameterItem[];
  };
  incompatibilities_by_ref: Record<string, Record<string, string[]>>;
  compatibilities_by_parameter: Record<string, Record<string, Record<string, string[]>>>;
  incompatibilities_by_parameter: Record<string, Record<string, Record<string, string[]>>>;
  reverse_compatibilities: ReverseCompatibilities;
}

// ------------------------------
// GÉOMÉTRIE
// ------------------------------

export interface Edge {
  type: 'vertical' | 'horizontal';
  position?: string;
  height?: number;
  length?: number;
  coords: Coord3[];
  orientation?: string;
  junctionType?: string;
  isShared?: boolean;
}

export interface Part {
  x: number;
  y_start_m: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  part_uid?: string | number;
  column_order?: number;
  column_ref?: string;
  column_description?: string;
  face_left?: string;
  face_right?: string;
  face_top?: string;
  face_bottom?: string;
  face_back?: string;
  face_front?: string;
  volume_id?: string;
  edges?: Edge[];
  position?: { x: number; y: number; z: number };
  dimensions?: { width: number; height: number; depth: number };
  column_type?: string; // utilisé pour la nomenclature
  reverse_compatibilities?: ReverseCompatibilities;
}

// ------------------------------
// MODÉLISATION ET FORMULAIRES
// ------------------------------

export type Temperature = 'positive' | 'negative';

export interface Corner {
  id: string;
  position: 'left' | 'right';
  type: 'angle' | 't_section';
  height: number;
  finish: string;
}

export interface Step5FormData {
  corners: Corner[];
}

export interface Configuration {
  id?: string;
  name?: string;
  status: 'draft' | 'complete';
  is_catalog: boolean;
  description?: string;
  tags?: string[];
  created_at: string;
  user_id?: string | null;
  buy_price: number | null;
  sell_price: number | null;
  dimensions?: {
    outer_height?: number;
    outer_width?: number;
    outer_depth?: number;
  } | null;
}

export type StepStatus = 'current' | 'complete' | 'upcoming';

export type Step1FormData = {
  config_name: string;
  is_catalog: boolean;
  configuration_description?: string;
}

export interface Step2FormData {
  outer_height: number;
  outer_width: number;
  outer_depth: number;
  configuration_description: string;
}

export interface Step2bisFormData {
  thickness: string;
  inner_height: string;
  inner_width: string;
  inner_depth: string;
  design: string;
  finish: string;
  door: string;
  two_way_opening: 'C' | 'G' | 'D';
  knob_direction: 'C' | 'G' | 'D';
  foam_type: string;
  body_count?: number;
}

export interface ModelingData {
  shapes: Shape[];
  selectedVolumes?: Record<number, Temperature>;
}

export interface ShapeParameter {
  id: number;
  parameterRef: string;
  parameterValue: string;
  parameterCategory: string;
  parameterDimension: number | null;
  parameterDescription: string;
  parameterAdditionalInfo: Record<string, any>;
}

export interface Shape {
  order: number;
  parameters: {
    depth: number;
    width: number;
    height: number;
  };
  body_count: number;
  description: string;
  parts: {
    index: number;
    height: number;
    volume: number;
    volume_id: string;
    addleft: boolean;
    y_start: number;
    addright: boolean;
    can_merge: boolean;
    merge_group_id: number;
    merge_direction: 'none' | 'source' | 'target';
    merge_group_volume_m3: number;
  }[];
  design_info: {
    parts: {
      height: string;
      number: number;
      addleft: boolean;
      addright: boolean;
    }[];
    corner: {
      addleft: boolean;
      addright: boolean;
    };
    outerdim_thicknesses: {
      depth: number;
      width: number;
      height: number;
    };
  };
  inner_dimensions: {
    depth: number;
    width: number;
    height: number;
  };
}

export interface ShapesResponse {
  shapes: Shape[];
  configurationId: string;
}

export interface Column {
  id: string;
  thickness: string;
  inner_height: string;
  inner_width: string;
  inner_depth: string;
  design: string;
  door: string;
  two_way_opening: string;
  knob_direction: 'C' | 'G' | 'D';
  finish: string;
  foam_type: string;
  body_id?: number;
  position: number;
  body_count?: number;
  column_order?: number; 
}