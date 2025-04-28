declare module 'three/examples/jsm/controls/OrbitControls' {
    import { Camera } from 'three';
    import { EventDispatcher } from 'three';
    import { MOUSE, TOUCH } from 'three';
    import { Vector3 } from 'three';
  
    export class OrbitControls extends EventDispatcher {
      constructor(object: Camera, domElement?: HTMLElement);
      target: Vector3;
      update(): void;
      dispose(): void;
      enableDamping: boolean;
    }
  }
  
  declare module 'three/examples/jsm/effects/OutlineEffect' {
    import { WebGLRenderer, Scene, Camera, WebGLRenderTarget } from 'three';
    export class OutlineEffect extends WebGLRenderer {
      constructor(renderer: WebGLRenderer, parameters?: object);
      render(scene: Scene, camera: Camera, renderTarget?: WebGLRenderTarget): void;
    }
  }