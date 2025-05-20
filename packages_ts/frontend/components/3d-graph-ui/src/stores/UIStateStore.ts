import { makeAutoObservable, action, computed, observable } from "mobx";
import { Position } from "../types.js";

/**
 * UIStateStore
 *
 * Manages UI-related state including:
 * - Selection state (selected nodes and edges)
 * - Hover state (hovered nodes and edges)
 * - Viewport state (camera, zoom, etc.)
 * - Filter state (visibility filters)
 */
class UIStateStore {
  // Selection state
  private selectedNodeId: number | null = null;
  private selectedEdgeId: number | null = null;
  private selectedNodeIds = observable.array<number>([]);

  // Hover state
  private hoveredNodeId: number | null = null;
  private hoveredEdgeId: number | null = null;

  // Viewport state
  private isRunning: boolean = false;
  private sleepTimer: number = 0;
  private sleepDelay: number = 30000;

  // Filter state
  private visibleCategories: Set<string> = new Set([
    "Physical Object",
    "Occurrence",
    "Role",
    "Aspect",
    "Relation",
  ]);
  private searchTerm: string = "";

  constructor() {
    makeAutoObservable(this, {
      // Actions
      setSelectedNode: action,
      setSelectedEdge: action,
      clearSelection: action,
      setHoveredNode: action,
      setHoveredEdge: action,
      clearHoverState: action,
      setIsRunning: action,
      toggleCategoryVisibility: action,
      setSearchTerm: action,
      selectNodesInRegion: action,
      addNodeToSelection: action,
      removeNodeFromSelection: action,
      setMultipleSelectedNodes: action,

      // Computed
      hasSelection: computed,
      hasHover: computed,
      getVisibleCategories: computed,
      getSelectedNodeIds: computed,
    });
  }

  /**
   * Selection state methods
   */

  setSelectedNode(id: number | null) {
    this.selectedNodeId = id;
    // When selecting a node, clear any selected edge
    if (id !== null) {
      this.selectedEdgeId = null;

      // Update the multi-selection array
      this.selectedNodeIds.clear();
      if (id !== null) {
        this.selectedNodeIds.push(id);
      }
    }
  }

  setSelectedEdge(id: number | null) {
    this.selectedEdgeId = id;
    // When selecting an edge, clear any selected node
    if (id !== null) {
      this.selectedNodeId = null;
    }
  }

  clearSelection() {
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.selectedNodeIds.clear();
  }

  get selectedNode(): number | null {
    return this.selectedNodeId;
  }

  get selectedEdge(): number | null {
    return this.selectedEdgeId;
  }

  get hasSelection(): boolean {
    return (
      this.selectedNodeId !== null ||
      this.selectedEdgeId !== null ||
      this.selectedNodeIds.length > 0
    );
  }

  /**
   * Get all selected node IDs
   */
  get getSelectedNodeIds(): number[] {
    return this.selectedNodeIds;
  }

  /**
   * Add a node to the multi-selection
   */
  addNodeToSelection(id: number): void {
    if (!this.selectedNodeIds.includes(id)) {
      this.selectedNodeIds.push(id);

      // Update the primary selection if this is the first node
      if (this.selectedNodeIds.length === 1) {
        this.selectedNodeId = id;
      }
    }
  }

  /**
   * Remove a node from the multi-selection
   */
  removeNodeFromSelection(id: number): void {
    const index = this.selectedNodeIds.indexOf(id);
    if (index !== -1) {
      this.selectedNodeIds.splice(index, 1);

      // Update the primary selection
      if (this.selectedNodeId === id) {
        this.selectedNodeId =
          this.selectedNodeIds.length > 0 ? this.selectedNodeIds[0] : null;
      }
    }
  }

  /**
   * Set multiple selected nodes
   */
  setMultipleSelectedNodes(ids: number[]): void {
    this.selectedNodeIds.replace(ids);
    this.selectedNodeId = ids.length > 0 ? ids[0] : null;
    this.selectedEdgeId = null;
  }

  /**
   * Select nodes in a region using spatial query
   */
  selectNodesInRegion(min: Position, max: Position, append = false): void {
    // This method will be called with node IDs from the spatial index
    // The actual spatial query is performed in GraphDataStore

    // Implementation note: When nodes are found in the region, we'll either:
    if (append) {
      // Add them to the current selection if append is true
      // (This will be implemented when integrated with GraphDataStore)
    } else {
      // Or replace the current selection if append is false
      // (This will be implemented when integrated with GraphDataStore)
    }
  }

  /**
   * Hover state methods
   */

  setHoveredNode(id: number | null) {
    this.hoveredNodeId = id;
  }

  setHoveredEdge(id: number | null) {
    this.hoveredEdgeId = id;
  }

  clearHoverState() {
    this.hoveredNodeId = null;
    this.hoveredEdgeId = null;
  }

  get hoveredNode(): number | null {
    return this.hoveredNodeId;
  }

  get hoveredEdge(): number | null {
    return this.hoveredEdgeId;
  }

  get hasHover(): boolean {
    return this.hoveredNodeId !== null || this.hoveredEdgeId !== null;
  }

  /**
   * Viewport state methods
   */

  setIsRunning(isRunning: boolean) {
    this.isRunning = isRunning;

    if (isRunning) {
      // Clear any existing sleep timer
      if (this.sleepTimer) {
        clearTimeout(this.sleepTimer);
        this.sleepTimer = 0;
      }

      // Set a new sleep timer
      this.sleepTimer = window.setTimeout(() => {
        this.isRunning = false;
      }, this.sleepDelay);
    } else {
      // Clear the sleep timer if we're stopping manually
      if (this.sleepTimer) {
        clearTimeout(this.sleepTimer);
        this.sleepTimer = 0;
      }
    }
  }

  get running(): boolean {
    return this.isRunning;
  }

  wake() {
    this.setIsRunning(true);
  }

  sleep() {
    this.setIsRunning(false);
  }

  /**
   * Filter state methods
   */

  toggleCategoryVisibility(category: string) {
    if (this.visibleCategories.has(category)) {
      this.visibleCategories.delete(category);
    } else {
      this.visibleCategories.add(category);
    }
  }

  isCategoryVisible(category: string): boolean {
    return this.visibleCategories.has(category);
  }

  get getVisibleCategories(): string[] {
    return Array.from(this.visibleCategories);
  }

  setSearchTerm(term: string) {
    this.searchTerm = term.toLowerCase();
  }

  get getSearchTerm(): string {
    return this.searchTerm;
  }

  /**
   * Check if a node matches current filters
   */
  nodeMatchesFilters(nodeId: number, category: string, name: string): boolean {
    // Check category visibility
    if (!this.visibleCategories.has(category)) {
      return false;
    }

    // Check search term
    if (this.searchTerm && !name.toLowerCase().includes(this.searchTerm)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a node is selected
   */
  isNodeSelected(id: number): boolean {
    return this.selectedNodeIds.includes(id);
  }

  /**
   * Toggle a node's selection state
   */
  toggleNodeSelection(id: number): void {
    if (this.isNodeSelected(id)) {
      this.removeNodeFromSelection(id);
    } else {
      this.addNodeToSelection(id);
    }
  }
}

export default UIStateStore;
