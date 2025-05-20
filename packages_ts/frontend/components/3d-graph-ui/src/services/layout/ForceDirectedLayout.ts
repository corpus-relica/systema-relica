import { Position } from "../../types.js";
import {
  INodeEntity,
  IEdgeEntity,
  ISimulationConfig,
  DEFAULT_SIMULATION_CONFIG,
} from "../../types/models.js";
import { BaseLayoutPlugin } from "./LayoutPlugin.js";

/**
 * Force-directed layout plugin using physics simulation
 *
 * This layout uses a force-directed algorithm to position nodes based on
 * physical forces (attraction, repulsion, gravity, etc.)
 */
export class ForceDirectedLayout extends BaseLayoutPlugin {
  private simulationConfig: ISimulationConfig;
  private nodeForces: Map<number, { x: number; y: number; z: number }> =
    new Map();
  private iteration: number = 0;
  private maxIterations: number = 1000;

  constructor() {
    super(
      "force-directed",
      "Force-Directed Layout",
      "Positions nodes using physical forces like springs and repulsion"
    );

    // Initialize with default simulation config
    this.simulationConfig = { ...DEFAULT_SIMULATION_CONFIG };

    // Set default options
    this.options.set("springLength", this.simulationConfig.springLength);
    this.options.set(
      "springCoefficient",
      this.simulationConfig.springCoefficient
    );
    this.options.set("gravity", this.simulationConfig.gravity);
    this.options.set("theta", this.simulationConfig.theta);
    this.options.set("dragCoefficient", this.simulationConfig.dragCoefficient);
    this.options.set("timeStep", this.simulationConfig.timeStep);
  }

  /**
   * Initialize the layout with nodes and edges
   */
  override initialize(nodes: INodeEntity[], edges: IEdgeEntity[]): void {
    super.initialize(nodes, edges);

    // Reset iteration counter
    this.iteration = 0;

    // Initialize positions for nodes that don't have positions
    this.nodes.forEach((node, id) => {
      if (!this.positions.has(id)) {
        // Assign a random position in a sphere
        const radius = Math.cbrt(this.nodes.size) * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        this.positions.set(id, {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
        });
      }
    });

    // Initialize forces
    this.nodeForces.clear();
    this.nodes.forEach((_, id) => {
      this.nodeForces.set(id, { x: 0, y: 0, z: 0 });
    });

    // Apply options to simulation config
    this.applyOptions();
  }

  /**
   * Apply current options to the simulation config
   */
  private applyOptions(): void {
    const options = this.getOptions();

    this.simulationConfig = {
      ...this.simulationConfig,
      springLength:
        (options.get("springLength") as number) ||
        DEFAULT_SIMULATION_CONFIG.springLength,
      springCoefficient:
        (options.get("springCoefficient") as number) ||
        DEFAULT_SIMULATION_CONFIG.springCoefficient,
      gravity:
        (options.get("gravity") as number) || DEFAULT_SIMULATION_CONFIG.gravity,
      theta:
        (options.get("theta") as number) || DEFAULT_SIMULATION_CONFIG.theta,
      dragCoefficient:
        (options.get("dragCoefficient") as number) ||
        DEFAULT_SIMULATION_CONFIG.dragCoefficient,
      timeStep:
        (options.get("timeStep") as number) ||
        DEFAULT_SIMULATION_CONFIG.timeStep,
    };
  }

  /**
   * Perform a single step of the layout algorithm
   */
  step(): Map<number, Position> {
    // Apply options in case they've changed
    this.applyOptions();

    // Reset forces
    this.nodeForces.forEach((force) => {
      force.x = 0;
      force.y = 0;
      force.z = 0;
    });

    // Calculate forces
    this.calculateRepulsionForces();
    this.calculateSpringForces();
    this.calculateGravityForces();

    // Apply forces to update positions
    const updatedPositions = new Map<number, Position>();

    this.nodes.forEach((_, id) => {
      // Skip pinned nodes
      if (this.pinnedNodes.has(id)) {
        return;
      }

      const position = this.positions.get(id);
      const force = this.nodeForces.get(id);

      if (position && force) {
        // Apply drag coefficient
        force.x *= this.simulationConfig.dragCoefficient;
        force.y *= this.simulationConfig.dragCoefficient;
        force.z *= this.simulationConfig.dragCoefficient;

        // Update position based on force
        const newPosition = {
          x: position.x + force.x * this.simulationConfig.timeStep,
          y: position.y + force.y * this.simulationConfig.timeStep,
          z: position.z + force.z * this.simulationConfig.timeStep,
        };

        // Update position
        this.positions.set(id, newPosition);
        updatedPositions.set(id, newPosition);
      }
    });

    // Increment iteration counter
    this.iteration++;

    return updatedPositions;
  }

  /**
   * Calculate repulsion forces between nodes
   */
  private calculateRepulsionForces(): void {
    // Implement Barnes-Hut approximation or direct calculation
    // For simplicity, we'll use direct calculation here

    const nodeIds = Array.from(this.nodes.keys());

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId1 = nodeIds[i];
      const pos1 = this.positions.get(nodeId1);
      if (!pos1) continue;

      for (let j = i + 1; j < nodeIds.length; j++) {
        const nodeId2 = nodeIds[j];
        const pos2 = this.positions.get(nodeId2);
        if (!pos2) continue;

        // Calculate distance
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Avoid division by zero
        if (distSq < 0.0001) continue;

        // Calculate repulsion force (inverse square law)
        const dist = Math.sqrt(distSq);
        const repulsionForce = 1 / distSq;

        // Calculate force components
        const fx = (dx / dist) * repulsionForce;
        const fy = (dy / dist) * repulsionForce;
        const fz = (dz / dist) * repulsionForce;

        // Apply force to both nodes
        const force1 = this.nodeForces.get(nodeId1);
        const force2 = this.nodeForces.get(nodeId2);

        if (force1) {
          force1.x += fx;
          force1.y += fy;
          force1.z += fz;
        }

        if (force2) {
          force2.x -= fx;
          force2.y -= fy;
          force2.z -= fz;
        }
      }
    }
  }

  /**
   * Calculate spring forces between connected nodes
   */
  private calculateSpringForces(): void {
    this.edges.forEach((edge) => {
      const sourcePos = this.positions.get(edge.source);
      const targetPos = this.positions.get(edge.target);

      if (!sourcePos || !targetPos) return;

      // Calculate distance
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const dz = targetPos.z - sourcePos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Avoid division by zero
      if (dist < 0.0001) return;

      // Calculate spring force (Hooke's law)
      const displacement = dist - this.simulationConfig.springLength;
      const springForce =
        displacement * this.simulationConfig.springCoefficient;

      // Calculate force components
      const fx = (dx / dist) * springForce;
      const fy = (dy / dist) * springForce;
      const fz = (dz / dist) * springForce;

      // Apply force to both nodes
      const sourceForce = this.nodeForces.get(edge.source);
      const targetForce = this.nodeForces.get(edge.target);

      if (sourceForce && !this.pinnedNodes.has(edge.source)) {
        sourceForce.x += fx;
        sourceForce.y += fy;
        sourceForce.z += fz;
      }

      if (targetForce && !this.pinnedNodes.has(edge.target)) {
        targetForce.x -= fx;
        targetForce.y -= fy;
        targetForce.z -= fz;
      }
    });
  }

  /**
   * Calculate gravity forces towards the center
   */
  private calculateGravityForces(): void {
    // Apply gravity towards the center (0,0,0)
    this.nodes.forEach((_, id) => {
      const position = this.positions.get(id);
      const force = this.nodeForces.get(id);

      if (position && force && !this.pinnedNodes.has(id)) {
        // Calculate distance from center
        const dist = Math.sqrt(
          position.x * position.x +
            position.y * position.y +
            position.z * position.z
        );

        // Avoid division by zero
        if (dist < 0.0001) return;

        // Calculate gravity force
        const gravityForce = this.simulationConfig.gravity;

        // Apply force towards center
        force.x += (-position.x / dist) * gravityForce;
        force.y += (-position.y / dist) * gravityForce;
        force.z += (-position.z / dist) * gravityForce;
      }
    });
  }

  /**
   * Reset the layout algorithm
   */
  override reset(): void {
    super.reset();
    this.iteration = 0;
    this.nodeForces.clear();
    this.nodes.forEach((_, id) => {
      this.nodeForces.set(id, { x: 0, y: 0, z: 0 });
    });
  }

  /**
   * Check if the layout has converged
   */
  isConverged(): boolean {
    // Check if we've reached the maximum number of iterations
    if (this.iteration >= this.maxIterations) {
      return true;
    }

    // Check if the forces are small enough
    let maxForce = 0;
    this.nodeForces.forEach((force) => {
      const forceMagnitude = Math.sqrt(
        force.x * force.x + force.y * force.y + force.z * force.z
      );
      maxForce = Math.max(maxForce, forceMagnitude);
    });

    return maxForce < 0.01;
  }

  /**
   * Set the maximum number of iterations
   */
  setMaxIterations(maxIterations: number): void {
    this.maxIterations = maxIterations;
  }

  /**
   * Get the current iteration count
   */
  getIteration(): number {
    return this.iteration;
  }
}

export default ForceDirectedLayout;
