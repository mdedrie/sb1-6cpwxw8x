import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scene, Camera, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type DrawMode = 'draw' | 'erase' | 'select';

interface UseDrawModeReturn {
  mode: DrawMode;
  drawModeEnabled: boolean;
  setMode: (mode: DrawMode) => void;
  setDrawModeEnabled: (enabled: boolean) => void;
  toggleDrawMode: () => void;
  reset: () => void;
  startAnimationLoop: () => void;
}

/**
 * Hook gestion de mode dessin pour scène ThreeJS.
 */
export function useDrawMode(
  rendererRef: React.RefObject<WebGLRenderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  cameraRef: React.RefObject<Camera | null>,
  controlsRef: React.RefObject<OrbitControls | null>,
  /**
   * Optionnel : callback à chaque frame
   */
  onFrame?: () => void
): UseDrawModeReturn {
  const [mode, setMode] = useState<DrawMode>('draw');
  const [drawModeEnabled, setDrawModeEnabled] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  /** Change le mode (draw, erase, select) */
  const changeMode = useCallback((newMode: DrawMode) => setMode(newMode), []);

  /** Active/désactive drawMode */
  const toggleDrawMode = useCallback(() => {
    setDrawModeEnabled(prev => !prev);
  }, []);

  /**
   * Lance l'animation threejs, rafraîchie à chaque frame
   */
  const startAnimationLoop = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!renderer || !scene || !camera) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const loop = () => {
      animationFrameRef.current = requestAnimationFrame(loop);
      controls?.update();
      renderer.render(scene, camera);
      onFrame && onFrame();
    };

    loop();
  }, [rendererRef, sceneRef, cameraRef, controlsRef, onFrame]);

  useEffect(() => {
    if (drawModeEnabled) {
      startAnimationLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [drawModeEnabled, startAnimationLoop]);

  /** Réinitialise tout */
  const reset = useCallback(() => {
    setDrawModeEnabled(false);
    setMode('draw');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  return {
    mode,
    drawModeEnabled,
    setMode: changeMode,
    setDrawModeEnabled,
    toggleDrawMode,
    reset,
    startAnimationLoop
  };
}