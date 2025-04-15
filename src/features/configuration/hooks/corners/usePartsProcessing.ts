import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EDGE_COLORS } from './useEdgeVisualization';
import { downloadJSON } from '../../../../utils/files';
import type { Part, Edge } from '../../../../types';

// Load texture from file
const textureLoader = new THREE.TextureLoader();
const metallicTexture = textureLoader.load('/textures/metals.jpg', (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.generateMipmaps = true;
  texture.repeat.set(2, 2); // Repeat the texture more times for better detail
}, undefined, (err) => {
  console.warn('Failed to load metal texture, using fallback material', err);
  return new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    shininess: 30,
    specular: 0x444444,
    flatShading: false,
    side: THREE.DoubleSide
  });
});

// Validate numeric values
function isValidNumber(value: number | undefined | null): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// Validate coordinates
function validateCoords(coords: [number, number, number][]): boolean {
  return coords.every(coord => coord.every(value => isValidNumber(value)));
}

// Generate nomenclature from parts data
function generateNomenclature(parts: Part[]): Part[] {
  return parts.map(part => {
    const edges: Edge[] = [];
    
    // Ensure all required numeric values are valid
    if (!isValidNumber(part.x) || !isValidNumber(part.y_start_m) || !isValidNumber(part.z) ||
        !isValidNumber(part.width) || !isValidNumber(part.height)) {
      console.warn('Invalid numeric values in part:', part);
      return part;
    }
    
    // Vertical edges
    if (part.face_left === 'present') {
      const coords: [number, number, number][] = [
        [part.x, part.y_start_m, part.z],
        [part.x, part.y_start_m + part.height, part.z]
      ];
      if (validateCoords(coords)) {
        edges.push({
          type: 'vertical',
          position: 'left',
          height: part.height,
          coords
        });
      }
    }
    
    if (part.face_right === 'present') {
      const coords: [number, number, number][] = [
        [part.x + part.width, part.y_start_m, part.z],
        [part.x + part.width, part.y_start_m + part.height, part.z]
      ];
      if (validateCoords(coords)) {
        edges.push({
          type: 'vertical',
          position: 'right',
          height: part.height,
          coords
        });
      }
    }
    
    // Horizontal edges
    if (part.face_top === 'present' || part.face_top === 'shared') {
      const coords: [number, number, number][] = [
        [part.x, part.y_start_m + part.height, part.z],
        [part.x + part.width, part.y_start_m + part.height, part.z]
      ];
      if (validateCoords(coords)) {
        edges.push({
          type: 'horizontal',
          position: 'top',
          length: part.width,
          coords
        });
      }
    }
    
    if (part.face_bottom === 'present') {
      const coords: [number, number, number][] = [
        [part.x, part.y_start_m, part.z],
        [part.x + part.width, part.y_start_m, part.z]
      ];
      if (validateCoords(coords)) {
        edges.push({
          type: 'horizontal',
          position: 'bottom',
          length: part.width,
          coords
        });
      }
    }
    
    return {
      ...part,
      column_type: part.face_left === 'present' && part.face_right === 'present' ? 't_section' : 'angle',
      edges
    };
  });
}

function classifyEdgesStrict(nomenclature: Part[]): Part[] {
  // Group edges by their coordinates to detect shared edges
  const edgeMap = new Map<string, { edge: Edge; count: number }>();
  
  // First pass: register all edges
  nomenclature.forEach(part => {
    part.edges?.forEach(edge => {
      if (!edge.coords || !validateCoords(edge.coords)) return;
      const key = JSON.stringify(edge.coords);
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        edgeMap.set(key, { edge, count: 1 });
      }
    });
  });
  
  // Second pass: mark shared edges
  return nomenclature.map(part => ({
    ...part,
    edges: part.edges?.map(edge => ({
      ...edge,
      isShared: edge.coords && validateCoords(edge.coords) ? 
        edgeMap.get(JSON.stringify(edge.coords))?.count > 1 : false
    }))
  }));
}

function summarizeJunctions(nomenclature: Part[]) {
  const junctions = {
    vertical: 0,
    horizontal: 0,
    shared: 0,
    total: 0
  };

  nomenclature.forEach(part => {
    part.edges?.forEach(edge => {
      if (!edge.coords || !validateCoords(edge.coords)) return;
      junctions.total++;
      if (edge.isShared) {
        junctions.shared++;
      }
      if (edge.type === 'vertical') {
        junctions.vertical++;
      } else {
        junctions.horizontal++;
      }
    });
  });

  console.log('📊 Résumé des jonctions:', junctions);
}

const volumeMeshesMap: Record<string, THREE.Mesh[]> = {};
const edgeLengthsPerVolume: Record<string, {
  left: number;
  right: number;
  top: number;
  bottom: number;
  back: number;
}> = {};
let angles: Array<{
  count: number;
  width: number;
  volumeIds: string[];
}> = [];

interface Part {
  x: number;
  y_start_m: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  thickness?: number;
  face_left?: string;
  face_right?: string;
  face_top?: string;
  face_bottom?: string;
  face_back?: string;
  face_front?: string;
  volume_id?: string;
  configuration_id?: string;
  column_order?: number;
  column_inner_thickness_m?: number;
  part_index?: number;
}

const createPanel = (width: number, height: number, depth: number, x: number, y: number, z: number, color: number, volumeId: string): THREE.Mesh | null => {
  // Validate all dimensions and positions
  if (!isValidNumber(width) || !isValidNumber(height) || !isValidNumber(depth) ||
      !isValidNumber(x) || !isValidNumber(y) || !isValidNumber(z)) {
    console.warn('Invalid dimensions or position for panel:', { width, height, depth, x, y, z });
    return null;
  }
  
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  // Create material with loaded texture
  const material = new THREE.MeshPhongMaterial({
    map: metallicTexture?.isTexture ? metallicTexture : undefined,
    color: 0xffffff,
    shininess: 50,
    specular: 0x333333,
    flatShading: false,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1
  });

  if (metallicTexture?.isTexture) {
    const maxDim = Math.max(width, height);
    metallicTexture.repeat.set(maxDim, maxDim);
    metallicTexture.needsUpdate = true;
    metallicTexture.minFilter = THREE.LinearMipmapLinearFilter;
    metallicTexture.magFilter = THREE.LinearFilter;
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.userData.volumeId = volumeId;
  mesh.userData.edgeColor = color;
  
  return mesh;
};

export function usePartsProcessing(
  configId: string | null,
  scene: THREE.Scene | null,
  addPermanentEdge: (points: THREE.Vector3[], color: number) => void,
  shouldLoadParts: boolean = false
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nomenclature, setNomenclature] = useState<Part[]>([]);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const loadPartsRef = useRef<() => Promise<void>>();
  const [volumeData, setVolumeData] = useState<{
    volumes: Record<string, THREE.Mesh[]>;
    lengths: Record<string, { left: number; right: number; top: number; bottom: number; back: number; }>;
  } | null>(null);

  loadPartsRef.current = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!configId || !scene || !shouldLoadParts) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://icecoreapi-production.up.railway.app/api/configuration_workflow/step7/get_modeling_parts/${configId}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch parts data');
      }

      const parts: Part[] = await response.json();
      if (!parts || !Array.isArray(parts)) {
        throw new Error('Invalid response format from server');
      }
      
      // Generate nomenclature first
      const generatedNomenclature = generateNomenclature(parts);
      const finalNomenclature = classifyEdgesStrict(generatedNomenclature);
      console.log('📦 Nomenclature complète:', finalNomenclature);
      summarizeJunctions(finalNomenclature);
      setNomenclature(finalNomenclature);
      
      // Visualize edges
      finalNomenclature.forEach(part => {
        part.edges?.forEach(edge => {
          if (edge.isShared || !edge.coords || !validateCoords(edge.coords)) return;
          
          const color = edge.type === 'vertical'
            ? 0x00bfff
            : (edge.position?.includes('front') ? 0xffcc00 : 0xff0000);
          
          const points = edge.coords.map(coord => new THREE.Vector3(coord[0], coord[1], coord[2]));
          if (points.every(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z))) {
            addPermanentEdge(points, color);
          }
        });
      });

      // Group parts by column
      const groupedByColumn: Record<string, Part[]> = {};
      parts.forEach(part => {
        // Validate required numeric values
        if (!isValidNumber(part.x) || !isValidNumber(part.y_start_m) || !isValidNumber(part.z) ||
            !isValidNumber(part.width) || !isValidNumber(part.height) || !isValidNumber(part.depth)) {
          console.warn('Invalid part dimensions:', part);
          return;
        }

        const key = `${part.configuration_id}_${part.column_order}`;
        if (!groupedByColumn[key]) groupedByColumn[key] = [];
        groupedByColumn[key].push(part);

        // Initialize lengths per volume
        const vId = part.volume_id;
        if (vId && !edgeLengthsPerVolume[vId]) {
          edgeLengthsPerVolume[vId] = { left: 0, right: 0, top: 0, bottom: 0, back: 0 };
          volumeMeshesMap[vId] = [];
        }

        // Cumulate visible lengths
        if (vId) {
          if (part.face_left === 'present') edgeLengthsPerVolume[vId].left += part.height;
          if (part.face_right === 'present') edgeLengthsPerVolume[vId].right += part.height;
          if (['present', 'shared'].includes(part.face_top || '')) edgeLengthsPerVolume[vId].top += part.width;
          if (part.face_bottom === 'present') edgeLengthsPerVolume[vId].bottom += part.width;
          if (part.face_back === 'present') edgeLengthsPerVolume[vId].back += part.height;
        }
      });
      
      // Create panels for each column
      Object.values(groupedByColumn).forEach(partsInColumn => {
        partsInColumn.sort((a, b) => (b.part_index || 0) - (a.part_index || 0));

        partsInColumn.forEach(part => {
          const group = new THREE.Group();
          const { x, y_start_m = 0, z, width: w, height: h, depth: d } = part;
          const t = part.column_inner_thickness_m || 0.05;
          const midX = x + w / 2, midY = y_start_m + h / 2, midZ = z + d / 2;

          if (part.face_left === 'present' && part.volume_id) {
            const mesh = createPanel(t, h, d, x + t / 2, midY, midZ, EDGE_COLORS.left, part.volume_id);
            if (mesh) group.add(mesh);
          }
          if (part.face_right === 'present' && part.volume_id) {
            const mesh = createPanel(t, h, d, x + w - t / 2, midY, midZ, EDGE_COLORS.right, part.volume_id);
            if (mesh) group.add(mesh);
          }
          if (part.face_top && ['present', 'shared'].includes(part.face_top) && part.volume_id) {
            const mesh = createPanel(w, t, d, midX, y_start_m + h - t / 2, midZ, EDGE_COLORS.top, part.volume_id);
            if (mesh) group.add(mesh);
          }
          if (part.face_bottom === 'present' && part.volume_id) {
            const mesh = createPanel(w, t, d, midX, y_start_m + t / 2, midZ, EDGE_COLORS.bottom, part.volume_id);
            if (mesh) group.add(mesh);
          }
          if (part.face_back === 'present' && part.volume_id) {
            const mesh = createPanel(w, h, t, midX, midY, z + t / 2, EDGE_COLORS.back, part.volume_id);
            if (mesh) group.add(mesh);
          }
          if (part.face_front === 'present' && part.volume_id) {
            const mesh = createPanel(w, h, t, midX, midY, z + d - t / 2, 0x999999, part.volume_id);
            if (mesh) group.add(mesh);
          }

          // Add panels to volume map and scene
          if (part.volume_id) {
            group.children.forEach(mesh => {
              if (mesh instanceof THREE.Mesh) {
                volumeMeshesMap[part.volume_id].push(mesh);
              }
            });
          }
          scene.add(group);
        });
      });

      setVolumeData({
        volumes: volumeMeshesMap,
        lengths: edgeLengthsPerVolume
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading parts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load parts');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadPartsRef.current) {
      void loadPartsRef.current();
    }

    return () => {
      meshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        scene?.remove(mesh);
      });
      meshesRef.current = [];
    };
  }, [configId, scene, shouldLoadParts]);

  return { loading, error, volumeData, nomenclature };
}