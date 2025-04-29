import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

export const EDGE_COLORS = {
  left: 0x1f77b4,
  right: 0x2ca02c,
  top: 0xff7f0e,
  bottom: 0xd62728,
  back: 0x9467bd,
  outline: 0x000000,
  highlight: 0xffff00,
} as const;

type EdgeColorKey = keyof typeof EDGE_COLORS;

type LineRefs = {
  permanent: THREE.Line[],
  outline: THREE.Line[],
  highlight: THREE.Line[],
}

/**
 * Centralise la gestion des arêtes (edges) et surbrillance/sélection dans une scène ThreeJS.
 */
export function useEdgeVisualization(scene: THREE.Scene | null) {
  const linesRef = useRef<LineRefs>({
    permanent: [],
    outline: [],
    highlight: [],
  });

  /**
   * Génère une THREE.Line pour un tableau de points.
   */
  const createLine = useCallback((
    points: THREE.Vector3[],
    color: number,
    width = 2,
    opacity = 1,
    transparent = false
  ): THREE.Line => {
    const material = new THREE.LineBasicMaterial({ color, linewidth: width, transparent, opacity });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }, []);

  /**
   * Ajoute une arête permanente avec son outline ; colorKey = une des clés d’EDGE_COLORS.
   */
  const addPermanentEdge = useCallback((
    points: THREE.Vector3[],
    color: number // <-- le nom est "color" (pas colorKey)
  ) => {
    if (!scene || points.length < 2) return;
  
    // Utilisation directe : PAS par EDGE_COLORS[color]
    const mainLine = createLine(points, color, 2, 1, false);
  
    scene.add(mainLine);
    linesRef.current.permanent.push(mainLine);
  
    // Outline sous-jacent, discret
    const outlineLine = createLine(points, EDGE_COLORS.outline, 3, 0.3, true);
    outlineLine.position.z += 0.001; // anti-z-fighting
    scene.add(outlineLine);
    linesRef.current.outline.push(outlineLine);
  }, [scene, createLine]);

    /**
   * Supprime toutes les surbrillances.
   */
    const resetHighlight = useCallback(() => {
      if (!scene) return;
      linesRef.current.highlight.forEach(line => {
        scene.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      linesRef.current.highlight = [];
    }, [scene]);
  

  /**
   * Affiche temporairement un edge en surbrillance (yellow).
   */
  const highlightEdge = useCallback((coords: number[][]) => {
    if (!scene || coords.length < 2) return;
    resetHighlight();

    const points = coords.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const highlightLine = createLine(points, EDGE_COLORS.highlight, 4, 1, false);
    scene.add(highlightLine);
    linesRef.current.highlight.push(highlightLine);
  }, [scene, createLine, resetHighlight]);


  /**
   * Nettoie tout (permanent, outline et highlight).
   */
  const resetAllEdges = useCallback(() => {
    if (!scene) return;
    Object.values(linesRef.current).flat().forEach(line => {
      scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    linesRef.current.permanent = [];
    linesRef.current.outline = [];
    linesRef.current.highlight = [];
  }, [scene]);

  useEffect(() => {
    return () => {
      resetAllEdges();
    };
  }, [scene, resetAllEdges]);

  return {
    addPermanentEdge,
    highlightEdge,
    resetHighlight,
    resetAllEdges
  };
}