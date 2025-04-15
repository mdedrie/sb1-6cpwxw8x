import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// === Couleurs des arêtes ===
export const EDGE_COLORS = {
  left: 0x1f77b4,
  right: 0x2ca02c,
  top: 0xff7f0e,
  bottom: 0xd62728,
  back: 0x9467bd,
  outline: 0x000000
} as const;

export function useEdgeVisualization(scene: THREE.Scene | null) {
  const highlightedEdgesRef = useRef<THREE.Line[]>([]);
  const permanentEdgesRef = useRef<THREE.Line[]>([]);
  const outlineEdgesRef = useRef<THREE.Line[]>([]);

  const createLine = (points: THREE.Vector3[], color: number, linewidth = 2, opacity = 1, transparent = false) => {
    const material = new THREE.LineBasicMaterial({ color, linewidth, transparent, opacity });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  };

  // === Ajout d'une arête permanente avec son contour noir ===
  const addPermanentEdge = useCallback((points: THREE.Vector3[], color: number) => {
    if (!scene || points.length < 2) return;

    const mainLine = createLine(points, color, 2);
    scene.add(mainLine);
    permanentEdgesRef.current.push(mainLine);

    const outlineLine = createLine(points, EDGE_COLORS.outline, 3, 0.3, true);
    outlineLine.position.z += 0.001;
    scene.add(outlineLine);
    outlineEdgesRef.current.push(outlineLine);
  }, [scene]);

  // === Arête temporaire en surbrillance (jaune) ===
  const highlightEdge = useCallback((coords: number[][]) => {
    if (!scene || coords.length < 2) return;
    resetHighlight();

    const points = coords.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const highlightLine = createLine(points, 0xffff00);
    scene.add(highlightLine);
    highlightedEdgesRef.current.push(highlightLine);
  }, [scene]);

  // === Réinitialise les arêtes surlignées ===
  const resetHighlight = useCallback(() => {
    if (!scene) return;
    highlightedEdgesRef.current.forEach(line => {
      scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    highlightedEdgesRef.current = [];
  }, [scene]);

  // === Nettoyage mémoire sur démontage (facultatif) ===
  useEffect(() => {
    return () => {
      [...highlightedEdgesRef.current, ...permanentEdgesRef.current, ...outlineEdgesRef.current].forEach(line => {
        scene?.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });

      highlightedEdgesRef.current = [];
      permanentEdgesRef.current = [];
      outlineEdgesRef.current = [];
    };
  }, [scene]);

  return {
    addPermanentEdge,
    highlightEdge,
    resetHighlight
  };
}
