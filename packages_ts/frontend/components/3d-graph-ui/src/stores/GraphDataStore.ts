import { makeAutoObservable, observable, computed, action } from "mobx";
import { Fact } from "../types.js";
import {
  INodeEntity,
  IEdgeEntity,
  createNodeEntity,
  createEdgeEntity,
} from "../types/models.js";

/**
 * GraphDataStore
 *
 * Responsible for managing graph data entities (nodes and edges)
 * Provides methods for adding, removing, and querying graph entities
 */
class GraphDataStore {
  // Observable maps for storing node and edge entities
  private nodeEntities = observable.map<number, INodeEntity>();
  private edgeEntities = observable.map<number, IEdgeEntity>();

  // Category data for node classification
  private categories: {
    [name: string]: { uid: number; descendants: Array<number> };
  } = {};

  // Color mapping for nodes
  private _paletteMap = observable.map<number, string>();

  // Default category colors
  private catColors: { [key: number]: string } = {
    730044: "#8d70c9", // Physical Object
    193671: "#7fa44a", // Occurrence
    160170: "#ca5686", // Role
    790229: "#49adad", // Aspect
    2850: "#c7703f", // Relation
  };

  constructor() {
    makeAutoObservable(this, {
      // Specify actions
      addNode: action,
      removeNode: action,
      addEdge: action,
      removeEdge: action,
      updateNodePosition: action,
      updateEdgePositions: action,
      setCategories: action,
      setPaletteMap: action,

      // Specify computed properties
      allNodes: computed,
      allEdges: computed,
      nodeCount: computed,
      edgeCount: computed,
    });
  }

  /**
   * Add a node to the store
   */
  addNode(nodeData: Omit<INodeEntity, "val"> & { val?: number }) {
    if (!this.nodeEntities.has(nodeData.id)) {
      const node = createNodeEntity(nodeData);
      this.nodeEntities.set(node.id, node);
      return true;
    }
    return false;
  }

  /**
   * Remove a node from the store
   */
  removeNode(id: number) {
    return this.nodeEntities.delete(id);
  }

  /**
   * Add an edge to the store
   */
  addEdge(fact: Fact) {
    if (!this.edgeEntities.has(fact.fact_uid)) {
      const edge = createEdgeEntity({
        id: fact.fact_uid,
        type: fact.rel_type_uid,
        label: fact.rel_type_name,
        source: fact.lh_object_uid,
        target: fact.rh_object_uid,
      });
      this.edgeEntities.set(edge.id, edge);
      return true;
    }
    return false;
  }

  /**
   * Remove an edge from the store
   */
  removeEdge(id: number) {
    return this.edgeEntities.delete(id);
  }

  /**
   * Update a node's position
   */
  updateNodePosition(id: number, pos: { x: number; y: number; z: number }) {
    const node = this.nodeEntities.get(id);
    if (node) {
      const updatedNode = {
        ...node,
        pos,
      };
      this.nodeEntities.set(id, updatedNode);
      return true;
    }
    return false;
  }

  /**
   * Update edge positions (source and target)
   */
  updateEdgePositions(
    id: number,
    positions: {
      source: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
    }
  ) {
    const edge = this.edgeEntities.get(id);
    if (edge) {
      const updatedEdge = {
        ...edge,
        sourcePos: positions.source,
        targetPos: positions.target,
      };
      this.edgeEntities.set(id, updatedEdge);
      return true;
    }
    return false;
  }

  /**
   * Set categories for node classification
   */
  setCategories(
    newCats: Array<{
      uid: number;
      name: string;
      descendants: Array<number>;
    }> | null
  ) {
    if (!newCats) {
      this.categories = {};
      return;
    }

    if (Object.keys(this.categories).length > 0) {
      // Update existing categories
      newCats.forEach((cat) => {
        if (this.categories[cat.name]) {
          const currDesc = this.categories[cat.name].descendants;
          const newDesc = cat.descendants;

          // Check if descendants have changed
          if (currDesc.length !== newDesc.length) {
            this.categories[cat.name].descendants = cat.descendants;
          }
        } else {
          this.categories[cat.name] = {
            uid: cat.uid,
            descendants: cat.descendants,
          };
        }
      });
    } else {
      // Initialize categories
      newCats.forEach((cat) => {
        this.categories[cat.name] = {
          uid: cat.uid,
          descendants: cat.descendants,
        };
      });
    }
  }

  /**
   * Set palette map for node colors
   */
  setPaletteMap(paletteMap: Map<number, string> | null) {
    if (!paletteMap) {
      this._paletteMap.clear();
    } else {
      // Convert to observable map
      paletteMap.forEach((color, id) => {
        this._paletteMap.set(id, color);
      });
    }
  }

  /**
   * Get the palette map
   */
  get paletteMap() {
    return this._paletteMap;
  }

  /**
   * Get a node by ID
   */
  getNode(id: number): INodeEntity | undefined {
    return this.nodeEntities.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: number): IEdgeEntity | undefined {
    return this.edgeEntities.get(id);
  }

  /**
   * Get all nodes as an array
   */
  get allNodes(): INodeEntity[] {
    return Array.from(this.nodeEntities.values());
  }

  /**
   * Get all edges as an array
   */
  get allEdges(): IEdgeEntity[] {
    return Array.from(this.edgeEntities.values());
  }

  /**
   * Get the number of nodes
   */
  get nodeCount(): number {
    return this.nodeEntities.size;
  }

  /**
   * Get the number of edges
   */
  get edgeCount(): number {
    return this.edgeEntities.size;
  }

  /**
   * Get a node's category
   */
  getNodeCategory(id: number): string {
    let category = "Unknown";

    if (id === 730000) return "Root";

    if (
      this.categories["Physical Object"]?.uid === id ||
      this.categories["Physical Object"]?.descendants.includes(id)
    ) {
      category = "Physical Object";
    } else if (
      this.categories["Occurrence"]?.uid === id ||
      this.categories["Occurrence"]?.descendants.includes(id)
    ) {
      category = "Occurrence";
    } else if (
      this.categories["Role"]?.uid === id ||
      this.categories["Role"]?.descendants.includes(id)
    ) {
      category = "Role";
    } else if (
      this.categories["Aspect"]?.uid === id ||
      this.categories["Aspect"]?.descendants.includes(id)
    ) {
      category = "Aspect";
    } else if (
      this.categories["Relation"]?.uid === id ||
      this.categories["Relation"]?.descendants.includes(id)
    ) {
      category = "Relation";
    }

    return category;
  }

  /**
   * Get a node's color based on its category
   */
  getNodeColor(id: number): string {
    let color;

    const cat = this.getNodeCategory(id);

    if (cat === "Root") return "#fff";

    if (cat === "Physical Object") {
      color = this.catColors[730044];
    } else if (cat === "Occurrence") {
      color = this.catColors[193671];
    } else if (cat === "Role") {
      color = this.catColors[160170];
    } else if (cat === "Aspect") {
      color = this.catColors[790229];
    } else if (cat === "Relation") {
      color = this.catColors[2850];
    }

    return color || "#999";
  }

  /**
   * Check if the store has a specific node
   */
  hasNode(id: number): boolean {
    return this.nodeEntities.has(id);
  }

  /**
   * Check if the store has a specific edge
   */
  hasEdge(id: number): boolean {
    return this.edgeEntities.has(id);
  }

  /**
   * Get edges connected to a node
   */
  getConnectedEdges(nodeId: number): IEdgeEntity[] {
    return this.allEdges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
  }

  /**
   * Get nodes connected to a node
   */
  getConnectedNodes(nodeId: number): INodeEntity[] {
    const connectedEdges = this.getConnectedEdges(nodeId);
    const connectedNodeIds = new Set<number>();

    connectedEdges.forEach((edge) => {
      if (edge.source !== nodeId) connectedNodeIds.add(edge.source);
      if (edge.target !== nodeId) connectedNodeIds.add(edge.target);
    });

    return Array.from(connectedNodeIds)
      .map((id) => this.getNode(id))
      .filter((node): node is INodeEntity => node !== undefined);
  }
}

export default GraphDataStore;
