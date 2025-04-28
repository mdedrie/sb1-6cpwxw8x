import { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { EDGE_COLORS } from './useEdgeVisualization';
import type { Part, Edge } from '../../../../types';

type Coord3 = [number, number, number];

const useMetallicTexture = () => useMemo(() => {
  const tex = new THREE.TextureLoader().load('/textures/metals.jpg');
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.generateMipmaps = true;
  tex.repeat.set(2, 2);
  return tex;
}, []);

const isValidNumber = (val: unknown): val is number => typeof val === 'number' && Number.isFinite(val);
const validateCoords = (coords: Coord3[]) =>
  coords.length === 2 && coords.every(c => Array.isArray(c) && c.length === 3 && c.every(isValidNumber));

/**
 * Crée un mesh panel/face pour Three.js
 */
const createPanel = (
  width: number, height: number, depth: number,
  x: number, y: number, z: number,
  color: number, volumeId: string,
  texture: THREE.Texture
): THREE.Mesh | null => {
  if (![width, height, depth, x, y, z].every(isValidNumber)) return null;
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    color: 0xffffff,
    shininess: 50,
    specular: 0x333333,
    flatShading: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.userData = { volumeId, edgeColor: color };
  return mesh;
};

function generateNomenclature(parts: Part[]): Part[] {
  return parts.map(part => {
    const edges: Edge[] = [];
    const { x, y_start_m, z, width, height } = part;
    if (![x, y_start_m, z, width, height].every(isValidNumber)) return part;

    const pushEdge = (type: 'horizontal' | 'vertical', position: string, coords: Coord3[]) => {
      if (validateCoords(coords)) {
        edges.push({ type, position, coords, length: width, height });
      }
    };
    if (part.face_left === 'present') pushEdge('vertical', 'left', [[x, y_start_m, z], [x, y_start_m + height, z]]);
    if (part.face_right === 'present') pushEdge('vertical', 'right', [[x + width, y_start_m, z], [x + width, y_start_m + height, z]]);
    if (['present', 'shared'].includes(part.face_top ?? '')) pushEdge('horizontal', 'top', [[x, y_start_m + height, z], [x + width, y_start_m + height, z]]);
    if (part.face_bottom === 'present') pushEdge('horizontal', 'bottom', [[x, y_start_m, z], [x + width, y_start_m, z]]);
    return {
      ...part,
      column_type: part.face_left === 'present' && part.face_right === 'present' ? 't_section' : 'angle',
      edges,
    };
  });
}

function classifyEdgesStrict(nomenclature: Part[]): Part[] {
  const edgeMap = new Map<string, number>();
  for (const edge of nomenclature.flatMap(p => p.edges ?? [])) {
    if (!validateCoords(edge.coords)) continue;
    const key = JSON.stringify(edge.coords);
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
  }
  return nomenclature.map(part => ({
    ...part,
    edges: part.edges?.map(edge => ({
      ...edge,
      isShared: validateCoords(edge.coords) && (edgeMap.get(JSON.stringify(edge.coords)) || 0) > 1,
    })),
  }));
}

export function usePartsProcessing(
  configId: string | null,
  scene: THREE.Scene | null,
  addPermanentEdge: (points: THREE.Vector3[], color: number) => void,
  shouldLoadParts = false,
  onLoaded?: () => void
) {
  const metallicTexture = useMetallicTexture();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nomenclature, setNomenclature] = useState<Part[]>([]);
  const [volumeData, setVolumeData] = useState<{
    volumes: Record<string, THREE.Mesh[]>;
    lengths: Record<string, { left: number; right: number; top: number; bottom: number; back: number }>;
  } | null>(null);

  const meshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!configId || !scene || !shouldLoadParts) return;

    const loadParts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `https://icecoreapi-production.up.railway.app/api/configuration_workflow/step7/get_modeling_parts/${configId}`
        );
        if (!res.ok) throw new Error('Échec du chargement des pièces');
        const parts: Part[] = await res.json();
        if (!Array.isArray(parts)) throw new Error('Format de réponse invalide');

        const nomenclatureGen = generateNomenclature(parts);
        const finalNomenclature = classifyEdgesStrict(nomenclatureGen);
        setNomenclature(finalNomenclature);

        // === Arêtes 3D
        for (const part of finalNomenclature) {
          if (!part.edges) continue;
          for (const edge of part.edges) {
            if (!edge.isShared && validateCoords(edge.coords)) {
              const color =
                edge.type === 'vertical'
                  ? EDGE_COLORS.left
                  : edge.position?.includes('front')
                  ? EDGE_COLORS.top
                  : EDGE_COLORS.right;
              const points = edge.coords.map((c) => new THREE.Vector3(...c));
              addPermanentEdge(points, color);
            }
          }
        }

        // === Meshs 3D par volume/colonne
        const groupedByColumn: Record<string, Part[]> = {};
        const meshMap: Record<string, THREE.Mesh[]> = {};
        const lengthsMap: Record<string, { left: number; right: number; top: number; bottom: number; back: number }> = {};

        for (const part of parts) {
          const key = `${part.part_uid ?? 'nouveau'}_${part.column_order ?? 0}`;
          (groupedByColumn[key] ??= []).push(part);

          const vId = part.volume_id;
          if (vId) {
            meshMap[vId] ??= [];
            lengthsMap[vId] ??= { left: 0, right: 0, top: 0, bottom: 0, back: 0 };

            if (part.face_left === 'present') lengthsMap[vId].left += part.height;
            if (part.face_right === 'present') lengthsMap[vId].right += part.height;
            if (['present', 'shared'].includes(part.face_top ?? '')) lengthsMap[vId].top += part.width;
            if (part.face_bottom === 'present') lengthsMap[vId].bottom += part.width;
            if (part.face_back === 'present') lengthsMap[vId].back += part.height;
          }
        }

        Object.values(groupedByColumn).forEach(column => {
          column.forEach(part => {
            const { x, y_start_m = 0, z, width: w, height: h, depth: d } = part;
            const t = 0.05;
            const midX = x + w / 2, midY = y_start_m + h / 2, midZ = z + d / 2;
            const group = new THREE.Group();

            const addFace = (cond: boolean, mesh: THREE.Mesh | null) => cond && mesh && group.add(mesh);

            if (part.volume_id) {
              addFace(
                part.face_left === 'present',
                createPanel(t, h, d, x + t / 2, midY, midZ, EDGE_COLORS.left, part.volume_id, metallicTexture)
              );
              addFace(
                part.face_right === 'present',
                createPanel(t, h, d, x + w - t / 2, midY, midZ, EDGE_COLORS.right, part.volume_id, metallicTexture)
              );
              addFace(
                ['present', 'shared'].includes(part.face_top ?? ''),
                createPanel(w, t, d, midX, y_start_m + h - t / 2, midZ, EDGE_COLORS.top, part.volume_id, metallicTexture)
              );
              addFace(
                part.face_bottom === 'present',
                createPanel(w, t, d, midX, y_start_m + t / 2, midZ, EDGE_COLORS.bottom, part.volume_id, metallicTexture)
              );
              addFace(
                part.face_back === 'present',
                createPanel(w, h, t, midX, midY, z + t / 2, EDGE_COLORS.back, part.volume_id, metallicTexture)
              );
              addFace(
                part.face_front === 'present',
                createPanel(w, h, t, midX, midY, z + d - t / 2, 0x999999, part.volume_id, metallicTexture)
              );

              // Ajout dans les maps et refs
              group.children.forEach(obj => {
                if (obj instanceof THREE.Mesh) {
                  meshMap[part.volume_id!].push(obj);
                  meshesRef.current.push(obj);
                }
              });

              scene.add(group);
            }
          });
        });

        setVolumeData({ volumes: meshMap, lengths: lengthsMap });
        if (onLoaded) onLoaded();
      } catch (e) {
        setError(e instanceof Error ? (e as Error).message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    loadParts();

    // Cleanup global
    return () => {
      meshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
        scene?.remove(mesh);
      });
      meshesRef.current = [];
    };
  }, [configId, scene, shouldLoadParts, addPermanentEdge, onLoaded, metallicTexture]);

  return { loading, error, volumeData, nomenclature };
}