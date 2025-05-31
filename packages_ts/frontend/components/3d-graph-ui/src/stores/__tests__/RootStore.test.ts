/**
 * Tests for RootStore - 3d-graph-ui package
 * Tests MobX store state management, node/edge operations, and simulation control
 */

import { when } from "mobx";
import RootStore from "../RootStore";
import { NodeData, Fact, Position } from "../../types";

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

// Mock SimulationStore
const mockSimulationStore = {
  addEntity: jest.fn(),
  removeEntity: jest.fn(),
  addLink: jest.fn(),
  removeLink: jest.fn(),
  stepLayout: jest.fn(),
};

jest.mock("../SimulationStore", () => {
  return jest.fn().mockImplementation(() => mockSimulationStore);
});

describe("RootStore", () => {
  let store: RootStore;

  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
    store = new RootStore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      expect(store.nodeData).toBeDefined();
      expect(store.edgeData).toBeDefined();
      expect(store.hoveredLink).toBeNull();
      expect(store.hoveredNode).toBeNull();
      expect(store.selectedNode).toBeNull();
      expect(store.selectedEdge).toBeNull();
      expect(store.isRunning).toBe(false);
      expect(store.paletteMap).toBeDefined();
      expect(store.categories).toEqual({});
      expect(store.simulationStore).toBeDefined();
    });

    it("should create observable maps for node and edge data", () => {
      expect(store.nodeData.size).toBe(0);
      expect(store.edgeData.size).toBe(0);
    });
  });

  describe("Node Management", () => {
    const mockNode: NodeData = {
      id: 100,
      name: "Test Node",
      val: 0.5,
    };

    it("should add a new node", () => {
      store.addNode(mockNode);

      expect(store.nodeData.has(100)).toBe(true);
      expect(store.nodeData.get(100)).toEqual(mockNode);
      expect(mockSimulationStore.addEntity).toHaveBeenCalledWith(mockNode);
    });

    it("should not add duplicate nodes", () => {
      store.addNode(mockNode);
      store.addNode(mockNode);

      expect(store.nodeData.size).toBe(1);
      expect(mockSimulationStore.addEntity).toHaveBeenCalledTimes(1);
    });

    it("should remove a node", () => {
      store.addNode(mockNode);
      store.removeNode(100);

      expect(store.nodeData.has(100)).toBe(false);
      expect(mockSimulationStore.removeEntity).toHaveBeenCalledWith(100);
    });

    it("should update node position", () => {
      const position: Position = { x: 10, y: 20, z: 30 };
      store.addNode(mockNode);
      store.setNodePosition(100, position);

      const updatedNode = store.nodeData.get(100);
      expect(updatedNode?.pos).toEqual(position);
    });

    it("should handle setting position for non-existent node", () => {
      const position: Position = { x: 10, y: 20, z: 30 };

      expect(() => {
        store.setNodePosition(999, position);
      }).not.toThrow();
    });
  });

  describe("Edge Management", () => {
    const mockFact: Fact = createMockFact({
      fact_uid: 1,
      lh_object_uid: 100,
      lh_object_name: "Node A",
      rh_object_uid: 200,
      rh_object_name: "Node B",
      rel_type_uid: 5025,
      rel_type_name: "is connected to",
    });

    it("should add a new edge from fact", () => {
      store.addEdge(mockFact);

      expect(store.edgeData.has(1)).toBe(true);

      const edge = store.edgeData.get(1);
      expect(edge).toEqual({
        id: 1,
        type: 5025,
        label: "is connected to",
        source: 100,
        target: 200,
      });

      expect(mockSimulationStore.addLink).toHaveBeenCalledWith(edge, mockFact);
    });

    it("should not add duplicate edges", () => {
      store.addEdge(mockFact);
      store.addEdge(mockFact);

      expect(store.edgeData.size).toBe(1);
      expect(mockSimulationStore.addLink).toHaveBeenCalledTimes(1);
    });

    it("should handle self-loop edges (unary relations)", () => {
      const selfLoopFact = createMockFact({
        fact_uid: 2,
        lh_object_uid: 100,
        lh_object_name: "Node A",
        rh_object_uid: 100, // Same as source
        rh_object_name: "Node A",
        rel_type_uid: 5025,
        rel_type_name: "is instance of",
      });

      store.addEdge(selfLoopFact);

      expect(store.edgeData.has(2)).toBe(true);
      // Should not add to simulation for self-loops
      expect(mockSimulationStore.addLink).not.toHaveBeenCalled();
    });

    it("should remove an edge", () => {
      store.addEdge(mockFact);
      store.removeEdge(1);

      expect(store.edgeData.has(1)).toBe(false);
      expect(mockSimulationStore.removeLink).toHaveBeenCalledWith(1);
    });

    it("should update edge positions", () => {
      const positions = {
        source: { x: 0, y: 0, z: 0 },
        target: { x: 10, y: 10, z: 10 },
      };

      store.addEdge(mockFact);
      store.setEdgePositions(1, positions);

      const edge = store.edgeData.get(1);
      expect(edge?.sourcePos).toEqual(positions.source);
      expect(edge?.targetPos).toEqual(positions.target);
    });

    it("should handle setting positions for non-existent edge", () => {
      const positions = {
        source: { x: 0, y: 0, z: 0 },
        target: { x: 10, y: 10, z: 10 },
      };

      expect(() => {
        store.setEdgePositions(999, positions);
      }).not.toThrow();
    });
  });

  describe("Selection Management", () => {
    it("should set selected node", () => {
      store.setSelectedNode(100);
      expect(store.selectedNode).toBe(100);
    });

    it("should set selected edge", () => {
      store.setSelectedEdge(1);
      expect(store.selectedEdge).toBe(1);
    });

    it("should set hovered node", () => {
      store.setHoveredNode(100);
      expect(store.hoveredNode).toBe(100);
    });

    it("should unset hovered node", () => {
      store.setHoveredNode(100);
      store.unsetHoveredNode();
      expect(store.hoveredNode).toBeNull();
    });

    it("should set hovered link", () => {
      store.setHoveredLink(1);
      expect(store.hoveredLink).toBe(1);
    });

    it("should unset hovered link", () => {
      store.setHoveredLink(1);
      store.unsetHoveredLink();
      expect(store.hoveredLink).toBeNull();
    });
  });

  describe("Animation Control", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should wake up animation", () => {
      store.wake();
      expect(store.isRunning).toBe(true);
    });

    it("should set running state", () => {
      store.setIsRunning(true);
      expect(store.isRunning).toBe(true);

      store.setIsRunning(false);
      expect(store.isRunning).toBe(false);
    });

    it("should handle sleep timer", () => {
      store.wake();
      expect(store.isRunning).toBe(true);

      // Fast-forward time to trigger sleep
      jest.advanceTimersByTime(30000);
      expect(store.isRunning).toBe(false);
    });

    it("should clear existing timer when waking", () => {
      store.wake();
      const firstTimer = (store as unknown as Record<string, unknown>)
        .sleepTimer;

      store.wake();
      const secondTimer = (store as unknown as Record<string, unknown>)
        .sleepTimer;

      expect(secondTimer).not.toBe(firstTimer);
    });
  });

  describe("Palette Management", () => {
    it("should set palette map", () => {
      const paletteMap = new Map([
        [100, "#ff0000"],
        [200, "#00ff00"],
      ]);

      store.setPaletteMap(paletteMap);
      // MobX converts Map to observable, so check the actual values
      expect(store.paletteMap.get(100)).toBe("#ff0000");
      expect(store.paletteMap.get(200)).toBe("#00ff00");
    });

    it("should handle null palette map", () => {
      store.setPaletteMap(null);
      expect(store.paletteMap).toBeDefined();
    });
  });

  describe("Categories Management", () => {
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

    it("should set categories", () => {
      store.setCategories(mockCategories);

      expect(store.categories["Physical Object"]).toEqual({
        uid: 730044,
        descendants: [730045, 730046],
      });
      expect(store.categories["Occurrence"]).toEqual({
        uid: 193671,
        descendants: [193672, 193673],
      });
    });

    it("should handle null categories", () => {
      store.setCategories(null);
      expect(store.categories).toEqual({});
    });

    it("should update existing categories with different descendants", () => {
      store.setCategories(mockCategories);

      const updatedCategories = [
        {
          uid: 730044,
          name: "Physical Object",
          descendants: [730045, 730046, 730047], // Added one more
        },
      ];

      store.setCategories(updatedCategories);

      expect(store.categories["Physical Object"].descendants).toEqual([
        730045, 730046, 730047,
      ]);
    });

    it("should not update categories with same descendants", () => {
      store.setCategories(mockCategories);
      const originalDescendants =
        store.categories["Physical Object"].descendants;

      store.setCategories(mockCategories);

      expect(store.categories["Physical Object"].descendants).toBe(
        originalDescendants
      );
    });
  });

  describe("Node Category Detection", () => {
    beforeEach(() => {
      const categories = [
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
        {
          uid: 160170,
          name: "Role",
          descendants: [160171, 160172],
        },
        {
          uid: 790229,
          name: "Aspect",
          descendants: [790230, 790231],
        },
        {
          uid: 2850,
          name: "Relation",
          descendants: [2851, 2852],
        },
      ];
      store.setCategories(categories);
    });

    it("should identify root node", () => {
      expect(store.getNodeCategory(730000)).toBe("Root");
    });

    it("should identify Physical Object category", () => {
      expect(store.getNodeCategory(730044)).toBe("Physical Object");
      expect(store.getNodeCategory(730045)).toBe("Physical Object");
    });

    it("should identify Occurrence category", () => {
      expect(store.getNodeCategory(193671)).toBe("Occurrence");
      expect(store.getNodeCategory(193672)).toBe("Occurrence");
    });

    it("should identify Role category", () => {
      expect(store.getNodeCategory(160170)).toBe("Role");
      expect(store.getNodeCategory(160171)).toBe("Role");
    });

    it("should identify Aspect category", () => {
      expect(store.getNodeCategory(790229)).toBe("Aspect");
      expect(store.getNodeCategory(790230)).toBe("Aspect");
    });

    it("should identify Relation category", () => {
      expect(store.getNodeCategory(2850)).toBe("Relation");
      expect(store.getNodeCategory(2851)).toBe("Relation");
    });

    it("should return Unknown for unrecognized nodes", () => {
      expect(store.getNodeCategory(999999)).toBe("Unknown");
    });
  });

  describe("Node Color Assignment", () => {
    beforeEach(() => {
      const categories = [
        {
          uid: 730044,
          name: "Physical Object",
          descendants: [730045],
        },
        {
          uid: 193671,
          name: "Occurrence",
          descendants: [193672],
        },
        {
          uid: 160170,
          name: "Role",
          descendants: [160171],
        },
        {
          uid: 790229,
          name: "Aspect",
          descendants: [790230],
        },
        {
          uid: 2850,
          name: "Relation",
          descendants: [2851],
        },
      ];
      store.setCategories(categories);
    });

    it("should return white for root node", () => {
      expect(store.getNodeColor(730000)).toBe("#fff");
    });

    it("should return correct color for Physical Object", () => {
      expect(store.getNodeColor(730044)).toBe("#8d70c9");
      expect(store.getNodeColor(730045)).toBe("#8d70c9");
    });

    it("should return correct color for Occurrence", () => {
      expect(store.getNodeColor(193671)).toBe("#7fa44a");
      expect(store.getNodeColor(193672)).toBe("#7fa44a");
    });

    it("should return correct color for Role", () => {
      expect(store.getNodeColor(160170)).toBe("#ca5686");
      expect(store.getNodeColor(160171)).toBe("#ca5686");
    });

    it("should return correct color for Aspect", () => {
      expect(store.getNodeColor(790229)).toBe("#49adad");
      expect(store.getNodeColor(790230)).toBe("#49adad");
    });

    it("should return correct color for Relation", () => {
      expect(store.getNodeColor(2850)).toBe("#c7703f");
      expect(store.getNodeColor(2851)).toBe("#c7703f");
    });

    it("should return default color for unknown nodes", () => {
      expect(store.getNodeColor(999999)).toBe("#999");
    });
  });

  describe("MobX Reactivity", () => {
    it("should be observable", async () => {
      let reactionTriggered = false;

      when(
        () => store.selectedNode !== null,
        () => {
          reactionTriggered = true;
        }
      );

      store.setSelectedNode(100);

      // Wait for reaction to trigger
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(reactionTriggered).toBe(true);
    });

    it("should trigger reactions on node data changes", async () => {
      let reactionTriggered = false;

      when(
        () => store.nodeData.size > 0,
        () => {
          reactionTriggered = true;
        }
      );

      store.addNode({
        id: 100,
        name: "Test Node",
        val: 0.5,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(reactionTriggered).toBe(true);
    });
  });

  describe("Integration", () => {
    it("should handle complex workflow", () => {
      // Set up categories
      const categories = [
        {
          uid: 730044,
          name: "Physical Object",
          descendants: [730045],
        },
      ];
      store.setCategories(categories);

      // Add nodes and edges
      const fact = createMockFact({
        fact_uid: 1,
        lh_object_uid: 100,
        lh_object_name: "Node A",
        rh_object_uid: 200,
        rh_object_name: "Node B",
        rel_type_uid: 5025,
        rel_type_name: "is connected to",
      });

      store.addEdge(fact);

      // Verify state
      expect(store.edgeData.size).toBe(1);
      expect(store.categories["Physical Object"]).toBeDefined();
    });
  });
});
