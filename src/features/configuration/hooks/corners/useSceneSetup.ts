import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import type { RefObject } from 'react';

type SceneSetup = {
  sceneRef: RefObject<THREE.Scene | null>;
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  controlsRef: RefObject<OrbitControls | null>;
  effectRef: RefObject<OutlineEffect | null>;
  ready: boolean;
};

export function useSceneSetup(containerRef: React.RefObject<HTMLDivElement>): SceneSetup {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const effectRef = useRef<OutlineEffect | null>(null);
  const animationIdRef = useRef<number>();
  const resizeObserverRef = useRef<ResizeObserver>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || sceneRef.current) return;

    // -- SETUP SCENE --
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const effect = new OutlineEffect(renderer);
    effectRef.current = effect;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    scene.add(new THREE.GridHelper(10, 10));

    let mounted = true;
    setReady(true);

    const animate = () => {
      if (!mounted) return;
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      effect.render(scene, camera);
    };
    animate();

    resizeObserverRef.current = new ResizeObserver(() => {
      if (!container || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserverRef.current.observe(container);

    return () => {
      mounted = false;
      // setReady(false); // Plus besoin (setError/warnings asynchro supprimé)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Clean refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      effectRef.current = null;
    };
  }, [containerRef]);

  return {
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
    effectRef,
    ready,
  };
}