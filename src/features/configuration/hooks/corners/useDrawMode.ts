import { useState, useCallback, useRef, useEffect } from 'react';
import type { Scene, Camera, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export type DrawMode = 'draw' | 'erase' | 'select';

export function useDrawMode(
  rendererRef: React.RefObject<WebGLRenderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  cameraRef: React.RefObject<Camera | null>,
  controlsRef: React.RefObject<OrbitControls | null>
) {
  const [mode, setMode] = useState<DrawMode>('draw');
  const [drawModeEnabled, setDrawModeEnabled] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  const setDrawMode = useCallback(() => setMode('draw'), []);
  const setEraseMode = useCallback(() => setMode('erase'), []);
  const setSelectMode = useCallback(() => setMode('select'), []);

  const toggleDrawMode = useCallback(() => {
    setDrawModeEnabled(prev => !prev);
  }, []);

  const animate = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!renderer || !scene || !camera) return;

    const loop = () => {
      animationFrameRef.current = requestAnimationFrame(loop);
      controls?.update();
      renderer.render(scene, camera);
    };

    loop();
  }, [rendererRef, sceneRef, cameraRef, controlsRef]);

  // Gère automatiquement le start/stop de l’animation selon drawModeEnabled
  useEffect(() => {
    if (drawModeEnabled) {
      animate();
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
  }, [drawModeEnabled, animate]);

  return {
    mode,
    drawModeEnabled,
    setDrawMode,
    setEraseMode,
    setSelectMode,
    toggleDrawMode,
    animate // utile si besoin de forcer l’animation manuellement
  };
}
