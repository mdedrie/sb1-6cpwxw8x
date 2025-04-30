import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export function fitCameraToScene(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  scene: THREE.Scene,
margin: number = 0.18
) {
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * margin;

  // Place la camera face au centre trouvé
  camera.position.set(center.x + cameraZ, center.y + cameraZ / 5, center.z + cameraZ);
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}