# Angles and T-Sections Documentation

## Overview

This document provides a comprehensive overview of all files and components related to the angles and T-sections functionality in the IceCore Configuration Manager.

## Core Files

### Components

#### `src/features/configuration/components/corners/CornersStep.tsx`
- Main component for the corners configuration step
- Handles 3D visualization of angles and T-sections
- Manages user interactions and state
- Integrates with the modeling API

### Hooks

#### `src/features/configuration/hooks/corners/useSceneSetup.ts`
- Initializes and manages the Three.js scene
- Sets up camera, renderer, and lighting
- Handles window resizing
- Configures OrbitControls for 3D navigation

#### `src/features/configuration/hooks/corners/useEdgeVisualization.ts`
- Manages edge highlighting and visualization
- Defines color constants for different edge types
- Handles temporary and permanent edge rendering
- Provides methods for edge interaction

#### `src/features/configuration/hooks/corners/usePartsProcessing.ts`
- Core processing logic for parts and angles
- Handles texture loading and material creation
- Validates and processes geometric data
- Generates nomenclature for parts
- Creates 3D meshes for visualization

#### `src/features/configuration/hooks/corners/useDrawMode.ts`
- Manages technical drawing mode
- Toggles between different visualization modes
- Handles animation and rendering states

## Types and Interfaces

### `src/types.ts`
```typescript
export interface Corner {
  id: string;
  position: 'left' | 'right';
  type: 'angle' | 't_section';
  height: number;
  finish: string;
}

export interface Edge {
  type: 'vertical' | 'horizontal';
  position?: string;
  height?: number;
  length?: number;
  coords: number[][];
  junctionType?: string;
  isShared?: boolean;
}

export interface Part {
  column_order: number;
  column_type: string;
  part_uid?: string;
  edges?: Edge[];
  // ... other properties
}
```

## Key Features

### 3D Visualization
- Real-time 3D rendering of angles and T-sections
- Interactive camera controls
- Edge highlighting and selection
- Material and texture mapping

### Geometry Processing
- Validation of geometric data
- Edge detection and classification
- Junction analysis
- Shared edge detection

### Technical Drawing Mode
- Toggle between 3D and technical drawing views
- Edge highlighting
- Dimension visualization
- Junction annotations

## Assets

### Textures
- `public/textures/metals.jpg`: Metal texture for 3D rendering
- Used for realistic material appearance
- Applied to angle and T-section surfaces

## Color Constants

```typescript
export const EDGE_COLORS = {
  left: 0x1f77b4,   // Blue
  right: 0x2ca02c,  // Green
  top: 0xff7f0e,    // Orange
  bottom: 0xd62728, // Red
  back: 0x9467bd,   // Purple
  outline: 0x000000 // Black for edge highlighting
};
```

## API Integration

The components interact with the backend API through several endpoints:

```typescript
// Fetch modeling data
GET /api/configuration_workflow/step7/get_modeling_parts/${configId}

// Generate volumes
POST /api/configuration_workflow/step3bis/sql_generate_volumes/${configId}

// Get volume annotations
GET /api/configuration_workflow/step4/get_volumes/${configId}

// Update volume annotations
PUT /api/configuration_workflow/step4/annotate_volume/${volumeId}
```

## Usage Example

```typescript
// Initialize the corners step
<CornersStep
  configId={id}
  onBack={handleCornersBack}
  onSave={handleCornersSave}
  isSaving={loading}
  error={error}
/>
```

## Best Practices

1. **Validation**
   - Always validate geometric data before processing
   - Check for valid numeric values
   - Validate coordinate arrays

2. **Performance**
   - Use geometry instancing for repeated elements
   - Dispose of unused geometries and materials
   - Implement proper cleanup in useEffect hooks

3. **Error Handling**
   - Provide fallback materials if textures fail to load
   - Handle API errors gracefully
   - Show user-friendly error messages

4. **Memory Management**
   - Clean up Three.js resources on unmount
   - Dispose of geometries and materials
   - Remove meshes from scene

## Dependencies

- Three.js for 3D rendering
- React for component management
- TypeScript for type safety