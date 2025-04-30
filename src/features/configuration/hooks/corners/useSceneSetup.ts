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

export function useSceneSetup(
  containerRef: React.RefObject<HTMLDivElement>
): SceneSetup {
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

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    camera.position.set(8, 7, 10);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0xf3f4f6, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // POSTPROCESS Outline
    const effect = new OutlineEffect(renderer);
    effectRef.current = effect;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.2, 0);
    controls.update();
    controlsRef.current = controls;

    // LIGHTS
    scene.add(new THREE.HemisphereLight(0xffffff, 0x888899, 0.45));
    const sun = new THREE.DirectionalLight(0xffffff, 0.78);
    sun.position.set(10, 14, 8);
    sun.castShadow = true;
    sun.shadow.bias = -0.0005;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 5;
    scene.add(sun);

    // GROUND RECEIVER
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.07 })
    );
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // GRID & AXES
    const grid = new THREE.GridHelper(18, 54, 0xe0e7ef, 0xf3f4f6);
    (grid.material as THREE.Material).opacity = 0.55;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    scene.add(new THREE.AxesHelper(2.5));

    // Animation loop
    let mounted = true;
    setReady(true);

    const animate = () => {
      if (!mounted) return;
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      effect.render(scene, camera);
    };
    animate();

    // Resize performant (debounce)
    let resizeTimer: number | undefined;
    resizeObserverRef.current = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!container || !camera) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }, 60);
    });
    resizeObserverRef.current.observe(container);

    // CLEAN-UP
    return () => {
      mounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose && m.dispose());
          } else if (obj.material?.dispose) {
            obj.material.dispose();
          }
        }
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
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