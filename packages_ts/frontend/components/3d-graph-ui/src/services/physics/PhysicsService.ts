import { Position } from "../../types.js";
import {
  ISimulationConfig,
  INodeEntity,
  IEdgeEntity,
} from "../../types/models.js";
import { Fact } from "../../types.js";

/**
 * Message types for worker communication
 */
type WorkerCommand =
  | "INIT"
  | "ADD_NODE"
  | "REMOVE_NODE"
  | "ADD_EDGE"
  | "REMOVE_EDGE"
  | "UPDATE_CONFIG"
  | "SET_NODE_POSITION"
  | "PIN_NODE"
  | "STEP"
  | "READY";

type WorkerMessage = {
  cmd: WorkerCommand;
  payload: unknown;
};

/**
 * PhysicsService
 *
 * Manages communication with the physics simulation web worker
 * Provides a clean API for the PhysicsStore to use
 */
class PhysicsService {
  private worker: Worker;
  private isReady = false;
  private messageQueue: Array<{ cmd: WorkerCommand; payload: unknown }> = [];
  private nodePositionCallback: ((id: number, pos: Position) => void) | null =
    null;
  private edgePositionsCallback:
    | ((id: number, positions: { source: Position; target: Position }) => void)
    | null = null;
  private performanceMetrics = {
    lastStepTime: 0,
    averageStepTime: 0,
    stepCount: 0,
  };

  /**
   * Create a new PhysicsService
   */
  constructor() {
    // Create the web worker
    this.worker = new Worker(new URL("./physicsWorker.ts", import.meta.url), {
      type: "module",
    });

    // Set up message handler
    this.worker.onmessage = this.handleWorkerMessage.bind(this);

    // Set up error handler
    this.worker.onerror = (error) => {
      console.error("Physics worker error:", error);
    };
  }

  /**
   * Initialize the physics simulation
   */
  initialize(
    config: Partial<ISimulationConfig>,
    onNodePositionUpdate: (id: number, pos: Position) => void,
    onEdgePositionsUpdate: (
      id: number,
      positions: { source: Position; target: Position }
    ) => void
  ): void {
    // Store callbacks
    this.nodePositionCallback = onNodePositionUpdate;
    this.edgePositionsCallback = onEdgePositionsUpdate;

    // Send initialization message to worker
    this.postMessage("INIT", config);
  }

  /**
   * Add a node to the physics simulation
   */
  addNode(node: INodeEntity): void {
    this.postMessage("ADD_NODE", node);
  }

  /**
   * Remove a node from the physics simulation
   */
  removeNode(id: number): void {
    this.postMessage("REMOVE_NODE", id);
  }

  /**
   * Add a link (edge) to the physics simulation
   */
  addLink(edge: IEdgeEntity, fact: Fact): void {
    this.postMessage("ADD_EDGE", {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      fact: {
        fact_uid: fact.fact_uid,
        rel_type_uid: fact.rel_type_uid,
      },
    });
  }

  /**
   * Remove a link from the physics simulation
   */
  removeLink(id: number): void {
    this.postMessage("REMOVE_EDGE", id);
  }

  /**
   * Update the physics configuration
   */
  updateConfig(config: Partial<ISimulationConfig>): void {
    this.postMessage("UPDATE_CONFIG", config);
  }

  /**
   * Set the position of a node
   */
  setNodePosition(id: number, position: Position): void {
    this.postMessage("SET_NODE_POSITION", { id, position });
  }

  /**
   * Pin a node at its current position
   */
  pinNode(id: number, isPinned: boolean): void {
    this.postMessage("PIN_NODE", { id, isPinned });
  }

  /**
   * Step the physics simulation
   */
  stepSimulation(): void {
    const startTime = performance.now();
    this.postMessage("STEP", null);
    this.performanceMetrics.lastStepTime = performance.now() - startTime;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageStepTime:
        this.performanceMetrics.stepCount > 0
          ? this.performanceMetrics.averageStepTime /
            this.performanceMetrics.stepCount
          : 0,
    };
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    this.worker.terminate();
  }

  /**
   * Post a message to the worker
   */
  private postMessage(cmd: WorkerCommand, payload: unknown): void {
    const message = { cmd, payload };

    if (!this.isReady) {
      // Queue the message if the worker is not ready
      this.messageQueue.push(message);
      return;
    }

    this.worker.postMessage(message);
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerMessage>): void {
    const { cmd, payload } = event.data;

    switch (cmd) {
      case "READY":
        this.isReady = true;
        // Process queued messages
        this.processMessageQueue();
        break;
      case "STEP":
        if (payload && typeof payload === "object") {
          const { nodePositions, edgePositions } = payload as {
            nodePositions: Record<number, Position>;
            edgePositions: Record<
              number,
              { source: Position; target: Position }
            >;
          };

          // Update performance metrics
          this.updatePerformanceMetrics();

          // Process node positions
          if (nodePositions && this.nodePositionCallback) {
            Object.entries(nodePositions).forEach(([idStr, pos]) => {
              const id = parseInt(idStr, 10);
              this.nodePositionCallback!(id, pos);
            });
          }

          // Process edge positions
          if (edgePositions && this.edgePositionsCallback) {
            Object.entries(edgePositions).forEach(([idStr, positions]) => {
              const id = parseInt(idStr, 10);
              this.edgePositionsCallback!(id, positions);
            });
          }
        }
        break;
      default:
        // Handle other responses if needed
        break;
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.worker.postMessage(message);
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    this.performanceMetrics.stepCount++;
    this.performanceMetrics.averageStepTime +=
      this.performanceMetrics.lastStepTime;
  }
}

export default PhysicsService;
