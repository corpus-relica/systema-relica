/**
 * Tests for useMouseRaycast hook - 3d-graph-ui package
 * Tests custom hook for 3D mouse raycasting functionality
 */

import { renderHook, act } from "@testing-library/react";
import useMouseRaycast from "../../useMouseRaycast";
import * as THREE from "three";

// Setup testing environment for 3d-graph-ui
// setupPackageTesting("3d-graph-ui");

// Mock @react-three/fiber
const mockUseThree = jest.fn();
const mockUseFrame = jest.fn();

jest.mock("@react-three/fiber", () => ({
  useThree: () => mockUseThree(),
  useFrame: (callback: () => void) => mockUseFrame(callback),
}));

// Mock Three.js
const mockRaycaster = {
  setFromCamera: jest.fn(),
  intersectObjects: jest.fn(),
};

const mockCamera = {
  position: { x: 0, y: 0, z: 45 },
};

const mockScene = {
  children: [],
};

const mockGl = {
  domElement: {
    getBoundingClientRect: jest.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })),
  },
};

jest.mock("three", () => ({
  Raycaster: jest.fn(() => mockRaycaster),
  Vector2: jest.fn(() => ({ x: 0, y: 0 })),
}));

describe("useMouseRaycast", () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCallback = jest.fn();

    // Setup default mock returns
    mockUseThree.mockReturnValue({
      camera: mockCamera,
      scene: mockScene,
      gl: mockGl,
    });

    mockRaycaster.setFromCamera.mockClear();
    mockRaycaster.intersectObjects.mockClear();

    // Mock window event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize raycaster", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      expect(THREE.Raycaster).toHaveBeenCalled();
      expect(THREE.Vector2).toHaveBeenCalled();
    });

    it("should setup mouse move event listener", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      expect(window.addEventListener).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function)
      );
    });

    it("should get three.js context", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      expect(mockUseThree).toHaveBeenCalled();
    });

    it("should register frame callback", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      expect(mockUseFrame).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Mouse Movement Handling", () => {
    it("should update mouse coordinates on mouse move", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      // Get the event listener that was registered
      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const mouseMoveHandler = mouseMoveCall[1];

      // Simulate mouse move event
      const mockEvent = {
        clientX: 400,
        clientY: 300,
      };

      act(() => {
        mouseMoveHandler(mockEvent);
      });

      // Verify getBoundingClientRect was called
      expect(mockGl.domElement.getBoundingClientRect).toHaveBeenCalled();

      unmount();
    });

    it("should calculate normalized device coordinates correctly", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const mouseMoveHandler = mouseMoveCall[1];

      // Mock getBoundingClientRect to return specific values
      mockGl.domElement.getBoundingClientRect.mockReturnValue({
        left: 100,
        top: 50,
        width: 800,
        height: 600,
      });

      const mockEvent = {
        clientX: 500, // 400 pixels from left edge of canvas
        clientY: 350, // 300 pixels from top edge of canvas
      };

      act(() => {
        mouseMoveHandler(mockEvent);
      });

      // Expected normalized coordinates:
      // x: ((400) / 800) * 2 - 1 = 0
      // y: -((300) / 600) * 2 + 1 = 0

      unmount();
    });

    it("should handle edge coordinates", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const mouseMoveHandler = mouseMoveCall[1];

      // Test top-left corner
      const topLeftEvent = {
        clientX: 0,
        clientY: 0,
      };

      act(() => {
        mouseMoveHandler(topLeftEvent);
      });

      // Test bottom-right corner
      const bottomRightEvent = {
        clientX: 800,
        clientY: 600,
      };

      act(() => {
        mouseMoveHandler(bottomRightEvent);
      });

      unmount();
    });
  });

  describe("Raycasting", () => {
    it("should perform raycasting on each frame", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      // Get the frame callback that was registered
      const frameCallback = mockUseFrame.mock.calls[0][0];

      // Mock no intersections
      mockRaycaster.intersectObjects.mockReturnValue([]);

      act(() => {
        frameCallback();
      });

      expect(mockRaycaster.setFromCamera).toHaveBeenCalled();
      expect(mockRaycaster.intersectObjects).toHaveBeenCalledWith(
        mockScene.children,
        true
      );
    });

    it("should call callback with intersection when objects are hit", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];

      const mockIntersection = {
        object: { name: "test-object" },
        point: { x: 1, y: 2, z: 3 },
        distance: 5,
      };

      mockRaycaster.intersectObjects.mockReturnValue([
        mockIntersection,
        { distance: 10 }, // Further object
      ]);

      act(() => {
        frameCallback();
      });

      expect(mockCallback).toHaveBeenCalledWith(mockIntersection);
    });

    it("should call callback with null when no objects are hit", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];

      mockRaycaster.intersectObjects.mockReturnValue([]);

      act(() => {
        frameCallback();
      });

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it("should return closest intersection when multiple objects are hit", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];

      const closestIntersection = {
        object: { name: "closest" },
        distance: 2,
      };

      const fartherIntersection = {
        object: { name: "farther" },
        distance: 5,
      };

      mockRaycaster.intersectObjects.mockReturnValue([
        closestIntersection,
        fartherIntersection,
      ]);

      act(() => {
        frameCallback();
      });

      expect(mockCallback).toHaveBeenCalledWith(closestIntersection);
    });
  });

  describe("Cleanup", () => {
    it("should remove event listener on unmount", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function)
      );
    });

    it("should remove the same event listener that was added", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      // Get the handler that was added
      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const addedHandler = mouseMoveCall[1];

      unmount();

      // Verify the same handler was removed
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "mousemove",
        addedHandler
      );
    });
  });

  describe("Callback Handling", () => {
    it("should handle callback changes", () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();

      const { rerender } = renderHook(
        ({ callback }) => useMouseRaycast(callback),
        { initialProps: { callback: firstCallback } }
      );

      // Trigger raycasting with first callback
      let frameCallback = mockUseFrame.mock.calls[0][0];
      mockRaycaster.intersectObjects.mockReturnValue([]);

      act(() => {
        frameCallback();
      });

      expect(firstCallback).toHaveBeenCalledWith(null);
      expect(secondCallback).not.toHaveBeenCalled();

      // Change callback
      rerender({ callback: secondCallback });

      // Get the new frame callback after rerender
      frameCallback =
        mockUseFrame.mock.calls[mockUseFrame.mock.calls.length - 1][0];

      // Trigger raycasting with second callback
      act(() => {
        frameCallback();
      });

      expect(secondCallback).toHaveBeenCalledWith(null);
    });

    it("should handle undefined callback gracefully", () => {
      expect(() => {
        renderHook(() => useMouseRaycast(undefined));
      }).not.toThrow();
    });

    it("should handle null callback gracefully", () => {
      expect(() => {
        renderHook(() => useMouseRaycast(null));
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing gl.domElement", () => {
      mockUseThree.mockReturnValue({
        camera: mockCamera,
        scene: mockScene,
        gl: { domElement: null },
      });

      expect(() => {
        renderHook(() => useMouseRaycast(mockCallback));
      }).not.toThrow();
    });

    it("should handle missing scene.children", () => {
      mockUseThree.mockReturnValue({
        camera: mockCamera,
        scene: { children: null },
        gl: mockGl,
      });

      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];

      expect(() => {
        frameCallback();
      }).not.toThrow();

      unmount();
    });

    it("should handle raycaster errors", () => {
      mockRaycaster.intersectObjects.mockImplementation(() => {
        throw new Error("Raycaster error");
      });

      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];

      expect(() => {
        frameCallback();
      }).toThrow("Raycaster error");

      unmount();
    });
  });

  describe("Performance", () => {
    it("should not create new raycaster on re-renders", () => {
      const { rerender } = renderHook(() => useMouseRaycast(mockCallback));

      const initialCallCount = (THREE.Raycaster as jest.Mock).mock.calls.length;

      rerender();
      rerender();

      expect((THREE.Raycaster as jest.Mock).mock.calls.length).toBe(
        initialCallCount
      );
    });

    it("should handle rapid mouse movements", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const mouseMoveHandler = mouseMoveCall[1];

      // Simulate rapid mouse movements
      for (let i = 0; i < 100; i++) {
        const mockEvent = {
          clientX: i * 8,
          clientY: i * 6,
        };

        act(() => {
          mouseMoveHandler(mockEvent);
        });
      }

      expect(mockGl.domElement.getBoundingClientRect).toHaveBeenCalledTimes(
        100
      );

      unmount();
    });

    it("should handle high frame rates", () => {
      renderHook(() => useMouseRaycast(mockCallback));

      const frameCallback = mockUseFrame.mock.calls[0][0];
      mockRaycaster.intersectObjects.mockReturnValue([]);

      // Simulate 60 FPS for 1 second
      for (let i = 0; i < 60; i++) {
        act(() => {
          frameCallback();
        });
      }

      expect(mockRaycaster.setFromCamera).toHaveBeenCalledTimes(60);
      expect(mockRaycaster.intersectObjects).toHaveBeenCalledTimes(60);
      expect(mockCallback).toHaveBeenCalledTimes(60);
    });
  });

  describe("Integration", () => {
    it("should work with real-world coordinate transformations", () => {
      const { unmount } = renderHook(() => useMouseRaycast(mockCallback));

      // Setup realistic canvas dimensions
      mockGl.domElement.getBoundingClientRect.mockReturnValue({
        left: 50,
        top: 100,
        width: 1200,
        height: 800,
      });

      const addEventListenerCalls = (window.addEventListener as jest.Mock).mock
        .calls;
      const mouseMoveCall = addEventListenerCalls.find(
        (call) => call[0] === "mousemove"
      );
      const mouseMoveHandler = mouseMoveCall[1];

      // Test center of canvas
      const centerEvent = {
        clientX: 650, // 50 + 600 (center of 1200px width)
        clientY: 500, // 100 + 400 (center of 800px height)
      };

      act(() => {
        mouseMoveHandler(centerEvent);
      });

      // Test raycasting
      const frameCallback = mockUseFrame.mock.calls[0][0];
      const mockIntersection = {
        object: { userData: { id: "node-123" } },
        point: { x: 0, y: 0, z: 0 },
      };

      mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

      act(() => {
        frameCallback();
      });

      expect(mockCallback).toHaveBeenCalledWith(mockIntersection);

      unmount();
    });
  });
});
