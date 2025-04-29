import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import type { Corner } from '../../../types';

interface UseCornersVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  corners: Corner[];
}

export function useCornersVisualization({
  containerRef,
  corners
}: UseCornersVisualizationProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const effectRef = useRef<OutlineEffect | null>(null);
  const animationFrameRef = useRef<number>();
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const tempHighlightsRef = useRef<THREE.Line[]>([]);
  const permanentEdgesRef = useRef<THREE.Line[]>([]);
  const drawModeRef = useRef(false);

  const [drawModeEnabled, setDrawModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const disposeObject = useCallback((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material?.dispose();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
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
    const animate = () => {
      if (!mounted) return;
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.clear();
      if (drawModeRef.current && effect) {
        effect.render(scene, camera);
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const { clientWidth, clientHeight } = container;
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      mounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    setLoading(true);
    setError(null);
    try {
      meshesRef.current.forEach(obj => {
        scene.remove(obj);
        disposeObject(obj);
      });
      meshesRef.current = [];

      permanentEdgesRef.current.forEach(line => {
        scene.remove(line);
        disposeObject(line);
      });
      permanentEdgesRef.current = [];

      corners.forEach(corner => {
        const thickness = 0.1;
        const width = corner.type === 't_section' ? 0.3 : thickness;
        const depth = corner.type === 't_section' ? 0.3 : thickness;
        const height = Math.max(0.1, corner.height);
        const group = new THREE.Group();

        const x = corner.position === 'left' ? -2 + thickness / 2 : 2 - thickness / 2;
        const y = height / 2;
        const z = 0;

        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        mesh.position.set(x, y, z);
        group.add(mesh);

        if (corner.type === 't_section') {
          const cross = new THREE.Mesh(
            new THREE.BoxGeometry(thickness, height, 0.3),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
          );
          cross.position.set(x + (corner.position === 'left' ? 0.2 : -0.2), y, z);
          group.add(cross);
        }

        const edgeLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(corner.position === 'left' ? -2 : 2, 0, 0),
            new THREE.Vector3(corner.position === 'left' ? -2 : 2, height, 0)
          ]),
          new THREE.LineBasicMaterial({ color: corner.type === 'angle' ? 0x00bfff : 0xffcc00 })
        );
        scene.add(edgeLine);
        permanentEdgesRef.current.push(edgeLine);

        if (corner.type === 't_section') {
          const horiz = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(x, height / 2, -thickness),
              new THREE.Vector3(x, height / 2, thickness)
            ]),
            new THREE.LineBasicMaterial({ color: 0xff0000 })
          );
          scene.add(horiz);
          permanentEdgesRef.current.push(horiz);
        }

        group.children.forEach(obj => {
          if (obj instanceof THREE.Mesh) meshesRef.current.push(obj);
        });
        scene.add(group);
      });

      setLoading(false);
      setError(null);
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'Erreur lors de la génération des coins');
      setLoading(false);
    }
    // Clean-up groupe
    return () => {
      const scene = sceneRef.current;
      if (!scene) return;
      meshesRef.current.forEach(obj => {
        scene.remove(obj);
        disposeObject(obj);
      });
      meshesRef.current = [];
      permanentEdgesRef.current.forEach(line => {
        scene.remove(line);
        disposeObject(line);
      });
      permanentEdgesRef.current = [];
      tempHighlightsRef.current.forEach(line => {
        scene.remove(line);
        disposeObject(line);
      });
      tempHighlightsRef.current = [];
    };
  }, [corners, disposeObject]);

  const highlightCorner = useCallback((corner: Corner) => {
    const scene = sceneRef.current;
    if (!scene) return;

    tempHighlightsRef.current.forEach(line => {
      scene.remove(line);
      disposeObject(line);
    });
    tempHighlightsRef.current = [];

    const baseX = corner.position === 'left' ? -2 : 2;
    const height = corner.height;

    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(baseX, 0, 0),
        new THREE.Vector3(baseX, height, 0)
      ]),
      material
    );
    scene.add(line);
    tempHighlightsRef.current.push(line);

    if (corner.type === 't_section') {
      const horiz = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(baseX, height / 2, -0.1),
          new THREE.Vector3(baseX, height / 2, 0.1)
        ]),
        material
      );
      scene.add(horiz);
      tempHighlightsRef.current.push(horiz);
    }
  }, [disposeObject]);

  const resetHighlight = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    tempHighlightsRef.current.forEach(line => {
      scene.remove(line);
      disposeObject(line);
    });
    tempHighlightsRef.current = [];
  }, [disposeObject]);

  const toggleDrawMode = useCallback((enabled: boolean) => {
    setDrawModeEnabled(enabled);
    drawModeRef.current = enabled;

    meshesRef.current.forEach(mesh => {
      if (enabled) {
        if (!originalMaterialsRef.current.has(mesh)) {
          originalMaterialsRef.current.set(mesh, mesh.material);
        }
        mesh.material = new THREE.MeshLambertMaterial({ color: 0xffffff });
      } else {
        const original = originalMaterialsRef.current.get(mesh);
        if (original) {
          mesh.material = original;
        }
      }
    });
  }, []);

  return {
    drawModeEnabled,
    toggleDrawMode,
    highlightCorner,
    resetHighlight,
    loading,
    error
  };
}