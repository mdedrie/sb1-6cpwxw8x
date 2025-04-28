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


function normalizeCoords(coords: Coord3[]): Coord3[] {
  return [...coords]
    .map((c) => c.map((n) => +n.toFixed(4)) as Coord3)
    .sort(
      (a, b) =>
        a[0] - b[0] ||
        a[1] - b[1] ||
        a[2] - b[2]
    );
}

function generateNomenclature(parts: Part[]): Part[] {
  const columns = Array.from(new Set(parts.map((p) => p.column_order))).sort((a, b) => (a ?? 0) - (b ?? 0));
  const allParts = [...parts];
  const nomenclature: Part[] = [];
  const globalEdgeMap = new Map<string, { count: number; edge: any; parts: (string | number)[] }>();

  const minX = Math.min(...parts.map((p) => p.x));
  const maxX = Math.max(...parts.map((p) => p.x));

  parts.forEach((part) => {
    const {
      x,
      y_start_m: y,
      z,
      width: w,
      height: h,
      depth: d,
      part_uid,
      column_ref,
      column_description,
      column_order,
      face_left,
      face_right,
      face_top,
      face_bottom,
      face_back,
      face_front,
      volume_id,
      edges,
      position,
      dimensions,
      reverse_compatibilities,
    } = part;

    const points: Record<string, Coord3> = {
      bottom_front_left: [x, y, z + d],
      bottom_front_right: [x + w, y, z + d],
      bottom_back_left: [x, y, z],
      bottom_back_right: [x + w, y, z],

      top_front_left: [x, y + h, z + d],
      top_front_right: [x + w, y + h, z + d],
      top_back_left: [x, y + h, z],
      top_back_right: [x + w, y + h, z],
    };

    const edgesTemp: Edge[] = [];

    function addUniqueEdge(condition: boolean, edge: Edge) {
      if (!condition) return;
      const key = JSON.stringify(normalizeCoords(edge.coords));
      const existing = globalEdgeMap.get(key);
      if (!existing) {
        edge.isShared = ['shared'].includes((part as any)[`face_${edge.position?.split('_')[0]}`]);
        globalEdgeMap.set(key, { count: 1, edge, parts: [part_uid ?? "unknown"] });
        edgesTemp.push(edge);
      } else {
        existing.count++;
        existing.parts.push(part_uid ?? "unknown");
      }
    }

    // Détermination du type de colonne
    const xPositions = allParts.filter((p) => p.column_order === column_order).map((p) => p.x);
    let columnType = 'M';
    if (columns.length === 1) columnType = 'S';
    else if (
      Math.min(...xPositions) === minX ||
      Math.max(...xPositions) === maxX
    )
      columnType = 'C';

    // Arêtes verticales et horizontales
    addUniqueEdge(
      face_left === 'present',
      { type: 'vertical', position: 'back_left', height: h, coords: [points.bottom_back_left, points.top_back_left] }
    );
    addUniqueEdge(
      face_left === 'present',
      { type: 'vertical', position: 'front_left', height: h, coords: [points.bottom_front_left, points.top_front_left] }
    );
    addUniqueEdge(
      face_right === 'present',
      { type: 'vertical', position: 'back_right', height: h, coords: [points.bottom_back_right, points.top_back_right] }
    );
    addUniqueEdge(
      face_right === 'present',
      { type: 'vertical', position: 'front_right', height: h, coords: [points.bottom_front_right, points.top_front_right] }
    );

    const isTop = ['present', 'shared'].includes(face_top as string);
    const isBottom = ['present', 'shared'].includes(face_bottom as string);

    addUniqueEdge(
      isTop,
      { type: 'horizontal', orientation: 'width', position: 'top_front', coords: [points.top_front_left, points.top_front_right], length: w }
    );
    addUniqueEdge(
      isTop && face_left === 'present',
      { type: 'horizontal', orientation: 'depth', position: 'top_left', coords: [points.top_back_left, points.top_front_left], length: d }
    );
    addUniqueEdge(
      isTop && face_right === 'present',
      { type: 'horizontal', orientation: 'depth', position: 'top_right', coords: [points.top_back_right, points.top_front_right], length: d }
    );
    addUniqueEdge(
      isTop,
      { type: 'horizontal', orientation: 'width', position: 'top_back', coords: [points.top_back_left, points.top_back_right], length: w }
    );

    addUniqueEdge(
      isBottom,
      { type: 'horizontal', orientation: 'width', position: 'bottom_front', coords: [points.bottom_front_left, points.bottom_front_right], length: w }
    );
    addUniqueEdge(
      isBottom && face_left === 'present',
      { type: 'horizontal', orientation: 'depth', position: 'bottom_left', coords: [points.bottom_back_left, points.bottom_front_left], length: d }
    );
    addUniqueEdge(
      isBottom && face_right === 'present',
      { type: 'horizontal', orientation: 'depth', position: 'bottom_right', coords: [points.bottom_back_right, points.bottom_front_right], length: d }
    );
    addUniqueEdge(
      isBottom,
      { type: 'horizontal', orientation: 'width', position: 'bottom_back', coords: [points.bottom_back_left, points.bottom_back_right], length: w }
    );

    nomenclature.push({
      ...part,
      column_type: columnType,
      edges: edgesTemp,
      position: { x, y, z },
      dimensions: { width: w, height: h, depth: d },
      // reverse_compatibilities: part.reverse_compatibilities, // SI besoin réellement
    });
  });

  // Attribution des types de jonction selon les arêtes partagées
  globalEdgeMap.forEach((entry) => {
    const junctionType = entry.count >= 2 ? 'Té' : 'Angle';
    entry.parts.forEach((uid) => {
      // Correction clé : toujours comparer une string|number, jamais undefined
      const part = nomenclature.find((p) => (p.part_uid ?? "unknown") === (uid ?? "unknown"));
      const edge = (part?.edges ?? []).find((e) =>
        JSON.stringify(normalizeCoords(e.coords)) === JSON.stringify(normalizeCoords(entry.edge.coords))
      );
      if (edge) edge.junctionType = junctionType;
    });
  });

  // Attribution forcée de Té latéral (logique métier)
  nomenclature.forEach((part) => {
    if (part.column_type !== 'C') return;
    const left = nomenclature.find((p) => (p.column_order ?? 0) === ((part.column_order ?? 0) - 1));
    const right = nomenclature.find((p) => (p.column_order ?? 0) === ((part.column_order ?? 0) + 1));

    if (left && part.face_left === 'present') {
      (part.edges ?? []).forEach((e) => {
        if (e.position?.includes('left')) e.junctionType = 'Té';
      });
    }

    if (right && part.face_right === 'present') {
      (part.edges ?? []).forEach((e) => {
        if (e.position?.includes('right')) e.junctionType = 'Té';
      });
    }
  });

  return nomenclature;
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