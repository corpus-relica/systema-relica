/**
 * Jest setup utilities and configuration helpers
 * Provides common Jest setup patterns for all packages
 */

import { configureMobxForTesting, setupMobxMock } from "../mocks/mobx";
import { setupGlobalWebSocketMock } from "../mocks/websocket";
import { setupAxiosMock } from "../mocks/axios";
import { setupThreeMock } from "../mocks/three";
import { setupMuiMock } from "../mocks/mui";

// Global test environment setup
export const setupTestEnvironment = (
  options: {
    enableMobx?: boolean;
    enableWebSocket?: boolean;
    enableAxios?: boolean;
    enableThree?: boolean;
    enableMui?: boolean;
    customSetup?: () => void;
  } = {}
): void => {
  const {
    enableMobx = true,
    enableWebSocket = true,
    enableAxios = true,
    enableThree = false,
    enableMui = false,
    customSetup,
  } = options;

  // Configure MobX for testing
  if (enableMobx) {
    configureMobxForTesting();
    setupMobxMock();
  }

  // Setup WebSocket mocks
  if (enableWebSocket) {
    setupGlobalWebSocketMock();
  }

  // Setup Axios mocks
  if (enableAxios) {
    setupAxiosMock();
  }

  // Setup Three.js mocks (for 3d-graph-ui)
  if (enableThree) {
    setupThreeMock();
  }

  // Setup Material-UI mocks (for fact-search-ui)
  if (enableMui) {
    setupMuiMock();
  }

  // Mock common browser APIs
  setupBrowserMocks();

  // Mock console methods in test environment
  setupConsoleMocks();

  // Setup custom configuration
  if (customSetup) {
    customSetup();
  }
};

// Browser API mocks
export const setupBrowserMocks = (): void => {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock window.IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock,
  });

  // Mock window.location
  delete (window as any).location;
  window.location = {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    pathname: "/",
    search: "",
    hash: "",
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    toString: jest.fn(() => "http://localhost:3000"),
  } as any;

  // Mock window.history
  Object.defineProperty(window, "history", {
    value: {
      pushState: jest.fn(),
      replaceState: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      go: jest.fn(),
      length: 1,
      state: null,
    },
    writable: true,
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

  // Mock URL constructor
  global.URL.createObjectURL = jest.fn(() => "mock-object-url");
  global.URL.revokeObjectURL = jest.fn();

  // Mock Blob constructor
  global.Blob = jest.fn().mockImplementation((content, options) => ({
    size: content ? content.length : 0,
    type: options?.type || "",
    arrayBuffer: jest.fn(),
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn(),
  }));

  // Mock File constructor
  global.File = jest.fn().mockImplementation((content, name, options) => ({
    ...new Blob(content, options),
    name,
    lastModified: Date.now(),
    webkitRelativePath: "",
  }));

  // Mock FileReader
  const MockFileReader = jest.fn().mockImplementation(() => ({
    readAsText: jest.fn(),
    readAsDataURL: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    readAsBinaryString: jest.fn(),
    abort: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
  }));

  // Add static constants
  (MockFileReader as any).EMPTY = 0;
  (MockFileReader as any).LOADING = 1;
  (MockFileReader as any).DONE = 2;

  global.FileReader = MockFileReader as any;
};

// Console mocks for cleaner test output
export const setupConsoleMocks = (): void => {
  // Suppress console.error in tests unless explicitly needed
  const originalError = console.error;
  console.error = jest.fn((...args) => {
    // Only show React warnings and actual errors
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Warning:") ||
        message.includes("Error:") ||
        process.env.SHOW_CONSOLE_ERRORS === "true")
    ) {
      originalError(...args);
    }
  });

  // Suppress console.warn in tests
  const originalWarn = console.warn;
  console.warn = jest.fn((...args) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      process.env.SHOW_CONSOLE_WARNINGS === "true"
    ) {
      originalWarn(...args);
    }
  });

  // Keep console.log for debugging
  if (process.env.SUPPRESS_CONSOLE_LOG === "true") {
    console.log = jest.fn();
  }
};

// Test cleanup utilities
export const cleanupTestEnvironment = (): void => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset modules
  jest.resetModules();

  // Clear timers
  jest.clearAllTimers();

  // Restore console methods
  if (jest.isMockFunction(console.error)) {
    (console.error as jest.Mock).mockRestore();
  }
  if (jest.isMockFunction(console.warn)) {
    (console.warn as jest.Mock).mockRestore();
  }
  if (jest.isMockFunction(console.log)) {
    (console.log as jest.Mock).mockRestore();
  }
};

// Custom Jest matchers
export const setupCustomMatchers = (): void => {
  expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
      const pass = received >= floor && received <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },

    toHaveBeenCalledWithObjectContaining(received: jest.Mock, expected: any) {
      const calls = received.mock.calls;
      const pass = calls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === "object" &&
            Object.keys(expected).every((key) => arg[key] === expected[key])
        )
      );

      if (pass) {
        return {
          message: () =>
            `expected mock not to have been called with object containing ${JSON.stringify(expected)}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected mock to have been called with object containing ${JSON.stringify(expected)}`,
          pass: false,
        };
      }
    },

    toBeValidUUID(received: string) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const pass = uuidRegex.test(received);

      if (pass) {
        return {
          message: () => `expected ${received} not to be a valid UUID`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid UUID`,
          pass: false,
        };
      }
    },

    toBeValidDate(received: any) {
      const pass = received instanceof Date && !isNaN(received.getTime());

      if (pass) {
        return {
          message: () => `expected ${received} not to be a valid Date`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid Date`,
          pass: false,
        };
      }
    },
  });
};

// Test timeout utilities
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  timeoutMessage: string = "Operation timed out"
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};

// Async test helpers
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> => {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = "Condition not met within timeout",
  } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(timeoutMessage);
};

// Mock timer utilities
export const advanceTimersByTime = (ms: number): void => {
  if (jest.isMockFunction(setTimeout)) {
    jest.advanceTimersByTime(ms);
  }
};

export const runAllTimers = (): void => {
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  }
};

// Export setup function for use in setupFilesAfterEnv
export const setupTests = (): void => {
  setupTestEnvironment();
  setupCustomMatchers();
};

// Default export for easy importing
export default {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupCustomMatchers,
  setupBrowserMocks,
  setupConsoleMocks,
  withTimeout,
  waitFor,
  advanceTimersByTime,
  runAllTimers,
  setupTests,
};
