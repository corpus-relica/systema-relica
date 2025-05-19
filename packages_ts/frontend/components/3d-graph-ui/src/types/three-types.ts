import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

// Properly type refs for Three.js objects
export type MeshRefType = React.RefObject<THREE.Mesh>;
export type GroupRefType = React.RefObject<THREE.Group>;
export type TextRefType = React.RefObject<THREE.Object3D>;

// Type for OrbitControls
export type OrbitControlsRefType = React.RefObject<
  typeof OrbitControls & {
    target: THREE.Vector3;
    update: () => void;
  }
>;

// Type for mouse event intersections
export interface ThreeIntersection {
  object: THREE.Object3D & {
    userData: {
      uid: number;
      type: string;
    };
  };
  point: THREE.Vector3;
  distance: number;
}

// Type for geometry bounds
export interface GeometryBounds {
  max: THREE.Vector3;
  min: THREE.Vector3;
}

// Type for mouse position
export interface MousePosition {
  x: number;
  y: number;
}

// Type for DOM mouse event
export interface DOMMouseEvent {
  altKey: boolean;
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  movementX: number;
  movementY: number;
  pageX: number;
  pageY: number;
  relatedTarget: EventTarget | null;
  screenX: number;
  screenY: number;
  shiftKey: boolean;
  type: string;
}
