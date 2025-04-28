import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scene, Camera, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type DrawMode = 'draw' | 'erase' | 'select';

export function useDrawMode(
  rendererRef: React.RefObject<WebGLRenderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  cameraRef: React.RefObject<Camera | null>,
  controlsRef: React.RefObject<OrbitControls | null>,
  /**
   * Optionnel, permet d’injecter une fonction à exécuter à chaque frame
   */
  onFrame?: () => void
) {
  const [mode, setMode] = useState<DrawMode>('draw');
  const [drawModeEnabled, setDrawModeEnabled] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Setter générique & explicite
  const changeMode = useCallback((newMode: DrawMode) => setMode(newMode), []);

  // Pour faciliter les boutons dans l’UI
  const toggleDrawMode = useCallback(() => {
    setDrawModeEnabled(prev => !prev);
  }, []);

  // Sécurité: Ne lance jamais deux boucles en même temps
  const startAnimationLoop = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!renderer || !scene || !camera) return;

    // Stop préventif (double sécurité)
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

  // Gère le start/stop en lien avec drawModeEnabled
  useEffect(() => {
    if (drawModeEnabled) {
      startAnimationLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Cleanup au démontage
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [drawModeEnabled, startAnimationLoop]);

  // Reset propre
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
    toggleDrawMode,
    reset,
    startAnimationLoop // Accès si besoin d'animer à la demande
  };
}