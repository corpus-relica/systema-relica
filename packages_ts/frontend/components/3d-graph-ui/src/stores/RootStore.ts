import { makeAutoObservable } from "mobx";
import { Fact } from "../types.js";
import GraphDataStore from "./GraphDataStore.js";
import UIStateStore from "./UIStateStore.js";
import PhysicsStore from "./PhysicsStore.js";
import { Position } from "../types.js";
import { ISimulationConfig } from "../types/models.js";

/**
 * RootStore
 *
 * Composes all store modules and provides a unified interface
 * for the application to interact with the state.
 */
class RootStore {
  // Store modules
  graphDataStore: GraphDataStore;
  uiStateStore: UIStateStore;
  physicsStore: PhysicsStore;

  constructor() {
    // Initialize store modules
    this.graphDataStore = new GraphDataStore();
    this.uiStateStore = new UIStateStore();

    // Initialize physics store with callbacks for position updates
    this.physicsStore = new PhysicsStore(
      {}, // Default config
      this.handleNodePositionUpdate,
      this.handleEdgePositionsUpdate
    );

    makeAutoObservable(this);
  }

  /**
   * Node operations
   */

  addNode = (node: {
    id: number;
    name: string;
    val?: number;
    pos?: Position;
  }) => {
    const added = this.graphDataStore.addNode(node);
    if (added) {
      this.physicsStore.addNode({
        id: node.id,
        name: node.name,
        val: node.val || 0.25,
        pos: node.pos,
      });
      this.wake();
    }
    return added;
  };

  removeNode = (id: number) => {
    const removed = this.graphDataStore.removeNode(id);
    if (removed) {
      this.physicsStore.removeNode(id);
      this.wake();
    }
    return removed;
  };

  /**
   * Edge operations
   */

  addEdge = (fact: Fact) => {
    const added = this.graphDataStore.addEdge(fact);
    if (added) {
      // Get the edge entity from the graph data store
      const edge = this.graphDataStore.getEdge(fact.fact_uid);
      if (edge) {
        this.physicsStore.addLink(edge, fact);
        this.wake();
      }
    }
    return added;
  };

  removeEdge = (id: number) => {
    const removed = this.graphDataStore.removeEdge(id);
    if (removed) {
      this.physicsStore.removeLink(id);
      this.uiStateStore.wake();
    }
    return removed;
  };

  /**
   * Position update handlers
   */

  private handleNodePositionUpdate = (id: number, pos: Position) => {
    this.graphDataStore.updateNodePosition(id, pos);
  };

  private handleEdgePositionsUpdate = (
    id: number,
    positions: { source: Position; target: Position }
  ) => {
    this.graphDataStore.updateEdgePositions(id, positions);
  };

  /**
   * Animation control
   */

  wake = () => {
    this.uiStateStore.wake();
    this.setIsRunning(true);
    this.tickAnimation();
  };

  private tickAnimation = () => {
    requestAnimationFrame(() => {
      if (this.uiStateStore.running) {
        this.physicsStore.stepSimulation();
        this.tickAnimation();
      }
    });
  };

  /**
   * Selection state
   */

  setSelectedNode = (id: number | null) => {
    this.uiStateStore.setSelectedNode(id);
  };

  setHoveredNode = (id: number | null) => {
    this.uiStateStore.setHoveredNode(id);
  };

  unsetHoveredNode = () => {
    this.uiStateStore.setHoveredNode(null);
  };

  setSelectedEdge = (id: number | null) => {
    this.uiStateStore.setSelectedEdge(id);
  };

  setHoveredLink = (id: number | null) => {
    this.uiStateStore.setHoveredEdge(id);
  };

  unsetHoveredLink = () => {
    this.uiStateStore.setHoveredEdge(null);
  };

  /**
   * Running state
   */

  setIsRunning = (isRunning: boolean) => {
    this.uiStateStore.setIsRunning(isRunning);
    if (isRunning) {
      this.tickAnimation();
    }
  };

  /**
   * Category and palette operations
   */

  setPaletteMap = (paletteMap: Map<number, string> | null) => {
    this.graphDataStore.setPaletteMap(paletteMap);
  };

  setCategories = (
    categories: Array<{
      uid: number;
      name: string;
      descendants: Array<number>;
    }> | null
  ) => {
    this.graphDataStore.setCategories(categories);
  };

  /**
   * Physics configuration
   */

  updatePhysicsConfig = (config: Partial<ISimulationConfig>) => {
    this.physicsStore.updateConfig(config);
  };

  /**
   * Getters for accessing store properties
   */

  get nodeData() {
    // Create a Map-like object for backward compatibility
    const nodes = this.graphDataStore.allNodes;
    const nodeMap = {
      get: (id: number) => this.graphDataStore.getNode(id),
      values: () => nodes,
      size: nodes.length,
      map: <T>(
        callback: (
          node: ReturnType<GraphDataStore["getNode"]>,
          index: number,
          array: ReturnType<GraphDataStore["getNode"]>[]
        ) => T
      ) => nodes.map(callback),
      forEach: (
        callback: (
          node: ReturnType<GraphDataStore["getNode"]>,
          index: number,
          array: ReturnType<GraphDataStore["getNode"]>[]
        ) => void
      ) => nodes.forEach(callback),
    };
    return nodeMap;
  }

  get edgeData() {
    // Create a Map-like object for backward compatibility
    const edges = this.graphDataStore.allEdges;
    const edgeMap = {
      get: (id: number) => this.graphDataStore.getEdge(id),
      values: () => edges,
      size: edges.length,
      map: <T>(
        callback: (
          edge: ReturnType<GraphDataStore["getEdge"]>,
          index: number,
          array: ReturnType<GraphDataStore["getEdge"]>[]
        ) => T
      ) => edges.map(callback),
      forEach: (
        callback: (
          edge: ReturnType<GraphDataStore["getEdge"]>,
          index: number,
          array: ReturnType<GraphDataStore["getEdge"]>[]
        ) => void
      ) => edges.forEach(callback),
    };
    return edgeMap;
  }

  get hoveredNode() {
    return this.uiStateStore.hoveredNode;
  }

  get hoveredLink() {
    return this.uiStateStore.hoveredEdge;
  }

  get selectedNode() {
    return this.uiStateStore.selectedNode;
  }

  get selectedEdge() {
    return this.uiStateStore.selectedEdge;
  }

  get isRunning() {
    return this.uiStateStore.running;
  }

  /**
   * Node category and color methods
   */

  getNodeCategory = (id: number) => {
    return this.graphDataStore.getNodeCategory(id);
  };

  getNodeColor = (id: number) => {
    return this.graphDataStore.getNodeColor(id);
  };

  /**
   * Palette map for backward compatibility
   */
  get paletteMap() {
    // Access the internal paletteMap from GraphDataStore
    // This is needed for backward compatibility with existing components
    return {
      get: (type: number) => {
        // Forward to the GraphDataStore's paletteMap
        return this.graphDataStore.paletteMap.get(type);
      },
    };
  }
}

export default RootStore;
