import { useRef, useCallback, useEffect, useMemo } from 'react';
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

type LineRefs = {
  permanent: THREE.Line[],
  outline: THREE.Line[],
  highlight: THREE.Line[],
}

/**
 * Centralise la gestion de toutes les arêtes (permanentes, surbrillantes et contour)
 */
export function useEdgeVisualization(scene: THREE.Scene | null) {
  // on regroupe les refs pour simplifier les resets/clean
  const linesRef = useRef<LineRefs>({
    permanent: [],
    outline: [],
    highlight: [],
  });

  /**
   * Générateur de THREE.Line propre (mémo sauf changement scene, très rare)
   */
  const createLine = useCallback((
    points: THREE.Vector3[], color: number, width = 2, opacity = 1, transparent = false
  ): THREE.Line => {
    const material = new THREE.LineBasicMaterial({ color, linewidth: width, transparent, opacity });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }, []);

  /**
   * Ajoute une arête définitive (avec un léger contour sous-jacent)
   */
  const addPermanentEdge = useCallback((points: THREE.Vector3[], color: number) => {
    if (!scene || points.length < 2) return;

    const mainLine = createLine(points, color, 2, 1, false);
    scene.add(mainLine);
    linesRef.current.permanent.push(mainLine);

    // Outline léger juste derrière, plus épais, translucide
    const outlineLine = createLine(points, EDGE_COLORS.outline, 3, 0.3, true);
    outlineLine.position.z += 0.001;      // anti-z-fighting (effet visuel)
    scene.add(outlineLine);
    linesRef.current.outline.push(outlineLine);
  }, [scene, createLine]);

  /**
   * Affiche temporairement une arête en surbrillance (jaune) 
   */
  const highlightEdge = useCallback((coords: number[][]) => {
    if (!scene || coords.length < 2) return;
    resetHighlight(); // retire la surbrillance précédente

    const points = coords.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const highlightLine = createLine(points, EDGE_COLORS.highlight, 4, 1, false);
    scene.add(highlightLine);
    linesRef.current.highlight.push(highlightLine);
  }, [scene, createLine]);

  /**
   * Supprime toutes les surbrillances
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
   * Nettoie tout: permanent, surbrillance, contours. Appelé au démontage.
   * (optionnel: si tu veux l'exposer en retour, tu peux le faire)
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

  // Au démontage => full cleanup mémoire
  useEffect(() => {
    return () => {
      resetAllEdges();
    };
  }, [scene, resetAllEdges]);
  
  return {
    addPermanentEdge,
    highlightEdge,
    resetHighlight,
    resetAllEdges, // bonus: pour tout nettoyer ou recopier la scène
  };
}