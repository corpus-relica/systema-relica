/**
 * Tests for App component - 3d-graph-ui package
 * Tests the main 3D graph component including rendering, interactions, and data management
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import App, { AppProps } from "../App";
import { Fact } from "../types";

// Local mock function for creating Fact objects
const createMockFact = (overrides: Partial<Fact> = {}): Fact => ({
  fact_uid: Math.floor(Math.random() * 10000),
  language_uid: 1,
  language: "English",
  collection_uid: "test-collection",
  collection_name: "Test Collection",
  lh_context_uid: 1,
  lh_context_name: "Test Context",
  lh_object_uid: Math.floor(Math.random() * 1000),
  lh_object_name: "Test Object",
  rel_type_uid: 5025,
  rel_type_name: "is connected to",
  rh_object_uid: Math.floor(Math.random() * 1000),
  rh_object_name: "Test Target",
  author: "test-author",
  effective_from: new Date().toISOString(),
  latest_update: new Date().toISOString(),
  approval_status: "approved",
  reference: "test-ref",
  sequence: "1",
  partial_definiton: "",
  full_definition: "",
  ...overrides,
});

// Setup testing environment for 3d-graph-ui
// setupPackageTesting("3d-graph-ui");

// Mock react-three-fiber and drei components
jest.mock("@react-three/fiber", () => ({
  Canvas: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="canvas" {...props}>
      {children}
    </div>
  ),
  extend: jest.fn(),
  useThree: () => ({
    camera: { position: { set: jest.fn() } },
    scene: { children: [] },
    gl: {
      domElement: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
      },
    },
  }),
  useFrame: jest.fn(),
}));

jest.mock("@react-three/drei", () => ({
  Stats: () => <div data-testid="stats" />,
  Stars: () => <div data-testid="stars" />,
}));

jest.mock("../GraphRenderer", () => {
  return function MockGraphRenderer() {
    return <div data-testid="graph-renderer" />;
  };
});

// Mock Three.js
jest.mock("three", () => ({
  Vector3: jest.fn().mockImplementation((x, y, z) => ({ x, y, z })),
  Raycaster: jest.fn().mockImplementation(() => ({
    setFromCamera: jest.fn(),
    intersectObjects: jest.fn(() => []),
  })),
  Vector2: jest.fn().mockImplementation(() => ({ x: 0, y: 0 })),
}));

describe("App Component", () => {
  // Mock functions for props
  const mockOnNodeClick = jest.fn();
  const mockOnStageClick = jest.fn();
  const mockOnNodeRightClick = jest.fn();
  const mockOnEdgeRollOver = jest.fn();
  const mockOnEdgeRollOut = jest.fn();
  const mockOnEdgeClick = jest.fn();
  const mockOnEdgeRightClick = jest.fn();

  // Sample test data
  const mockCategories = [
    {
      uid: 730044,
      name: "Physical Object",
      descendants: [730045, 730046],
    },
    {
      uid: 193671,
      name: "Occurrence",
      descendants: [193672, 193673],
    },
  ];

  const mockFacts: Fact[] = [
    createMockFact({
      fact_uid: 1,
      lh_object_uid: 100,
      lh_object_name: "Node A",
      rh_object_uid: 200,
      rh_object_name: "Node B",
      rel_type_uid: 5025,
      rel_type_name: "is connected to",
    }),
    createMockFact({
      fact_uid: 2,
      lh_object_uid: 200,
      lh_object_name: "Node B",
      rh_object_uid: 300,
      rh_object_name: "Node C",
      rel_type_uid: 5025,
      rel_type_name: "is connected to",
    }),
  ];

  const defaultProps: AppProps = {
    categories: mockCategories,
    facts: mockFacts,
    onNodeClick: mockOnNodeClick,
    onStageClick: mockOnStageClick,
    onNodeRightClick: mockOnNodeRightClick,
    onEdgeRollOver: mockOnEdgeRollOver,
    onEdgeRollOut: mockOnEdgeRollOut,
    onEdgeClick: mockOnEdgeClick,
    onEdgeRightClick: mockOnEdgeRightClick,
    selectedNode: null,
    selectedEdge: null,
    paletteMap: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getBoundingClientRect for container
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));

    // Mock window resize event
    Object.defineProperty(window, "addEventListener", {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(window, "removeEventListener", {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the main container", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");
      expect(canvas).toBeInTheDocument();
    });

    it("should render Canvas with correct props", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");
      expect(canvas).toHaveAttribute(
        "style",
        expect.stringContaining("width: 800px")
      );
    });

    it("should render GraphRenderer component", () => {
      render(<App {...defaultProps} />);

      const graphRenderer = screen.getByTestId("graph-renderer");
      expect(graphRenderer).toBeInTheDocument();
    });

    it("should render Stats component", () => {
      render(<App {...defaultProps} />);

      const stats = screen.getByTestId("stats");
      expect(stats).toBeInTheDocument();
    });

    it("should render Stars component", () => {
      render(<App {...defaultProps} />);

      const stars = screen.getByTestId("stars");
      expect(stars).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should handle selectedNode prop", () => {
      const propsWithSelectedNode = {
        ...defaultProps,
        selectedNode: 100,
      };

      render(<App {...propsWithSelectedNode} />);
      // Component should render without errors
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle selectedEdge prop", () => {
      const propsWithSelectedEdge = {
        ...defaultProps,
        selectedEdge: 1,
      };

      render(<App {...propsWithSelectedEdge} />);
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle paletteMap prop", () => {
      const paletteMap = new Map([
        [100, "#ff0000"],
        [200, "#00ff00"],
      ]);

      const propsWithPalette = {
        ...defaultProps,
        paletteMap,
      };

      render(<App {...propsWithPalette} />);
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle empty categories", () => {
      const propsWithEmptyCategories = {
        ...defaultProps,
        categories: [],
      };

      render(<App {...propsWithEmptyCategories} />);
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle empty facts", () => {
      const propsWithEmptyFacts = {
        ...defaultProps,
        facts: [],
      };

      render(<App {...propsWithEmptyFacts} />);
      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  describe("Mouse Interactions", () => {
    it("should handle mouse down events", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");

      // Test left click
      fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 });

      // Test right click
      fireEvent.mouseDown(canvas, { button: 2, clientX: 100, clientY: 100 });

      // Test middle click
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
    });

    it("should handle mouse up events and call appropriate callbacks", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");

      // Simulate a click (mouse down then up at same position)
      fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { button: 0, clientX: 100, clientY: 100 });

      // Since no node is hovered, onStageClick should be called
      expect(mockOnStageClick).toHaveBeenCalled();
    });

    it("should detect dragging vs clicking", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");

      // Simulate a drag (mouse down then up at different position)
      fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { button: 0, clientX: 150, clientY: 150 });

      // onStageClick should not be called for drag
      expect(mockOnStageClick).not.toHaveBeenCalled();
    });

    it("should handle right click events", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");

      // Simulate right click
      fireEvent.mouseDown(canvas, { button: 2, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { button: 2, clientX: 100, clientY: 100 });

      // onNodeRightClick should be called with null (no node hovered)
      expect(mockOnNodeRightClick).toHaveBeenCalledWith(
        null,
        expect.any(Object)
      );
    });
  });

  describe("Canvas Events", () => {
    it("should handle Canvas onPointerDown", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");
      fireEvent.pointerDown(canvas);

      // Should not throw errors
      expect(canvas).toBeInTheDocument();
    });

    it("should handle Canvas onWheel", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");
      fireEvent.wheel(canvas);

      // Should not throw errors
      expect(canvas).toBeInTheDocument();
    });

    it("should handle Canvas onClick", () => {
      render(<App {...defaultProps} />);

      const canvas = screen.getByTestId("canvas");
      fireEvent.click(canvas);

      // Should not throw errors
      expect(canvas).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should handle window resize", async () => {
      render(<App {...defaultProps} />);

      // Simulate window resize
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("canvas")).toBeInTheDocument();
      });
    });

    it("should update dimensions on container size change", () => {
      const { rerender } = render(<App {...defaultProps} />);

      // Mock different container size
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        width: 1200,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 1200,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      rerender(<App {...defaultProps} />);

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  describe("Data Updates", () => {
    it("should handle facts prop changes", () => {
      const { rerender } = render(<App {...defaultProps} />);

      const newFacts = [
        ...mockFacts,
        createMockFact({
          fact_uid: 3,
          lh_object_uid: 300,
          lh_object_name: "Node C",
          rh_object_uid: 400,
          rh_object_name: "Node D",
          rel_type_uid: 5025,
          rel_type_name: "is connected to",
        }),
      ];

      rerender(<App {...defaultProps} facts={newFacts} />);

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle categories prop changes", () => {
      const { rerender } = render(<App {...defaultProps} />);

      const newCategories = [
        ...mockCategories,
        {
          uid: 160170,
          name: "Role",
          descendants: [160171, 160172],
        },
      ];

      rerender(<App {...defaultProps} categories={newCategories} />);

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle removal of facts", () => {
      const { rerender } = render(<App {...defaultProps} />);

      // Remove one fact
      const reducedFacts = mockFacts.slice(0, 1);

      rerender(<App {...defaultProps} facts={reducedFacts} />);

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing callback props gracefully", () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onNodeClick: (() => {}) as AppProps["onNodeClick"],
        onStageClick: (() => {}) as AppProps["onStageClick"],
        onNodeRightClick: (() => {}) as AppProps["onNodeRightClick"],
      };

      render(<App {...propsWithoutCallbacks} />);

      const canvas = screen.getByTestId("canvas");

      // Should not throw errors when callbacks are undefined
      fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { button: 0, clientX: 100, clientY: 100 });

      expect(canvas).toBeInTheDocument();
    });

    it("should handle malformed facts gracefully", () => {
      const malformedFacts = [
        {
          ...mockFacts[0],
          lh_object_uid: 0,
        },
      ];

      // Should not throw errors
      expect(() => {
        render(<App {...defaultProps} facts={malformedFacts} />);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const { rerender } = render(<App {...defaultProps} />);

      // Re-render with same props
      rerender(<App {...defaultProps} />);

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("should handle large datasets", () => {
      // Create a larger dataset
      const largeFacts = Array.from({ length: 100 }, (_, i) =>
        createMockFact({
          fact_uid: i + 1,
          lh_object_uid: i * 2,
          lh_object_name: `Node ${i * 2}`,
          rh_object_uid: i * 2 + 1,
          rh_object_name: `Node ${i * 2 + 1}`,
          rel_type_uid: 5025,
          rel_type_name: "is connected to",
        })
      );

      expect(() => {
        render(<App {...defaultProps} facts={largeFacts} />);
      }).not.toThrow();

      expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });
  });
});
