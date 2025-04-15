# IceCore Configuration Manager

## 📖 Vue d'ensemble

IceCore est une application professionnelle React pour la gestion et la configuration d'installations frigorifiques industrielles. Elle permet de créer, modifier et visualiser des configurations complexes de colonnes frigorifiques avec une interface intuitive et des validations en temps réel.

### Objectifs du projet
- Simplifier la configuration d'installations frigorifiques
- Assurer la compatibilité des paramètres techniques
- Visualiser les volumes et zones de température
- Gérer un catalogue de configurations standards

![IceCore Banner](https://images.unsplash.com/photo-1624204386084-dd8c05e32226?auto=format&fit=crop&q=80&w=1000)

## 🏗️ Architecture détaillée

### Patterns de conception
- Architecture basée sur les features (Feature-Driven Development)
- Hooks personnalisés pour la logique métier
- Components composables et réutilisables
- Gestion d'état locale avec Context API
- Services API centralisés

### Gestion d'état
- État local avec useState pour les composants simples
- useReducer pour la logique complexe
- Context API pour l'état global
- Mémos et callbacks optimisés

### Optimisations
- Lazy loading des routes
- Debouncing des recherches
- Throttling des appels API
- Mise en cache des données
- Code splitting automatique

## 🌟 Features

### 1. Configuration Management
- Create, edit, and manage cold storage configurations
- Real-time validation and compatibility checking
- Support for draft and catalog configurations
- Advanced filtering and search capabilities

#### Détails techniques
- Validation synchrone et asynchrone
- Système de brouillons automatiques
- Export/Import au format JSON
- Historique des modifications

### 2. Visual Design Tools
#### Interface utilisateur
- Interactive column configuration
- Drag-and-drop column reordering
- Real-time volume visualization
- Temperature zone mapping (positive/negative)

#### Fonctionnalités avancées
- Prévisualisation en temps réel
- Calculs automatiques des dimensions
- Détection des incompatibilités
- Suggestions intelligentes

### 3. Technical Features
#### Validation et compatibilité
- Parameter compatibility validation
- Dimension calculations
- Volume modeling and visualization
- Temperature zone management

#### Sécurité et intégrité
- Validation des données côté client et serveur
- Protection contre les injections
- Vérification des types TypeScript
- Gestion des erreurs robuste

## 📱 Screens

### 1. Catalog View (`/`)
#### Interface principale
- Grid and list view options
- Advanced filtering and sorting
- Quick actions (edit, delete, duplicate)
- Export functionality
- Status indicators (draft/catalog)

#### Fonctionnalités avancées
- Recherche full-text
- Filtres combinés
- Tri multi-critères
- Export personnalisé
- Actions par lot

### 2. Configuration Editor (`/editor` & `/editor/:id`)
#### Step 1: Basic Information
##### Champs et validation
- Configuration name input
  - Validation en temps réel
  - Suggestions automatiques
  - Vérification des doublons
- Catalog status toggle
  - Gestion des permissions
  - Validation des conditions
- Validation rules
  - Règles personnalisables
  - Messages d'erreur contextuels

#### Step 2: Dimensions
##### Saisie et calculs
- Height, width, depth inputs
  - Validation des limites
  - Calculs automatiques
  - Unités configurables
- Description field
  - Éditeur riche
  - Suggestions de contenu
- Real-time preview
  - Rendu 3D
  - Échelle adaptative

#### Step 3: Columns
##### Configuration détaillée
- Interactive column builder
  - Assistant de création
  - Templates prédéfinis
- Parameter selection with compatibility checking
  - Validation en temps réel
  - Suggestions intelligentes
- Visual column preview
  - Rendu réaliste
  - Annotations techniques
- Drag-and-drop reordering
  - Animations fluides
  - Validation de position

#### Step 4: Volumes
##### Visualisation et calculs
- Interactive volume visualization
  - Rendu vectoriel SVG
  - Interactions avancées
- Temperature zone assignment
  - Sélection intuitive
  - Validation des zones
- Real-time volume calculations
  - Algorithmes optimisés
  - Mise à jour instantanée
- Visual feedback
  - Indicateurs d'état
  - Messages contextuels

## 🧱 Components

### Core UI Components (`/src/components/ui/`)
#### Composants de base
- `Button.tsx`
  - Variants: primary, secondary
  - États: loading, disabled
  - Animations: hover, focus
  - Accessibilité: ARIA
- `FormField.tsx`
  - Types: text, number, textarea
  - Validation intégrée
  - Messages d'erreur
  - Labels et aide
- `SelectField.tsx`
  - Options dynamiques
  - Filtrage en temps réel
  - Groupes d'options
  - États personnalisés
- `Modal.tsx`
  - Gestion du focus
  - Animations fluides
  - Fermeture intelligente
  - Pile de modales

### Layout Components (`/src/features/layout/`)
#### Structure de l'application
- `Layout.tsx`
  - Grid system
  - Responsive design
  - Thème dynamique
- `Navigation.tsx`
  - Menu dynamique
  - Breadcrumbs
  - Actions contextuelles
- `Sidebar.tsx`
  - État persistant
  - Navigation imbriquée
  - Redimensionnement

## 🔧 Technical Stack

## 🌐 API Documentation

### Architecture API

#### Configuration API (`/src/services/api/configuration.ts`)
```typescript
// Endpoints principaux
GET    /api/configurations/:id      // Récupère une configuration
POST   /api/configurations/         // Crée une configuration
PUT    /api/configurations/:id      // Met à jour une configuration
DELETE /api/configurations/:id      // Supprime une configuration
```

##### Paramètres et Réponses
- Création (`POST /configurations/`)
  ```typescript
  // Request
  {
    configuration_name: string;
    is_catalog: boolean;
  }
  
  // Response
  {
    configuration_id: string;
    // ... autres métadonnées
  }
  ```

#### Workflow API (`/src/services/api/workflow.ts`)
```typescript
// Endpoints de workflow
GET    /api/configuration_workflow/step_metadata     // Métadonnées des étapes
GET    /api/configuration_workflow/step2bis/columns/:id  // Colonnes existantes
POST   /api/configuration_workflow/step2bis/add_column/:id  // Ajout de colonne
```

##### Gestion des erreurs
```typescript
interface ApiResponse<T = any> {
  data: T | null;
  error?: string;
  status: number;
}
```

#### Catalog API (`/src/services/api/catalog.ts`)
```typescript
// Endpoints catalogue
GET    /api/configurations/         // Liste des configurations
DELETE /api/configurations/:id      // Suppression
```

### Sécurité et Performance

#### Mécanismes de sécurité
- Validation des données (client/serveur)
- Protection CSRF
- Rate limiting
- Sanitization des entrées

#### Optimisations
- Retry logic avec backoff exponentiel
- Cache des requêtes
- Debouncing des appels
- Batch updates

### Gestion des erreurs

#### Stratégie de retry
```typescript
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const BACKOFF_FACTOR = 1.5;
```

#### Codes d'erreur personnalisés
- `CONFIG_001`: Erreur de validation
- `CONFIG_002`: Conflit de données
- `CONFIG_003`: Ressource non trouvée

## 📊 Architecture des données

### Modèles principaux

#### Configuration
```typescript
interface Configuration {
  id: string;
  name: string;
  status: 'draft' | 'complete';
  is_catalog: boolean;
  description?: string;
  dimensions?: {
    outer_height: number;
    outer_width: number;
    outer_depth: number;
  };
  created_at: string;
  // ... autres propriétés
}
```

#### Column
```typescript
interface Column {
  id: string;
  position: number;
  thickness: string;
  inner_height: string;
  // ... paramètres techniques
}
```

### Validation des données

#### Règles métier
- Validation des dimensions
- Compatibilité des paramètres
- Contraintes thermiques

#### Schémas de validation
```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'format';
  params?: any;
}
```

## 🔄 Flux de données

### État global

#### Configuration Context
```typescript
interface ConfigurationContext {
  state: ConfigurationState;
  actions: ConfigurationActions;
}
```

#### Actions disponibles
- `initializeConfiguration`
- `updateConfiguration`
- `saveConfiguration`
- `deleteConfiguration`

### Hooks personnalisés

#### useConfigurationState
```typescript
const {
  currentStep,
  setCurrentStep,
  validateStep,
  // ... autres méthodes
} = useConfigurationState();
```

#### useColumnActions
```typescript
const {
  handleAddColumn,
  handleUpdateColumn,
  handleDeleteColumn,
  // ... autres actions
} = useColumnActions();
```

## 🎨 Système de design

### Thème
```typescript
const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      // ... palette complète
    },
    // ... autres couleurs
  },
  spacing: {
    // ... système d'espacement
  }
};
```

### Composants réutilisables

#### Button System
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  // ... autres props
}
```

#### Form Components
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  // ... autres props
}
```

## 🔍 Debugging et Monitoring

### Outils de développement

#### Debug Panel
- Inspection d'état en temps réel
- Logs d'actions
- Performance metrics

#### API Console
- Monitoring des requêtes
- Inspection des payloads
- Historique des appels

### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  // Capture des erreurs React
  // Fallback UI
  // Error reporting
}
```

## 📁 Project Structure

### Root Structure
```
/
├── src/                    # Source code
├── public/                 # Static assets
├── .bolt/                  # Bolt configuration
├── eslint.config.js        # ESLint configuration
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

### Source Code Structure (`/src`)

#### Components Directory (`/src/components/`)
Composants réutilisables à travers l'application.

##### UI Components (`/src/components/ui/`)
```
ui/
├── Button.tsx
│   ├── Variants: primary, secondary
│   ├── Sizes: sm, md, lg
│   ├── States: loading, disabled
│   └── Props:
│       ├── variant: 'primary' | 'secondary'
│       ├── size: 'sm' | 'md' | 'lg'
│       ├── loading: boolean
│       └── loadingText: string
│
├── FormField.tsx
│   ├── Types: input, textarea
│   ├── Validation intégrée
│   ├── Gestion des erreurs
│   └── Props:
│       ├── label: string
│       ├── error?: string
│       ├── textarea?: boolean
│       └── required?: boolean
│
├── Modal.tsx
│   ├── Gestion du focus trap
│   ├── Fermeture par Escape
│   ├── Backdrop click
│   └── Props:
│       ├── isOpen: boolean
│       ├── onClose: () => void
│       ├── title: string
│       └── children: ReactNode
│
└── SelectField.tsx
    ├── Recherche intégrée
    ├── Validation compatibilité
    ├── Debug mode
    └── Props:
        ├── options: ParameterItem[]
        ├── value: string
        ├── metadata: StepMetadata
        └── parameterType: string
```

#### Features Directory (`/src/features/`)
Organisation modulaire des fonctionnalités.

##### Catalog Feature (`/src/features/catalog/`)
```
catalog/
├── components/
│   ├── CatalogEmpty.tsx     # État vide
│   ├── CatalogError.tsx     # Gestion erreurs
│   ├── CatalogFilters.tsx   # Filtres et recherche
│   ├── CatalogGrid.tsx      # Affichage grille
│   ├── CatalogHeader.tsx    # En-tête et actions
│   ├── CatalogItem.tsx      # Carte configuration
│   └── CatalogLoading.tsx   # État chargement
│
├── hooks/
│   ├── useCatalogActions.ts # Actions CRUD
│   ├── useCatalogData.ts    # Gestion données
│   └── useCatalogFilters.ts # Logique filtres
│
└── index.ts                 # Export public API
```

##### Configuration Feature (`/src/features/configuration/`)
```
configuration/
├── components/
│   ├── columns/            # Gestion colonnes
│   │   ├── ColumnCard.tsx    # Affichage colonne
│   │   ├── ColumnForm.tsx    # Édition colonne
│   │   ├── ColumnList.tsx    # Liste colonnes
│   │   └── ColumnPreview.tsx # Prévisualisation
│   │
│   ├── steps/             # Étapes configuration
│   │   ├── BasicInfoStep.tsx   # Étape 1
│   │   ├── DimensionsStep.tsx  # Étape 2
│   │   ├── ColumnsStep.tsx     # Étape 3
│   │   └── VolumesStep.tsx     # Étape 4
│   │
│   └── volumes/           # Visualisation volumes
│       ├── VolumeVisualizer.tsx  # Rendu SVG
│       └── VolumeTemperatureTable.tsx # Tableau températures
│
├── hooks/
│   ├── useColumnActions.ts     # Actions colonnes
│   ├── useConfigurationState.ts # État global
│   ├── useCompatibility.ts     # Validation compatibilité
│   └── useMetadata.ts          # Gestion metadata
│
└── index.ts                    # Export public API
```

##### Debug Feature (`/src/features/debug/`)
```
debug/
├── components/
│   ├── ApiConsole.tsx      # Monitoring API
│   │   ├── Request logging
│   │   ├── Response inspection
│   │   └── Error tracking
│   │
│   ├── DebugPanel.tsx     # Panneau debug
│   │   ├── State inspection
│   │   ├── Action logging
│   │   └── Performance metrics
│   │
│   └── FloatingToolbox.tsx # Boîte à outils
│       ├── Tool management
│       ├── Position persistence
│       └── Visibility control
│
└── index.ts               # Export public API
```

##### Layout Feature (`/src/features/layout/`)
```
layout/
├── Layout.tsx            # Layout principal
│   ├── Responsive grid
│   ├── Sidebar integration
│   └── Navigation mounting
│
├── Navigation.tsx        # Barre navigation
│   ├── User menu
│   ├── Quick search
│   └── Notifications
│
├── Sidebar.tsx          # Barre latérale
│   ├── Menu items
│   ├── Collapse/Expand
│   └── Active state
│
└── index.ts             # Export public API
```

#### Services Directory (`/src/services/`)
Organisation des services API et utilitaires.

##### API Services (`/src/services/api/`)
```
api/
├── catalog.ts           # API catalogue
│   ├── getConfigurations()
│   └── deleteConfiguration()
│
├── configuration.ts     # API configurations
│   ├── getConfiguration()
│   ├── initializeConfiguration()
│   ├── updateConfiguration()
│   └── setDimensions()
│
├── workflow.ts          # API workflow
│   ├── getColumns()
│   ├── getMetadata()
│   └── addColumn()
│
├── config.ts           # Configuration API
│   ├── Error handling
│   ├── Retry logic
│   └── Response parsing
│
├── types.ts            # Types API
│   ├── ApiResponse
│   ├── Configuration
│   └── Column
│
└── index.ts            # Export public API
```

#### Utils Directory (`/src/utils/`)
Utilitaires et helpers.

```
utils/
└── parameters.ts       # Utilitaires paramètres
    ├── getRefFromId()
    ├── getIdFromRef()
    └── normalizeCategory()
```

#### Types Directory (`/src/types/`)
Définitions TypeScript globales.

```
types/
└── index.ts           # Types globaux
    ├── Configuration
    ├── Column
    ├── StepMetadata
    └── ParameterItem
```

```
src/
├── components/            # Shared components
│   ├── ui/               # Core UI components
│   │   ├── Button.tsx    # Button component with variants
│   │   ├── FormField.tsx # Form field with validation
│   │   ├── Modal.tsx     # Modal dialog component
│   │   └── SelectField.tsx # Select input with search
│   └── index.ts          # Components barrel file
│
├── features/             # Feature modules
│   ├── catalog/          # Catalog feature
│   │   ├── components/   # Catalog-specific components
│   │   ├── hooks/       # Custom hooks for catalog
│   │   └── index.ts     # Feature exports
│   │
│   ├── configuration/    # Configuration feature
│   │   ├── components/   # Configuration components
│   │   │   ├── columns/  # Column management
│   │   │   ├── steps/    # Step components
│   │   │   └── volumes/  # Volume visualization
│   │   ├── hooks/       # Configuration hooks
│   │   └── index.ts     # Feature exports
│   │
│   ├── debug/           # Debugging tools
│   │   ├── components/  # Debug components
│   │   └── index.ts     # Debug exports
│   │
│   └── layout/          # Layout components
│       ├── Layout.tsx   # Main layout wrapper
│       ├── Navigation.tsx # Navigation bar
│       └── Sidebar.tsx  # Sidebar component
│
├── pages/               # Page components
│   ├── Catalog.tsx     # Catalog page
│   └── ConfigurationEditor.tsx # Editor page
│
├── services/           # API and services
│   ├── api/           # API clients
│   │   ├── catalog.ts # Catalog API
│   │   ├── configuration.ts # Configuration API
│   │   ├── workflow.ts # Workflow API
│   │   └── types.ts   # API types
│   └── index.ts       # Services barrel file
│
├── types/             # TypeScript types
│   └── index.ts       # Type definitions
│
├── utils/            # Utility functions
│   └── parameters.ts # Parameter utilities
│
├── App.tsx          # Root component
├── index.css        # Global styles
└── main.tsx        # Application entry point
```

### Key Files Description

#### Configuration Components
- `columns/ColumnCard.tsx`: Affichage d'une colonne avec actions
- `columns/ColumnForm.tsx`: Formulaire d'édition de colonne
- `columns/ColumnList.tsx`: Liste des colonnes avec drag & drop
- `columns/ColumnPreview.tsx`: Prévisualisation des colonnes

#### Catalog Components
- `CatalogFilters.tsx`: Filtres de recherche et tri
- `CatalogGrid.tsx`: Grille de configurations
- `CatalogHeader.tsx`: En-tête avec actions
- `CatalogItem.tsx`: Carte de configuration

#### Debug Tools
- `ApiConsole.tsx`: Console de monitoring API
- `DebugPanel.tsx`: Panneau de débogage
- `FloatingToolbox.tsx`: Boîte à outils flottante

#### API Services
- `config.ts`: Configuration API globale
- `catalog.ts`: API catalogue
- `configuration.ts`: API configurations
- `workflow.ts`: API workflow

#### Hooks
- `useColumnActions.ts`: Actions colonnes
- `useConfigurationState.ts`: État configuration
- `useCompatibility.ts`: Vérification compatibilité
- `useMetadata.ts`: Gestion métadonnées

### File Responsibilities

#### Core Files
- `vite.config.ts`: Configuration build et dev
- `tailwind.config.js`: Thème et styles
- `tsconfig.json`: Configuration TypeScript

#### Entry Points
- `main.tsx`: Bootstrap application
- `App.tsx`: Configuration routes
- `index.css`: Styles globaux

#### Type Definitions
- `types.ts`: Types partagés
- `api/types.ts`: Types API

#### Utils
- `parameters.ts`: Utilitaires paramètres
- `api/config.ts`: Configuration API

### Frontend Core
- **Framework:** React 18.3
  - Concurrent Mode
  - Suspense
  - Server Components ready
- **Build Tool:** Vite
  - HMR optimisé
  - Build rapide
  - Plugins optimisés
- **Styling:** Tailwind CSS
  - JIT compiler
  - Purge CSS
  - Thème personnalisé

### Librairies clés
- **Icons:** Lucide React
  - Optimisées pour React
  - Tree-shakable
  - Personnalisables
- **Animation:** Framer Motion
  - Animations fluides
  - Gestures
  - Layout animations
- **Drag & Drop:** @dnd-kit
  - Accessible
  - Touch support
  - Animations

### Outils de développement
- **Code Highlighting:** Prism.js
  - Syntax highlighting
  - Thème personnalisé
  - Plugins
- **Type Safety:** TypeScript
  - Strict mode
  - Custom types
  - Type inference
- **API Integration:**
  - Custom fetch wrapper
  - Error handling
  - Retry logic
  - Cache management

## 📦 Dependencies détaillées

### Production Dependencies
```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
      // Drag & Drop core functionality
      // - Accessible by default
      // - Touch device support
      // - Multi-backend system
    "@dnd-kit/sortable": "^7.0.2",
      // Sortable functionality
      // - Animation system
      // - Keyboard support
    "framer-motion": "^11.0.8",
      // Animation library
      // - Layout animations
      // - Gestures support
    "html-to-image": "^1.11.11",
      // DOM to image conversion
      // - Multiple formats
      // - High quality
    "lucide-react": "^0.344.0",
      // Icon library
      // - Tree-shakeable
      // - TypeScript support
    "prismjs": "^1.29.0",
      // Code highlighting
      // - Multiple languages
      // - Themes support
    "react": "^18.3.1",
      // React core
      // - Concurrent features
      // - Hooks
    "react-dom": "^18.3.1",
      // React DOM renderer
    "react-json-view-lite": "^1.2.1",
      // JSON viewer
      // - Collapsible
      // - Theme support
    "react-router-dom": "^6.22.3"
      // Routing
      // - Data APIs
      // - Lazy loading
  }
}
```