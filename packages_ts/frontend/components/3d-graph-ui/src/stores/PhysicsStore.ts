import { makeAutoObservable, action } from "mobx";
import {
  INodeEntity,
  IEdgeEntity,
  ISimulationConfig,
  DEFAULT_SIMULATION_CONFIG,
} from "../types/models.js";
import { Fact, Position } from "../types.js";
import PhysicsService from "../services/physics/PhysicsService.js";
import SpatialIndexService from "../services/spatial/SpatialIndexService.js";

/**
 * PhysicsStore
 *
 * Manages the physics simulation for the graph
 * Handles node positions and forces
 * Uses a web worker via PhysicsService for improved performance
 */
class PhysicsStore {
  // Physics service for web worker communication
  private physicsService: PhysicsService;

  // Spatial index for collision detection
  private spatialIndex: SpatialIndexService;

  // Configuration
  private config: ISimulationConfig;

  // Simulation state
  private isPaused = false;
  private isInitialized = false;

  // Callbacks for position updates
  private onNodePositionUpdate: (id: number, pos: Position) => void;
  private onEdgePositionsUpdate: (
    id: number,
    positions: { source: Position; target: Position }
  ) => void;

  // Node position cache for quick access
  private nodePositions: Map<number, Position> = new Map();

  // Collision detection configuration
  private collisionRadius = 5;

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

    // Initialize physics service
    this.physicsService = new PhysicsService();
    this.initializePhysicsService();

    // Initialize spatial index for collision detection
    this.spatialIndex = new SpatialIndexService("octree", {
      size: 1000,
      maxObjects: 16,
      maxDepth: 8,
    });

    makeAutoObservable(this, {
      addNode: action,
      removeNode: action,
      addLink: action,
      removeLink: action,
      updateConfig: action,
      stepSimulation: action,
      pauseSimulation: action,
      resumeSimulation: action,
    });
  }

  /**
   * Initialize the physics service
   */
  private initializePhysicsService(): void {
    this.physicsService.initialize(
      this.config,
      this.handleNodePositionUpdate.bind(this),
      this.handleEdgePositionsUpdate.bind(this)
    );
    this.isInitialized = true;
  }

  /**
   * Handle node position updates from the physics service
   */
  private handleNodePositionUpdate(id: number, pos: Position): void {
    // Update the position cache
    this.nodePositions.set(id, pos);

    // Update position in spatial index
    this.spatialIndex.updateNodePosition(id, pos);

    // Check for collisions and apply collision avoidance if needed
    this.handleCollisions(id, pos);

    // Forward to the callback
    this.onNodePositionUpdate(id, pos);
  }

  /**
   * Handle collisions between nodes
   */
  private handleCollisions(nodeId: number, position: Position): void {
    // Find potential collision candidates using spatial index
    const collisionCandidates = this.spatialIndex.findNodeIdsInRadius(
      position,
      this.collisionRadius
    );

    // Filter out the node itself
    const otherNodes = collisionCandidates.filter((id) => id !== nodeId);

    if (otherNodes.length === 0) return;

    // Apply simple collision avoidance
    // For each potential collision, calculate a repulsion vector
    let repulsionX = 0;
    let repulsionY = 0;
    let repulsionZ = 0;

    for (const otherId of otherNodes) {
      const otherPos = this.nodePositions.get(otherId);
      if (!otherPos) continue;

      // Calculate vector from other node to this node
      const dx = position.x - otherPos.x;
      const dy = position.y - otherPos.y;
      const dz = position.z - otherPos.z;

      // Calculate distance squared
      const distSq = dx * dx + dy * dy + dz * dz;

      // Skip if too far away
      if (distSq > this.collisionRadius * this.collisionRadius) continue;

      // Calculate distance
      const dist = Math.sqrt(distSq);

      // Calculate repulsion force (stronger as nodes get closer)
      const force = (0.5 * (this.collisionRadius - dist)) / dist;

      // Add to total repulsion
      repulsionX += dx * force;
      repulsionY += dy * force;
      repulsionZ += dz * force;
    }

    // Apply repulsion by updating node position
    if (repulsionX !== 0 || repulsionY !== 0 || repulsionZ !== 0) {
      const newPos = {
        x: position.x + repulsionX,
        y: position.y + repulsionY,
        z: position.z + repulsionZ,
      };

      // Update position in physics service
      this.physicsService.setNodePosition(nodeId, newPos);
    }
  }

  /**
   * Handle edge position updates from the physics service
   */
  private handleEdgePositionsUpdate(
    id: number,
    positions: { source: Position; target: Position }
  ): void {
    // Forward to the callback
    this.onEdgePositionsUpdate(id, positions);
  }

  /**
   * Add a node to the physics simulation
   */
  addNode(node: INodeEntity): void {
    if (!this.isInitialized) return;
    this.physicsService.addNode(node);

    // Add to spatial index if position is available
    if (node.pos) {
      this.spatialIndex.addNode(node);
    }
  }

  /**
   * Remove a node from the physics simulation
   */
  removeNode(id: number): void {
    if (!this.isInitialized) return;
    this.physicsService.removeNode(id);

    // Remove from position cache
    this.nodePositions.delete(id);

    // Remove from spatial index
    this.spatialIndex.removeNode(id);
  }

  /**
   * Add a link (edge) to the physics simulation
   */
  addLink(edge: IEdgeEntity, fact: Fact): void {
    if (!this.isInitialized) return;
    this.physicsService.addLink(edge, fact);
  }

  /**
   * Remove a link from the physics simulation
   */
  removeLink(id: number): void {
    if (!this.isInitialized) return;
    this.physicsService.removeLink(id);
  }

  /**
   * Update the physics configuration
   */
  updateConfig(config: Partial<ISimulationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.isInitialized) {
      this.physicsService.updateConfig(config);
    }
  }

  /**
   * Get the current position of a node
   */
  getNodePosition(id: number): Position | null {
    return this.nodePositions.get(id) || null;
  }

  /**
   * Set the position of a node
   */
  setNodePosition(id: number, position: Position): void {
    if (!this.isInitialized) return;

    // Update the position cache
    this.nodePositions.set(id, position);

    // Update in the physics service
    this.physicsService.setNodePosition(id, position);

    // Update in the spatial index
    this.spatialIndex.updateNodePosition(id, position);
  }

  /**
   * Pin a node at its current position
   */
  pinNode(id: number, isPinned: boolean): void {
    if (!this.isInitialized) return;
    this.physicsService.pinNode(id, isPinned);
  }

  /**
   * Perform one step of the physics simulation
   */
  stepSimulation(): void {
    if (!this.isInitialized || this.isPaused) return;
    this.physicsService.stepSimulation();
  }

  /**
   * Pause the physics simulation
   */
  pauseSimulation(): void {
    this.isPaused = true;
  }

  /**
   * Resume the physics simulation
   */
  resumeSimulation(): void {
    this.isPaused = false;
  }

  /**
   * Get the current simulation configuration
   */
  getConfig(): ISimulationConfig {
    return { ...this.config };
  }

  /**
   * Set the collision radius for collision detection
   */
  setCollisionRadius(radius: number): void {
    this.collisionRadius = radius;
  }

  /**
   * Get the collision radius
   */
  getCollisionRadius(): number {
    return this.collisionRadius;
  }

  /**
   * Find nodes within a radius of a position
   */
  findNodesInRadius(position: Position, radius: number): number[] {
    return this.spatialIndex.findNodeIdsInRadius(position, radius);
  }

  /**
   * Get performance metrics from the physics service
   */
  getPerformanceMetrics(): {
    lastStepTime: number;
    averageStepTime: number;
    stepCount: number;
  } {
    if (!this.isInitialized) {
      return {
        lastStepTime: 0,
        averageStepTime: 0,
        stepCount: 0,
      };
    }

    return this.physicsService.getPerformanceMetrics();
  }

  /**
   * Check if the simulation is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Clean up resources when the store is no longer needed
   */
  dispose(): void {
    if (this.isInitialized) {
      this.physicsService.terminate();
      this.spatialIndex.clear();
    }
  }
}

export default PhysicsStore;
