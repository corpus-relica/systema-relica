import { Position } from "../../types.js";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";
import { BaseLayoutPlugin } from "./LayoutPlugin.js";

/**
 * Grid layout plugin
 *
 * This layout arranges nodes in a 2D or 3D grid pattern
 */
export class GridLayout extends BaseLayoutPlugin {
  private gridSpacing: number = 50;
  private use3D: boolean = true;
  private cellsPerRow: number = 0;
  private cellsPerLayer: number = 0;
  private initialized: boolean = false;

  constructor() {
    super("grid", "Grid Layout", "Arranges nodes in a 2D or 3D grid pattern");

    // Set default options
    this.options.set("gridSpacing", this.gridSpacing);
    this.options.set("use3D", this.use3D);
  }

  /**
   * Initialize the layout with nodes and edges
   */
  override initialize(nodes: INodeEntity[], edges: IEdgeEntity[]): void {
    super.initialize(nodes, edges);

    // Apply options
    this.applyOptions();

    // Calculate grid dimensions
    this.calculateGridDimensions();

    // Assign initial positions
    this.assignGridPositions();

    this.initialized = true;
  }

  /**
   * Apply current options
   */
  private applyOptions(): void {
    const options = this.getOptions();

    this.gridSpacing = (options.get("gridSpacing") as number) || 50;
    this.use3D = (options.get("use3D") as boolean) || true;
  }

  /**
   * Calculate grid dimensions based on the number of nodes
   */
  private calculateGridDimensions(): void {
    const nodeCount = this.nodes.size;

    if (this.use3D) {
      // For 3D grid, calculate a roughly cubic arrangement
      this.cellsPerRow = Math.ceil(Math.cbrt(nodeCount));
      this.cellsPerLayer = this.cellsPerRow * this.cellsPerRow;
    } else {
      // For 2D grid, calculate a roughly square arrangement
      this.cellsPerRow = Math.ceil(Math.sqrt(nodeCount));
      this.cellsPerLayer = nodeCount; // Not used in 2D
    }
  }

  /**
   * Assign grid positions to nodes
   */
  private assignGridPositions(): void {
    const nodeIds = Array.from(this.nodes.keys());
    const centerOffset = ((this.cellsPerRow - 1) * this.gridSpacing) / 2;

    nodeIds.forEach((id, index) => {
      if (this.pinnedNodes.has(id)) {
        // Skip pinned nodes
        return;
      }

      let x, y, z;

      if (this.use3D) {
        // Calculate 3D grid position
        const layer = Math.floor(index / this.cellsPerLayer);
        const indexInLayer = index % this.cellsPerLayer;
        const row = Math.floor(indexInLayer / this.cellsPerRow);
        const col = indexInLayer % this.cellsPerRow;

        x = col * this.gridSpacing - centerOffset;
        y = row * this.gridSpacing - centerOffset;
        z =
          layer * this.gridSpacing -
          (Math.floor(nodeIds.length / this.cellsPerLayer) * this.gridSpacing) /
            2;
      } else {
        // Calculate 2D grid position
        const row = Math.floor(index / this.cellsPerRow);
        const col = index % this.cellsPerRow;

        x = col * this.gridSpacing - centerOffset;
        y = row * this.gridSpacing - centerOffset;
        z = 0;
      }

      this.positions.set(id, { x, y, z });
    });
  }

  /**
   * Perform a single step of the layout algorithm
   * For grid layout, this doesn't do anything after initialization
   */
  step(): Map<number, Position> {
    if (!this.initialized) {
      this.assignGridPositions();
      this.initialized = true;
    }

    // Return current positions
    return new Map(this.positions);
  }

  /**
   * Reset the layout algorithm
   */
  override reset(): void {
    super.reset();
    this.initialized = false;

    // Recalculate grid dimensions and positions
    this.applyOptions();
    this.calculateGridDimensions();
    this.assignGridPositions();

    this.initialized = true;
  }

  /**
   * Set grid spacing
   */
  setGridSpacing(spacing: number): void {
    this.options.set("gridSpacing", spacing);
    this.gridSpacing = spacing;

    // Update positions if initialized
    if (this.initialized) {
      this.assignGridPositions();
    }
  }

  /**
   * Set whether to use 3D grid
   */
  setUse3D(use3D: boolean): void {
    this.options.set("use3D", use3D);
    this.use3D = use3D;

    // Update positions if initialized
    if (this.initialized) {
      this.calculateGridDimensions();
      this.assignGridPositions();
    }
  }

  /**
   * Check if the layout has converged
   * Grid layout converges immediately after initialization
   */
  isConverged(): boolean {
    return this.initialized;
  }
}

export default GridLayout;
