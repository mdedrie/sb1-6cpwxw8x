import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import type { Corner } from '../../../types';
import { useWorkflowApi } from '../../../services/api/hooks';

interface UseCornersVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  corners: Corner[];
  configId: string;
}

export function useCornersVisualization({ containerRef, corners, configId }: UseCornersVisualizationProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const effectRef = useRef<OutlineEffect | null>(null);
  const [drawModeEnabled, setDrawModeEnabled] = useState(false);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());
  const temporaryHighlightsRef = useRef<THREE.Line[]>([]);
  const permanentEdgesRef = useRef<THREE.Line[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load parts data from API
  useEffect(() => {
    const loadParts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://icecoreapi-production.up.railway.app/api/configuration_workflow/step7/get_modeling_parts/${configId}`,
          { headers: { accept: 'application/json' } }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch parts data');
        }
        
        const data = await response.json();
        setParts(data);
        
        // Process parts data using the original code's functions
        if (data && Array.isArray(data)) {
          const nomenclature = generateNomenclature(data);
          const finalNomenclature = classifyEdgesStrict(nomenclature);
          
          // Add permanent edges based on nomenclature
          finalNomenclature.forEach(part => {
            part.edges.forEach(edge => {
              if (edge.isShared) return;
              
              const color = edge.type === 'vertical'
                ? 0x00bfff
                : (edge.position?.includes('front') ? 0xffcc00 : 0xff0000);
              
              addPermanentEdge(edge.coords, color);
            });
          });
        }
      } catch (err) {
        console.error('Error loading parts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading parts data');
      } finally {
        setLoading(false);
      }
    };
    
    if (configId) {
      loadParts();
    }
  }, [configId]);

  // Couleurs des arêtes
  const edgeColors = {
    left: 0x1f77b4,   // Bleu
    right: 0x2ca02c,  // Vert
    top: 0xff7f0e,    // Orange
    bottom: 0xd62728, // Rouge
    back: 0x9467bd    // Violet
  };

  // Utilitaire pour nettoyer les ressources Three.js
  const disposeObject = useCallback((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
    } else if (obj instanceof THREE.Line) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material instanceof THREE.Material) {
        obj.material.dispose();
      }
    }
  }, []);

  // Initialisation de la scène
  useEffect(() => {
    if (!containerRef.current) return;

    // Scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);
    sceneRef.current = scene;

    // Caméra
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 6);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Effet de contour
    const effect = new OutlineEffect(renderer);
    effectRef.current = effect;

    // Contrôles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controlsRef.current = controls;

    // Lumière
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Grille
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (drawModeEnabled && effectRef.current) {
        effectRef.current.render(scene, camera);
      } else if (rendererRef.current) {
        rendererRef.current.render(scene, camera);
      }
    };
    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonctions de surbrillance
  const highlightCorner = useCallback((corner: Corner) => {
    if (!sceneRef.current) return;

    // Nettoyer les surbrillances existantes
    temporaryHighlightsRef.current.forEach(line => {
      sceneRef.current?.remove(line);
      disposeObject(line);
    });
    temporaryHighlightsRef.current = [];

    const thickness = 0.1;
    const color = corner.position === 'left' ? edgeColors.left : edgeColors.right;

    // Points pour les arêtes verticales
    const points = [
      new THREE.Vector3(corner.position === 'left' ? -2 : 2, 0, 0),
      new THREE.Vector3(corner.position === 'left' ? -2 : 2, corner.height, 0)
    ];

    const material = new THREE.LineBasicMaterial({ 
      color: 0xffff00,
      linewidth: 2
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    temporaryHighlightsRef.current.push(line);
    sceneRef.current.add(line);

    // Pour les Té, ajouter une ligne horizontale
    if (corner.type === 't_section') {
      const crossPoints = [
        new THREE.Vector3(
          corner.position === 'left' ? -2 : 2,
          corner.height / 2,
          -thickness
        ),
        new THREE.Vector3(
          corner.position === 'left' ? -2 : 2,
          corner.height / 2,
          thickness
        )
      ];
      const crossGeometry = new THREE.BufferGeometry().setFromPoints(crossPoints);
      const crossLine = new THREE.Line(crossGeometry, material);
      temporaryHighlightsRef.current.push(crossLine);
      sceneRef.current.add(crossLine);
    }
  }, [edgeColors]);

  const resetHighlight = useCallback(() => {
    temporaryHighlightsRef.current.forEach(line => {
      sceneRef.current?.remove(line);
      disposeObject(line);
    });
    temporaryHighlightsRef.current = [];
  }, [disposeObject]);

  // Mise à jour des visualisations des angles
  useEffect(() => {
    if (!sceneRef.current) return;

    // Nettoyer les meshes existants
    meshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
      disposeObject(mesh);
    });
    meshesRef.current = [];

    // Nettoyer les arêtes permanentes
    permanentEdgesRef.current.forEach(edge => {
      sceneRef.current?.remove(edge);
      disposeObject(edge);
    });
    permanentEdgesRef.current = [];

    // Créer les nouveaux meshes
    corners.forEach(corner => {
      const thickness = 0.1;
      const width = corner.type === 't_section' ? 0.3 : thickness;
      const panelHeight = Math.max(0.1, corner.height);
      const depth = corner.type === 't_section' ? 0.3 : thickness;

      // Position de base
      let x = corner.position === 'left' ? -2 : 2;
      let y = panelHeight / 2;
      let z = 0;

      // Ajustements pour les Té
      if (corner.position === 'left') {
        x += thickness / 2;
      } else {
        x -= thickness / 2;
      }

      // Création du panneau principal
      const geometry = new THREE.BoxGeometry(width, panelHeight, depth);
      const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);

      // Pour les Té, ajouter un panneau perpendiculaire
      if (corner.type === 't_section') {
        const crossGeometry = new THREE.BoxGeometry(thickness, panelHeight, 0.3);
        const crossMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const crossMesh = new THREE.Mesh(crossGeometry, crossMaterial);
        crossMesh.position.set(
          x + (corner.position === 'left' ? 0.2 : -0.2),
          y,
          z
        );
        sceneRef.current?.add(crossMesh);
        meshesRef.current.push(crossMesh);
      }

      sceneRef.current?.add(mesh);
      meshesRef.current.push(mesh);

      // Ajouter les arêtes permanentes
      const baseX = corner.position === 'left' ? -2 : 2;

      // Arête verticale
      const verticalMaterial = new THREE.LineBasicMaterial({
        color: corner.type === 'angle' ? 0x00bfff : 0xffcc00,
        linewidth: 2
      });
      const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(baseX, 0, 0),
        new THREE.Vector3(baseX, corner.height, 0)
      ]);
      const verticalLine = new THREE.Line(verticalGeometry, verticalMaterial);
      sceneRef.current?.add(verticalLine);
      permanentEdgesRef.current.push(verticalLine);

      // Pour les Té, ajouter une arête horizontale
      if (corner.type === 't_section') {
        const horizontalMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2
        });
        const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(baseX, corner.height / 2, -thickness),
          new THREE.Vector3(baseX, corner.height / 2, thickness)
        ]);
        const horizontalLine = new THREE.Line(horizontalGeometry, horizontalMaterial);
        sceneRef.current?.add(horizontalLine);
        permanentEdgesRef.current.push(horizontalLine);
      }
    });
  }, [corners, disposeObject]);

  // Gestion du mode dessin technique
  const toggleDrawMode = useCallback((enabled: boolean) => {
    setDrawModeEnabled(enabled);

    meshesRef.current.forEach(mesh => {
      if (enabled) {
        if (!originalMaterialsRef.current.has(mesh)) {
          originalMaterialsRef.current.set(mesh, mesh.material);
        }
        mesh.material = new THREE.MeshLambertMaterial({ 
          color: 0xffffff, 
          side: THREE.FrontSide 
        });
      } else {
        const originalMaterial = originalMaterialsRef.current.get(mesh);
        if (originalMaterial) {
          mesh.material = originalMaterial;
        }
      }
    });
  }, []);

  return {
    drawModeEnabled,
    toggleDrawMode,
    highlightCorner,
    resetHighlight
  };
}