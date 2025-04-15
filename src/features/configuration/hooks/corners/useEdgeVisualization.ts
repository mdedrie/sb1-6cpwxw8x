import { useRef } from 'react';
import * as THREE from 'three';

// Add 'export' keyword to make EDGE_COLORS available for import
export const EDGE_COLORS = {
  left: 0x1f77b4,   // Blue
  right: 0x2ca02c,  // Green
  top: 0xff7f0e,    // Orange
  bottom: 0xd62728, // Red
  back: 0x9467bd,   // Purple
  outline: 0x000000 // Black for edge highlighting
} as const;

export function useEdgeVisualization(scene: THREE.Scene | null) {
  const highlightedEdgesRef = useRef<THREE.Line[]>([]);
  const permanentEdgesRef = useRef<THREE.Line[]>([]);
  const outlineEdgesRef = useRef<THREE.Line[]>([]);

  const addPermanentEdge = (points: THREE.Vector3[], color: number) => {
    if (!scene) return;

    // Add the colored edge
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 2
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    permanentEdgesRef.current.push(line);

    // Add black outline edge
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: EDGE_COLORS.outline,
      linewidth: 3,
      transparent: true,
      opacity: 0.3
    });

    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const outlineLine = new THREE.Line(outlineGeometry, outlineMaterial);
    // Offset slightly to avoid z-fighting
    outlineLine.position.z += 0.001;
    scene.add(outlineLine);
    outlineEdgesRef.current.push(outlineLine);
  };

  const highlightEdge = (coords: number[][]) => {
    if (!scene) return;
    resetHighlight();
  
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    const geometry = new THREE.BufferGeometry().setFromPoints(
      coords.map(c => new THREE.Vector3(...c))
    );
    const edgeLine = new THREE.Line(geometry, material);
  
    highlightedEdgesRef.current.push(edgeLine);
    scene.add(edgeLine);
  };

  const resetHighlight = () => {
    if (!scene) return;
    highlightedEdgesRef.current.forEach(line => scene.remove(line));
    highlightedEdgesRef.current = [];
  };

  return {
    addPermanentEdge,
    highlightEdge,
    resetHighlight
  };
}