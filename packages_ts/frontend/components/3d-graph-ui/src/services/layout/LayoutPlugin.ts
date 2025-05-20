import { Position } from "../../types.js";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";

/**
 * Interface for layout algorithm plugins
 *
 * Layout plugins are responsible for positioning nodes in the graph
 * They can implement different algorithms like force-directed, grid, circular, etc.
 */
export interface LayoutPlugin {
  /**
   * Unique identifier for the layout plugin
   */
  id: string;

  /**
   * Display name for the layout plugin
   */
  name: string;

  /**
   * Description of the layout algorithm
   */
  description: string;

  /**
   * Initialize the layout with nodes and edges
   * This is called when the layout is first applied or when the graph data changes significantly
   */
  initialize(nodes: INodeEntity[], edges: IEdgeEntity[]): void;

  /**
   * Perform a single step of the layout algorithm
   * Returns a map of node IDs to their new positions
   */
  step(): Map<number, Position>;

  /**
   * Get the current position of a node
   */
  getNodePosition(nodeId: number): Position | null;

  /**
   * Set the position of a node
   * This allows manual positioning or fixing nodes in place
   */
  setNodePosition(nodeId: number, position: Position): void;

  /**
   * Pin a node at its current position
   * Pinned nodes will not be moved by the layout algorithm
   */
  pinNode(nodeId: number, isPinned: boolean): void;

  /**
   * Reset the layout algorithm
   * This can be used to restart the layout from initial positions
   */
  reset(): void;

  /**
   * Get the configuration options for this layout
   * Returns a map of option names to their current values
   */
  getOptions(): Map<string, unknown>;

  /**
   * Set configuration options for this layout
   * This allows customizing the behavior of the layout algorithm
   */
  setOptions(options: Map<string, unknown>): void;
}

/**
 * Base class for layout plugins that implements common functionality
 */
export abstract class BaseLayoutPlugin implements LayoutPlugin {
  id: string;
  name: string;
  description: string;
  protected nodes: Map<number, INodeEntity> = new Map();
  protected edges: Map<number, IEdgeEntity> = new Map();
  protected positions: Map<number, Position> = new Map();
  protected pinnedNodes: Set<number> = new Set();
  protected options: Map<string, unknown> = new Map();

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  initialize(nodes: INodeEntity[], edges: IEdgeEntity[]): void {
    // Clear existing data
    this.nodes.clear();
    this.edges.clear();
    this.positions.clear();

    // Store nodes and edges
    nodes.forEach((node) => {
      this.nodes.set(node.id, node);
      if (node.pos) {
        this.positions.set(node.id, node.pos);
      }
    });

    edges.forEach((edge) => {
      this.edges.set(edge.id, edge);
    });

    // Subclasses should override this method to add their own initialization logic
  }

  abstract step(): Map<number, Position>;

  getNodePosition(nodeId: number): Position | null {
    return this.positions.get(nodeId) || null;
  }

  setNodePosition(nodeId: number, position: Position): void {
    this.positions.set(nodeId, position);
  }

  pinNode(nodeId: number, isPinned: boolean): void {
    if (isPinned) {
      this.pinnedNodes.add(nodeId);
    } else {
      this.pinnedNodes.delete(nodeId);
    }
  }

  reset(): void {
    // Reset positions to initial state
    this.positions.clear();
    this.nodes.forEach((node) => {
      if (node.pos) {
        this.positions.set(node.id, node.pos);
      }
    });

    // Subclasses should override this method to add their own reset logic
  }

  getOptions(): Map<string, unknown> {
    return new Map(this.options);
  }

  setOptions(options: Map<string, unknown>): void {
    options.forEach((value, key) => {
      this.options.set(key, value);
    });
  }
}
