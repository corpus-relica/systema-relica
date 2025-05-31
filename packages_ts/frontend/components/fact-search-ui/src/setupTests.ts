/**
 * Setup file for Jest tests
 * This file is executed before each test file
 */

import "@testing-library/jest-dom";

// Setup testing environment for fact-search-ui package
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Mock WebSocket for testing
Object.defineProperty(global, "WebSocket", {
  value: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  })),
  writable: true,
});

// Mock performance.now for consistent timing
global.performance.now = jest.fn(() => Date.now());

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Material-UI mocks are handled by Jest moduleNameMapper configuration
