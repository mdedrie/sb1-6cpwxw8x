import { useState, useCallback } from 'react';
import type { Scene, Camera, WebGLRenderer, OrbitControls } from 'three';

export type DrawMode = 'draw' | 'erase' | 'select';

export function useDrawMode(
  renderer: WebGLRenderer | null,
  scene: Scene | null,
  camera: Camera | null,
  controls: OrbitControls | null
) {
  const [mode, setMode] = useState<DrawMode>('draw');
  const [drawModeEnabled, setDrawModeEnabled] = useState(false);

  const setDrawMode = () => setMode('draw');
  const setEraseMode = () => setMode('erase');
  const setSelectMode = () => setMode('select');

  const toggleDrawMode = useCallback(() => {
    setDrawModeEnabled(prev => !prev);
  }, []);

  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) return;

    const animateFrame = () => {
      requestAnimationFrame(animateFrame);
      
      if (controls) {
        controls.update();
      }
      
      renderer.render(scene, camera);
    };

    animateFrame();
  }, [renderer, scene, camera, controls]);

  return {
    mode,
    drawModeEnabled,
    setDrawMode,
    setEraseMode,
    setSelectMode,
    toggleDrawMode,
    animate
  };
}