/**
 * Type declarations for React Three Fiber and Drei
 * This resolves type conflicts with these libraries
 */

declare module '@react-three/drei' {
  // Add essential component declarations
  import { ReactNode } from 'react';
  
  export const OrbitControls: React.FC<any>;
  export const Text: React.FC<any>;
  
  // Any other drei components used in the app should be declared here
}

declare module '@react-three/fiber' {
  import { ReactNode } from 'react';
  import { Camera, Scene, WebGLRenderer } from 'three';

  export const Canvas: React.FC<any>;
  export function useThree(): {
    camera: Camera;
    scene: Scene;
    renderer: WebGLRenderer;
    [key: string]: any;
  };

  // Add Three.js JSX element types
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      line: any;
      lineBasicMaterial: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      bufferGeometry: any;
      ambientLight: any;
      pointLight: any;
      // Add other elements as needed
    }
  }
}
