import type { StepMetadata } from '../types';

interface ParameterMappingError {
  category: string;
  id: number;
  error: string;
}

const mappingErrors: ParameterMappingError[] = [];

/**
 * Gets parameter ID from category and reference
 */
export function getParameterId(category: string, ref: string): number | undefined {
  // Normalize the category first
  const normalizedCategory = normalizeCategory(category);
  // Use existing metadata functions to get the ID
  return getIdFromRef(null, normalizedCategory, ref);
}

/**
 * Convertit un ID de paramètre en ref en utilisant les metadata
 */
export function getRefFromId(metadata: StepMetadata | null, category: string, id: number): string | undefined {
  if (!metadata?.parameters_by_category?.[category]) {
    mappingErrors.push({
      category,
      id,
      error: `Catégorie "${category}" non trouvée dans les metadata`
    });
    return undefined;
  }

  const param = metadata.parameters_by_category[category].find(p => p.id === id);
  
  if (!param) {
    mappingErrors.push({
      category,
      id, 
      error: `ID ${id} non trouvé dans la catégorie "${category}"`
    });
  }

  return param?.ref;
}

/**
 * Récupère les erreurs de mapping accumulées et vide la liste
 */
export function getAndClearMappingErrors(): ParameterMappingError[] {
  const errors = [...mappingErrors];
  mappingErrors.length = 0;
  return errors;
}

/**
 * Convertit une ref de paramètre en ID en utilisant les metadata
 */
export function getIdFromRef(metadata: StepMetadata | null, category: string, ref: string): number | undefined {
  if (!metadata?.parameters_by_category?.[category]) return undefined;
  const param = metadata.parameters_by_category[category].find(p => p.ref === ref);
  return param?.id;
}

/**
 * Normalise une catégorie de paramètre
 */
export function normalizeCategory(paramType: string): string {
  switch (paramType) {
    case 'foam_type':
      return 'foams';
    case 'two_way_opening':
      return '2ways';
    case 'door_type':
      return 'doors';
    default:
      return `${paramType}s`;
  }
}