import { makeAutoObservable, action } from "mobx";
import createGraph, { Graph, Link } from "ngraph.graph";
import createLayout, { Layout, Vector } from "ngraph.forcelayout";
import {
  INodeEntity,
  IEdgeEntity,
  ISimulationConfig,
  DEFAULT_SIMULATION_CONFIG,
} from "../types/models.js";
import { Fact, Position } from "../types.js";

/**
 * PhysicsStore
 *
 * Manages the physics simulation for the graph
 * Handles node positions and forces
 */
class PhysicsStore {
  // Physics engine components
  private graph: Graph;
  private layout: Layout<Graph>;
  private links: Map<number, Link> = new Map();

  // Configuration
  private config: ISimulationConfig;

  // Callbacks for position updates
  private onNodePositionUpdate: (id: number, pos: Position) => void;
  private onEdgePositionsUpdate: (
    id: number,
    positions: { source: Position; target: Position }
  ) => void;

  constructor(
    config: Partial<ISimulationConfig> = {},
    onNodePositionUpdate: (id: number, pos: Position) => void,
    onEdgePositionsUpdate: (
      id: number,
      positions: { source: Position; target: Position }
    ) => void
  ) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };

    // Store callbacks
    this.onNodePositionUpdate = onNodePositionUpdate;
    this.onEdgePositionsUpdate = onEdgePositionsUpdate;

    // Initialize physics engine
    this.graph = createGraph();
    this.layout = createLayout(this.graph, this.config);

    // Add custom forces
    this.setupCustomForces();

    makeAutoObservable(this, {
      addNode: action,
      removeNode: action,
      addLink: action,
      removeLink: action,
      updateConfig: action,
      stepSimulation: action,
    });
  }

  /**
   * Set up custom forces for the simulation
   */
  private setupCustomForces() {
    // Add a force to push classification relations downward
    this.layout.simulator.addForce("classificationForce", () => {
      this.graph.forEachLink((link) => {
        if (link.data.rel_type_uid === 1146) {
          const fromBody = this.layout.getBody(link.fromId);
          if (fromBody) {
            // Push classification relations downward
            fromBody.force.y += -0.1;
          }
        }
      });
    });

    // Add a bounding sphere force to keep nodes within a certain radius
    this.layout.simulator.addForce("boundingSphere", () => {
      const radius = 61.8; // Golden ratio * 10 for aesthetics

      this.graph.forEachNode((node) => {
        const body = this.layout.getBody(node.id);
        if (!body) return;

        // Calculate distance from origin
        const posZ = body.pos.z || 0;
        const distanceFromOrigin = Math.sqrt(
          body.pos.x ** 2 + body.pos.y ** 2 + posZ ** 2
        );

        // If outside the bounding sphere, apply a force toward the center
        if (distanceFromOrigin > radius) {
          const forceMagnitude = 0.1 * (distanceFromOrigin - radius);
          const forceX = (-body.pos.x / distanceFromOrigin) * forceMagnitude;
          const forceY = (-body.pos.y / distanceFromOrigin) * forceMagnitude;
          const forceZ = (-posZ / distanceFromOrigin) * forceMagnitude;

          body.force.x += forceX;
          body.force.y += forceY;
          if (body.force.z !== undefined) {
            body.force.z += forceZ;
          }
        }
      });
    });
  }

  /**
   * Add a node to the physics simulation
   */
  addNode(node: INodeEntity) {
    this.graph.beginUpdate();

    if (!this.graph.getNode(node.id)) {
      const graphNode = this.graph.addNode(node.id);

      // Pin the root node at a fixed position
      if (node.id === 730000) {
        this.layout.pinNode(graphNode, true);
        this.layout.setNodePosition(730000, 0, 25, 0);
      }

      // If the node has a position, use it
      if (node.pos) {
        this.layout.setNodePosition(
          node.id,
          node.pos.x,
          node.pos.y,
          node.pos.z
        );
      }
    }

    this.graph.endUpdate();
  }

  /**
   * Remove a node from the physics simulation
   */
  removeNode(id: number) {
    this.graph.beginUpdate();

    const node = this.graph.getNode(id);
    if (node) {
      this.graph.removeNode(id);
    }

    this.graph.endUpdate();
  }

  /**
   * Add a link (edge) to the physics simulation
   */
  addLink(edge: IEdgeEntity, fact: Fact) {
    this.graph.beginUpdate();

    if (!this.links.has(edge.id)) {
      // Skip self-loops in the physics simulation
      if (edge.source !== edge.target) {
        const link = this.graph.addLink(edge.source, edge.target, fact);
        this.links.set(edge.id, link);
      }
    }

    this.graph.endUpdate();
  }

  /**
   * Remove a link from the physics simulation
   */
  removeLink(id: number) {
    this.graph.beginUpdate();

    const link = this.links.get(id);
    if (link) {
      this.graph.removeLink(link);
      this.links.delete(id);
    }

    this.graph.endUpdate();
  }

  /**
   * Update the physics configuration
   */
  updateConfig(config: Partial<ISimulationConfig>) {
    this.config = { ...this.config, ...config };

    // Recreate the layout with the new config
    this.layout = createLayout(this.graph, this.config);
    this.setupCustomForces();
  }

  /**
   * Get the current position of a node
   */
  getNodePosition(id: number): Position | null {
    const position = this.layout.getNodePosition(id);
    if (!position) return null;

    return {
      x: position.x,
      y: position.y,
      z: position.z || 0,
    };
  }

  /**
   * Set the position of a node
   */
  setNodePosition(id: number, position: Position) {
    this.layout.setNodePosition(id, position.x, position.y, position.z);
  }

  /**
   * Pin a node at its current position
   */
  pinNode(id: number, isPinned: boolean) {
    const node = this.graph.getNode(id);
    if (node) {
      this.layout.pinNode(node, isPinned);
    }
  }

  /**
   * Update node positions in the physics simulation
   */
  private updateNodePositions() {
    this.graph.forEachNode((node) => {
      const id = node.id as number;
      const nodePosition = this.layout.getNodePosition(id);
      if (!nodePosition) return;

      // Ensure z-coordinate exists
      const pos: Position = {
        x: nodePosition.x,
        y: nodePosition.y,
        z: nodePosition.z || 0,
      };

      // Notify about position update
      this.onNodePositionUpdate(id, pos);

      // Update the physics body position
      const body = this.layout.getBody(id);
      if (body) {
        body.pos.x = nodePosition.x;
        body.pos.y = nodePosition.y;
        body.pos.z = nodePosition.z || 0;
      }
    });
  }

  /**
   * Update edge positions in the physics simulation
   */
  private updateEdgePositions() {
    this.graph.forEachLink((link: Link) => {
      const { fromId, toId, data } = link;

      // Get positions from the physics simulation
      const source: Vector = this.layout.getNodePosition(fromId);
      const target: Vector = this.layout.getNodePosition(toId);

      if (!source || !target) return;

      // Create position objects
      const positions = {
        source: {
          x: source.x,
          y: source.y,
          z: source.z || 0,
        },
        target: {
          x: target.x,
          y: target.y,
          z: target.z || 0,
        },
      };

      // Notify about position update
      this.onEdgePositionsUpdate(data.fact_uid, positions);
    });
  }

  /**
   * Perform one step of the physics simulation
   */
  stepSimulation() {
    // Step the layout
    this.layout.step();

    // Update positions
    this.updateNodePositions();
    this.updateEdgePositions();
  }

  /**
   * Get the current simulation configuration
   */
  getConfig(): ISimulationConfig {
    return { ...this.config };
  }
}

export default PhysicsStore;
