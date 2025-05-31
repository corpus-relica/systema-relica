import React from "react";

/**
 * Three.js mocks for 3d-graph-ui testing
 * Provides mock implementations of Three.js classes and utilities
 */

// Mock Vector3
export class MockVector3 {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: MockVector3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: MockVector3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: MockVector3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): this {
    const length = this.length();
    if (length > 0) {
      this.multiplyScalar(1 / length);
    }
    return this;
  }

  distanceTo(v: MockVector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  clone(): MockVector3 {
    return new MockVector3(this.x, this.y, this.z);
  }
}

// Mock Object3D
export class MockObject3D {
  public position: MockVector3;
  public rotation: MockVector3;
  public scale: MockVector3;
  public children: MockObject3D[];
  public parent: MockObject3D | null;
  public visible: boolean;
  public userData: any;
  public uuid: string;

  constructor() {
    this.position = new MockVector3();
    this.rotation = new MockVector3();
    this.scale = new MockVector3(1, 1, 1);
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.userData = {};
    this.uuid = Math.random().toString(36).substr(2, 9);
  }

  add(object: MockObject3D): this {
    this.children.push(object);
    object.parent = this;
    return this;
  }

  remove(object: MockObject3D): this {
    const index = this.children.indexOf(object);
    if (index !== -1) {
      this.children.splice(index, 1);
      object.parent = null;
    }
    return this;
  }

  traverse(callback: (object: MockObject3D) => void): void {
    callback(this);
    this.children.forEach((child) => child.traverse(callback));
  }

  clone(): MockObject3D {
    const cloned = new MockObject3D();
    cloned.position.copy(this.position);
    cloned.rotation.copy(this.rotation);
    cloned.scale.copy(this.scale);
    cloned.visible = this.visible;
    cloned.userData = { ...this.userData };
    return cloned;
  }
}

// Mock Mesh
export class MockMesh extends MockObject3D {
  public geometry: any;
  public material: any;

  constructor(geometry?: any, material?: any) {
    super();
    this.geometry = geometry;
    this.material = material;
  }
}

// Mock Scene
export class MockScene extends MockObject3D {
  public type: string = "Scene";
  public background: any = null;
  public fog: any = null;

  constructor() {
    super();
  }
}

// Mock Camera
export class MockCamera extends MockObject3D {
  public type: string = "Camera";
  public matrixWorldInverse: any = {};
  public projectionMatrix: any = {};

  constructor() {
    super();
  }

  updateMatrixWorld(): void {
    // Mock implementation
  }
}

// Mock PerspectiveCamera
export class MockPerspectiveCamera extends MockCamera {
  public fov: number;
  public aspect: number;
  public near: number;
  public far: number;

  constructor(
    fov: number = 50,
    aspect: number = 1,
    near: number = 0.1,
    far: number = 2000
  ) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  updateProjectionMatrix(): void {
    // Mock implementation
  }
}

// Mock WebGLRenderer
export class MockWebGLRenderer {
  public domElement: HTMLCanvasElement;
  public shadowMap: any;
  public outputColorSpace: string;

  constructor(parameters?: any) {
    this.domElement = document.createElement("canvas");
    this.shadowMap = { enabled: false, type: "PCFShadowMap" };
    this.outputColorSpace = "srgb";
  }

  setSize(width: number, height: number): void {
    this.domElement.width = width;
    this.domElement.height = height;
  }

  render(scene: MockScene, camera: MockCamera): void {
    // Mock render implementation
  }

  dispose(): void {
    // Mock cleanup
  }
}

// Mock Raycaster
export class MockRaycaster {
  public ray: any;
  public near: number;
  public far: number;

  constructor() {
    this.ray = { origin: new MockVector3(), direction: new MockVector3() };
    this.near = 0;
    this.far = Infinity;
  }

  setFromCamera(coords: { x: number; y: number }, camera: MockCamera): void {
    // Mock implementation
  }

  intersectObjects(objects: MockObject3D[], recursive?: boolean): any[] {
    // Mock intersection results
    return [];
  }
}

// Mock geometries
export class MockBoxGeometry {
  public parameters: any;

  constructor(width: number = 1, height: number = 1, depth: number = 1) {
    this.parameters = { width, height, depth };
  }
}

export class MockSphereGeometry {
  public parameters: any;

  constructor(
    radius: number = 1,
    widthSegments: number = 32,
    heightSegments: number = 16
  ) {
    this.parameters = { radius, widthSegments, heightSegments };
  }
}

// Mock materials
export class MockMeshBasicMaterial {
  public color: any;
  public transparent: boolean;
  public opacity: number;

  constructor(parameters?: any) {
    this.color = { r: 1, g: 1, b: 1 };
    this.transparent = false;
    this.opacity = 1;

    if (parameters) {
      Object.assign(this, parameters);
    }
  }
}

export class MockMeshStandardMaterial extends MockMeshBasicMaterial {
  public metalness: number;
  public roughness: number;

  constructor(parameters?: any) {
    super(parameters);
    this.metalness = 0;
    this.roughness = 1;

    if (parameters) {
      Object.assign(this, parameters);
    }
  }
}

// Mock Three.js module
export const mockThree = {
  Vector3: MockVector3,
  Object3D: MockObject3D,
  Mesh: MockMesh,
  Scene: MockScene,
  Camera: MockCamera,
  PerspectiveCamera: MockPerspectiveCamera,
  WebGLRenderer: MockWebGLRenderer,
  Raycaster: MockRaycaster,
  BoxGeometry: MockBoxGeometry,
  SphereGeometry: MockSphereGeometry,
  MeshBasicMaterial: MockMeshBasicMaterial,
  MeshStandardMaterial: MockMeshStandardMaterial,

  // Constants
  PCFShadowMap: "PCFShadowMap",
  sRGBEncoding: "sRGBEncoding",
  LinearEncoding: "LinearEncoding",

  // Math utilities
  MathUtils: {
    degToRad: (degrees: number) => degrees * (Math.PI / 180),
    radToDeg: (radians: number) => radians * (180 / Math.PI),
    clamp: (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value)),
  },
};

// Setup function for Jest
export const setupThreeMock = (): void => {
  jest.doMock("three", () => mockThree);

  // Mock @react-three/fiber
  jest.doMock("@react-three/fiber", () => ({
    Canvas: ({ children, ...props }: any) =>
      React.createElement(
        "div",
        { "data-testid": "three-canvas", ...props },
        children
      ),
    useFrame: jest.fn(),
    useThree: jest.fn(() => ({
      scene: new MockScene(),
      camera: new MockPerspectiveCamera(),
      gl: new MockWebGLRenderer(),
      size: { width: 800, height: 600 },
    })),
    extend: jest.fn(),
  }));

  // Mock @react-three/drei
  jest.doMock("@react-three/drei", () => ({
    OrbitControls: ({ children, ...props }: any) =>
      React.createElement(
        "div",
        { "data-testid": "orbit-controls", ...props },
        children
      ),
    Stats: () => React.createElement("div", { "data-testid": "stats" }),
    Grid: () => React.createElement("div", { "data-testid": "grid" }),
    Environment: () =>
      React.createElement("div", { "data-testid": "environment" }),
  }));
};

// Cleanup function
export const cleanupThreeMock = (): void => {
  jest.dontMock("three");
  jest.dontMock("@react-three/fiber");
  jest.dontMock("@react-three/drei");
};
