/**
 * Testing preset for 3d-graph-ui package
 * Configures all necessary mocks and utilities for 3D graph component testing
 */

import { setupPackageTesting } from "../index";

/**
 * Setup testing environment specifically for 3d-graph-ui components
 * Includes Three.js, WebSocket, Axios, and MobX mocks
 */
export const setup3DGraphUITesting = (): void => {
  setupPackageTesting("3d-graph-ui");
};

// Re-export commonly used utilities for convenience
export {
  setupThreeMock,
  cleanupThreeMock,
  mockThree,
  setupGlobalWebSocketMock,
  cleanupGlobalWebSocketMock,
  MockWebSocket,
  setupAxiosMock,
  cleanupAxiosMock,
  createMockResponse,
  createMockError,
  configureMobxForTesting,
  setupMobxMock,
  cleanupMobxMock,
  MockStoreFactory,
  createMockStoreContext,
  testUtils,
  createMockEntity,
  createMockUser,
  createMockRelation,
  createMockFact,
  createTestScenario,
} from "../index";

// 3D Graph specific test utilities
export const graphTestUtils = {
  /**
   * Create a mock 3D scene for testing
   */
  createMockScene: () => ({
    add: jest.fn(),
    remove: jest.fn(),
    children: [],
    traverse: jest.fn(),
    getObjectByName: jest.fn(),
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }),

  /**
   * Create mock graph data for testing
   */
  createMockGraphData: (nodeCount: number = 5, linkCount: number = 4) => ({
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
    })),
    links: Array.from({ length: linkCount }, (_, i) => ({
      id: `link-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
    })),
  }),

  /**
   * Mock camera for 3D testing
   */
  createMockCamera: () => ({
    position: { x: 0, y: 0, z: 10 },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
    aspect: 1,
    fov: 75,
    near: 0.1,
    far: 1000,
  }),

  /**
   * Mock renderer for 3D testing
   */
  createMockRenderer: () => ({
    render: jest.fn(),
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    domElement: document.createElement("canvas"),
    dispose: jest.fn(),
  }),
};

export default setup3DGraphUITesting;
