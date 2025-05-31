/**
 * Shared Testing Infrastructure
 * Main entry point for all shared testing utilities
 */

// Export all mocks
export * from "./mocks/websocket";
export * from "./mocks/axios";
export * from "./mocks/three";
export * from "./mocks/mui";
export * from "./mocks/mobx";

// Export helpers
export * from "./helpers/websocketHelpers";

// Export fixtures
export * from "./fixtures";

// Export setup utilities
export * from "./setup/jest";

// Re-export commonly used items for convenience
export {
  MockWebSocket,
  setupGlobalWebSocketMock,
  cleanupGlobalWebSocketMock,
} from "./mocks/websocket";

export {
  setupAxiosMock,
  createMockResponse,
  createMockError,
  cleanupAxiosMock,
} from "./mocks/axios";

export { setupThreeMock, cleanupThreeMock, mockThree } from "./mocks/three";

export {
  setupMuiMock,
  cleanupMuiMock,
  mockMuiComponents,
  mockMuiIcons,
  mockTheme,
} from "./mocks/mui";

export {
  configureMobxForTesting,
  setupMobxMock,
  cleanupMobxMock,
  MockStoreFactory,
  createMockStoreContext,
  mockTestData,
} from "./mocks/mobx";

export {
  setupMockWebSocket,
  cleanupMockWebSocket,
  waitForWebSocketMessage,
  expectWebSocketMessage,
  simulateWebSocketFlow,
  createMockAuthContext,
} from "./helpers/websocketHelpers";

export {
  testFixtures,
  createMockEntity,
  createMockUser,
  createMockRelation,
  createMockFact,
  createTestScenario,
} from "./fixtures";

export {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupCustomMatchers,
  setupTests,
  waitFor,
  withTimeout,
} from "./setup/jest";

// Export preset functions
export { setup3DGraphUITesting } from "./presets/3d-graph-ui";
export { setupFactSearchUITesting } from "./presets/fact-search-ui";
export { setupViewfinderTesting } from "./presets/viewfinder";

// Import for internal use
import {
  setupTestEnvironment as _setupTestEnvironment,
  cleanupTestEnvironment as _cleanupTestEnvironment,
  setupCustomMatchers as _setupCustomMatchers,
} from "./setup/jest";

// Default configuration presets for different package types
export const testingPresets = {
  // For 3d-graph-ui package
  "3d-graph-ui": {
    enableMobx: true,
    enableWebSocket: true,
    enableAxios: true,
    enableThree: true,
    enableMui: false,
  },

  // For fact-search-ui package
  "fact-search-ui": {
    enableMobx: true,
    enableWebSocket: true,
    enableAxios: true,
    enableThree: false,
    enableMui: true,
  },

  // For viewfinder package
  viewfinder: {
    enableMobx: true,
    enableWebSocket: true,
    enableAxios: true,
    enableThree: true,
    enableMui: true,
  },

  // Minimal preset for basic testing
  minimal: {
    enableMobx: true,
    enableWebSocket: false,
    enableAxios: false,
    enableThree: false,
    enableMui: false,
  },

  // Full preset with all features
  full: {
    enableMobx: true,
    enableWebSocket: true,
    enableAxios: true,
    enableThree: true,
    enableMui: true,
  },
};

// Convenience function to setup testing for a specific package
export const setupPackageTesting = (
  packageName: keyof typeof testingPresets
): void => {
  const preset = testingPresets[packageName];
  if (!preset) {
    throw new Error(`Unknown package preset: ${packageName}`);
  }

  _setupTestEnvironment(preset);
  _setupCustomMatchers();
};

// Common test utilities that don't fit in other categories
export const testUtils = {
  // Generate random test IDs
  generateTestId: (prefix: string = "test"): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create mock event objects
  createMockEvent: (type: string, properties: any = {}): Event => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },

  // Create mock React synthetic events
  createMockSyntheticEvent: (
    nativeEvent: any = {},
    properties: any = {}
  ): any => {
    return {
      nativeEvent,
      currentTarget: null,
      target: null,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      preventDefault: jest.fn(),
      isDefaultPrevented: jest.fn(() => false),
      stopPropagation: jest.fn(),
      isPropagationStopped: jest.fn(() => false),
      persist: jest.fn(),
      timeStamp: Date.now(),
      type: "click",
      ...properties,
    };
  },

  // Sleep utility for async tests
  sleep: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Mock fetch responses
  mockFetch: (
    response: any,
    options: { status?: number; ok?: boolean } = {}
  ): void => {
    const { status = 200, ok = true } = options;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        headers: new Headers(),
        redirected: false,
        statusText: ok ? "OK" : "Error",
        type: "basic",
        url: "http://localhost:3000/api/test",
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        bytes: () => Promise.resolve(new Uint8Array()),
        formData: () => Promise.resolve(new FormData()),
      } as unknown as Response)
    );
  },

  // Restore original fetch
  restoreFetch: (): void => {
    if (jest.isMockFunction(global.fetch)) {
      (global.fetch as jest.Mock).mockRestore();
    }
  },

  // Mock performance.now for consistent timing in tests
  mockPerformanceNow: (startTime: number = 0): void => {
    let currentTime = startTime;
    global.performance.now = jest.fn(() => {
      currentTime += 16; // Simulate 60fps
      return currentTime;
    });
  },

  // Restore performance.now
  restorePerformanceNow: (): void => {
    if (jest.isMockFunction(global.performance.now)) {
      (global.performance.now as jest.Mock).mockRestore();
    }
  },
};

// Export test utils as default for convenience
export default {
  ...testUtils,
  setupPackageTesting,
  testingPresets,
  setupTestEnvironment: _setupTestEnvironment,
  cleanupTestEnvironment: _cleanupTestEnvironment,
};
