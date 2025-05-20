import * as THREE from "three";
import { Position } from "../../types.js";
import { INodeEntity } from "../../types/models.js";

/**
 * Interface for a spatial index structure
 */
export interface ISpatialIndex<T> {
  insert(id: number, position: Position, data: T): void;
  remove(id: number): boolean;
  update(id: number, position: Position): boolean;
  query(position: Position, radius: number): Array<{ id: number; data: T }>;
  queryBox(min: Position, max: Position): Array<{ id: number; data: T }>;
  clear(): void;
  getAll(): Array<{ id: number; position: Position; data: T }>;
}

/**
 * OctreeNode class for the Octree implementation
 */
class OctreeNode<T> {
  private center: THREE.Vector3;
  private size: number;
  private maxObjects: number;
  private maxDepth: number;
  private depth: number;
  private objects: Map<number, { position: THREE.Vector3; data: T }> =
    new Map();
  private children: Array<OctreeNode<T> | null> = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  private bounds: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(
    center: THREE.Vector3,
    size: number,
    maxObjects: number = 8,
    maxDepth: number = 8,
    depth: number = 0
  ) {
    this.center = center;
    this.size = size;
    this.maxObjects = maxObjects;
    this.maxDepth = maxDepth;
    this.depth = depth;

    // Calculate bounds
    const half = size / 2;
    this.bounds = {
      min: new THREE.Vector3(center.x - half, center.y - half, center.z - half),
      max: new THREE.Vector3(center.x + half, center.y + half, center.z + half),
    };
  }

  /**
   * Check if a point is within this node's bounds
   */
  contains(position: THREE.Vector3): boolean {
    return (
      position.x >= this.bounds.min.x &&
      position.y >= this.bounds.min.y &&
      position.z >= this.bounds.min.z &&
      position.x <= this.bounds.max.x &&
      position.y <= this.bounds.max.y &&
      position.z <= this.bounds.max.z
    );
  }

  /**
   * Get the index of the child node that would contain the position
   */
  getChildIndex(position: THREE.Vector3): number {
    let index = 0;
    if (position.x >= this.center.x) index |= 1;
    if (position.y >= this.center.y) index |= 2;
    if (position.z >= this.center.z) index |= 4;
    return index;
  }

  /**
   * Insert an object into the octree
   */
  insert(id: number, position: THREE.Vector3, data: T): boolean {
    // Check if position is within bounds
    if (!this.contains(position)) {
      return false;
    }

    // If we have space and haven't subdivided, add here
    if (this.objects.size < this.maxObjects || this.depth >= this.maxDepth) {
      this.objects.set(id, { position, data });
      return true;
    }

    // Otherwise, subdivide if needed and add to appropriate child
    if (this.children[0] === null) {
      this.subdivide();
    }

    // Add to the appropriate child
    const childIndex = this.getChildIndex(position);
    return this.children[childIndex]!.insert(id, position, data);
  }

  /**
   * Subdivide this node into 8 children
   */
  subdivide(): void {
    const halfSize = this.size / 2;
    const quarterSize = halfSize / 2;

    // Create 8 children
    for (let i = 0; i < 8; i++) {
      const x = this.center.x + (i & 1 ? quarterSize : -quarterSize);
      const y = this.center.y + (i & 2 ? quarterSize : -quarterSize);
      const z = this.center.z + (i & 4 ? quarterSize : -quarterSize);

      const childCenter = new THREE.Vector3(x, y, z);
      this.children[i] = new OctreeNode<T>(
        childCenter,
        halfSize,
        this.maxObjects,
        this.maxDepth,
        this.depth + 1
      );
    }

    // Redistribute existing objects to children
    const objectsToRedistribute = Array.from(this.objects.entries());
    this.objects.clear();

    for (const [id, { position, data }] of objectsToRedistribute) {
      const childIndex = this.getChildIndex(position);
      this.children[childIndex]!.insert(id, position, data);
    }
  }

  /**
   * Remove an object from the octree
   */
  remove(id: number): boolean {
    // Check if the object is in this node
    if (this.objects.has(id)) {
      this.objects.delete(id);
      return true;
    }

    // If we have children, try to remove from them
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child && child.remove(id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Update an object's position
   */
  update(id: number, newPosition: THREE.Vector3): boolean {
    // First, find and remove the object
    const found = this.findAndRemove(id);
    if (!found) return false;

    // Then, reinsert it with the new position
    const rootNode = this.getRootNode();
    return rootNode.insert(id, newPosition, found.data);
  }

  /**
   * Find and remove an object, returning its data
   */
  private findAndRemove(
    id: number
  ): { position: THREE.Vector3; data: T } | null {
    // Check if the object is in this node
    if (this.objects.has(id)) {
      const obj = this.objects.get(id)!;
      this.objects.delete(id);
      return obj;
    }

    // If we have children, try to find in them
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child) {
          const found = child.findAndRemove(id);
          if (found) return found;
        }
      }
    }

    return null;
  }

  /**
   * Get the root node of the octree
   *
   * Note: In this implementation, we don't track parent references,
   * so we just return this node as the "root" for simplicity.
   * In a production implementation, we would maintain parent references.
   */
  private getRootNode(): OctreeNode<T> {
    // Since we don't track parent references, just return this node
    return this;
  }

  /**
   * Query objects within a radius of a position
   */
  query(
    position: THREE.Vector3,
    radius: number
  ): Array<{ id: number; data: T }> {
    const result: Array<{ id: number; data: T }> = [];

    // Check if the query sphere intersects this node
    const sqRadius = radius * radius;

    // Quick check against bounds
    if (!this.intersectsSphere(position, radius)) {
      return result;
    }

    // Add objects from this node that are within the radius
    for (const [id, obj] of this.objects.entries()) {
      if (position.distanceToSquared(obj.position) <= sqRadius) {
        result.push({ id, data: obj.data });
      }
    }

    // If we have children, query them too
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child) {
          result.push(...child.query(position, radius));
        }
      }
    }

    return result;
  }

  /**
   * Check if a sphere intersects this node's bounds
   */
  private intersectsSphere(position: THREE.Vector3, radius: number): boolean {
    // Find the closest point on the box to the sphere center
    const closestX = Math.max(
      this.bounds.min.x,
      Math.min(position.x, this.bounds.max.x)
    );
    const closestY = Math.max(
      this.bounds.min.y,
      Math.min(position.y, this.bounds.max.y)
    );
    const closestZ = Math.max(
      this.bounds.min.z,
      Math.min(position.z, this.bounds.max.z)
    );

    // Calculate squared distance between closest point and sphere center
    const distanceSquared =
      (closestX - position.x) * (closestX - position.x) +
      (closestY - position.y) * (closestY - position.y) +
      (closestZ - position.z) * (closestZ - position.z);

    // If the distance is less than the radius squared, they intersect
    return distanceSquared <= radius * radius;
  }

  /**
   * Query objects within an axis-aligned bounding box
   */
  queryBox(
    min: THREE.Vector3,
    max: THREE.Vector3
  ): Array<{ id: number; data: T }> {
    const result: Array<{ id: number; data: T }> = [];

    // Check if the query box intersects this node
    if (!this.intersectsBox(min, max)) {
      return result;
    }

    // Add objects from this node that are within the box
    for (const [id, obj] of this.objects.entries()) {
      if (
        obj.position.x >= min.x &&
        obj.position.x <= max.x &&
        obj.position.y >= min.y &&
        obj.position.y <= max.y &&
        obj.position.z >= min.z &&
        obj.position.z <= max.z
      ) {
        result.push({ id, data: obj.data });
      }
    }

    // If we have children, query them too
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child) {
          result.push(...child.queryBox(min, max));
        }
      }
    }

    return result;
  }

  /**
   * Check if an axis-aligned bounding box intersects this node's bounds
   */
  private intersectsBox(min: THREE.Vector3, max: THREE.Vector3): boolean {
    return !(
      max.x < this.bounds.min.x ||
      min.x > this.bounds.max.x ||
      max.y < this.bounds.min.y ||
      min.y > this.bounds.max.y ||
      max.z < this.bounds.min.z ||
      min.z > this.bounds.max.z
    );
  }

  /**
   * Get all objects in this node and its children
   */
  getAll(): Array<{ id: number; position: THREE.Vector3; data: T }> {
    const result: Array<{ id: number; position: THREE.Vector3; data: T }> = [];

    // Add objects from this node
    for (const [id, obj] of this.objects.entries()) {
      result.push({ id, position: obj.position, data: obj.data });
    }

    // If we have children, get objects from them too
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child) {
          result.push(...child.getAll());
        }
      }
    }

    return result;
  }

  /**
   * Clear all objects from this node and its children
   */
  clear(): void {
    this.objects.clear();

    // Clear children if they exist
    if (this.children[0] !== null) {
      for (const child of this.children) {
        if (child) {
          child.clear();
        }
      }
      this.children = [null, null, null, null, null, null, null, null];
    }
  }
}

/**
 * Octree implementation of the spatial index
 */
export class Octree<T> implements ISpatialIndex<T> {
  private root: OctreeNode<T>;
  private objectMap: Map<number, { position: THREE.Vector3; data: T }> =
    new Map();

  constructor(
    center: Position = { x: 0, y: 0, z: 0 },
    size: number = 1000,
    maxObjects: number = 8,
    maxDepth: number = 8
  ) {
    this.root = new OctreeNode<T>(
      new THREE.Vector3(center.x, center.y, center.z),
      size,
      maxObjects,
      maxDepth
    );
  }

  /**
   * Insert an object into the octree
   */
  insert(id: number, position: Position, data: T): void {
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    this.objectMap.set(id, { position: pos, data });
    this.root.insert(id, pos, data);
  }

  /**
   * Remove an object from the octree
   */
  remove(id: number): boolean {
    this.objectMap.delete(id);
    return this.root.remove(id);
  }

  /**
   * Update an object's position
   */
  update(id: number, position: Position): boolean {
    if (!this.objectMap.has(id)) return false;

    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const data = this.objectMap.get(id)!.data;

    // Update the object map
    this.objectMap.set(id, { position: pos, data });

    // Update in the octree
    return this.root.update(id, pos);
  }

  /**
   * Query objects within a radius of a position
   */
  query(position: Position, radius: number): Array<{ id: number; data: T }> {
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    return this.root.query(pos, radius);
  }

  /**
   * Query objects within an axis-aligned bounding box
   */
  queryBox(min: Position, max: Position): Array<{ id: number; data: T }> {
    const minVec = new THREE.Vector3(min.x, min.y, min.z);
    const maxVec = new THREE.Vector3(max.x, max.y, max.z);
    return this.root.queryBox(minVec, maxVec);
  }

  /**
   * Get all objects in the octree
   */
  getAll(): Array<{ id: number; position: Position; data: T }> {
    return this.root.getAll().map(({ id, position, data }) => ({
      id,
      position: { x: position.x, y: position.y, z: position.z },
      data,
    }));
  }

  /**
   * Clear all objects from the octree
   */
  clear(): void {
    this.objectMap.clear();
    this.root.clear();
  }

  /**
   * Get the number of objects in the octree
   */
  get size(): number {
    return this.objectMap.size;
  }
}

/**
 * SpatialHashGrid implementation of the spatial index
 */
export class SpatialHashGrid<T> implements ISpatialIndex<T> {
  private cellSize: number;
  private cells: Map<
    string,
    Map<number, { position: THREE.Vector3; data: T }>
  > = new Map();
  private objectMap: Map<
    number,
    { position: THREE.Vector3; data: T; cellKey: string }
  > = new Map();

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
  }

  /**
   * Get the cell key for a position
   */
  private getCellKey(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Insert an object into the grid
   */
  insert(id: number, position: Position, data: T): void {
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const cellKey = this.getCellKey(pos);

    // Create the cell if it doesn't exist
    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, new Map());
    }

    // Add the object to the cell
    this.cells.get(cellKey)!.set(id, { position: pos, data });

    // Add to the object map
    this.objectMap.set(id, { position: pos, data, cellKey });
  }

  /**
   * Remove an object from the grid
   */
  remove(id: number): boolean {
    if (!this.objectMap.has(id)) return false;

    const { cellKey } = this.objectMap.get(id)!;

    // Remove from the cell
    const cell = this.cells.get(cellKey);
    if (cell) {
      cell.delete(id);

      // Remove the cell if it's empty
      if (cell.size === 0) {
        this.cells.delete(cellKey);
      }
    }

    // Remove from the object map
    this.objectMap.delete(id);

    return true;
  }

  /**
   * Update an object's position
   */
  update(id: number, position: Position): boolean {
    if (!this.objectMap.has(id)) return false;

    const { data, cellKey: oldCellKey } = this.objectMap.get(id)!;
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const newCellKey = this.getCellKey(pos);

    // If the cell hasn't changed, just update the position
    if (oldCellKey === newCellKey) {
      const cell = this.cells.get(oldCellKey)!;
      cell.set(id, { position: pos, data });
      this.objectMap.set(id, { position: pos, data, cellKey: oldCellKey });
      return true;
    }

    // Otherwise, remove from the old cell and add to the new one
    this.remove(id);
    this.insert(id, position, data);
    return true;
  }

  /**
   * Query objects within a radius of a position
   */
  query(position: Position, radius: number): Array<{ id: number; data: T }> {
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const result: Array<{ id: number; data: T }> = [];
    const sqRadius = radius * radius;

    // Calculate the range of cells to check
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    // Check each cell in the range
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const cellKey = `${x},${y},${z}`;
          const cell = this.cells.get(cellKey);

          if (cell) {
            // Check each object in the cell
            for (const [id, obj] of cell.entries()) {
              if (pos.distanceToSquared(obj.position) <= sqRadius) {
                result.push({ id, data: obj.data });
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Query objects within an axis-aligned bounding box
   */
  queryBox(min: Position, max: Position): Array<{ id: number; data: T }> {
    const result: Array<{ id: number; data: T }> = [];

    // Calculate the range of cells to check
    const minX = Math.floor(min.x / this.cellSize);
    const minY = Math.floor(min.y / this.cellSize);
    const minZ = Math.floor(min.z / this.cellSize);
    const maxX = Math.floor(max.x / this.cellSize);
    const maxY = Math.floor(max.y / this.cellSize);
    const maxZ = Math.floor(max.z / this.cellSize);

    // Check each cell in the range
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const cellKey = `${x},${y},${z}`;
          const cell = this.cells.get(cellKey);

          if (cell) {
            // Check each object in the cell
            for (const [id, obj] of cell.entries()) {
              const { x, y, z } = obj.position;
              if (
                x >= min.x &&
                x <= max.x &&
                y >= min.y &&
                y <= max.y &&
                z >= min.z &&
                z <= max.z
              ) {
                result.push({ id, data: obj.data });
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Get all objects in the grid
   */
  getAll(): Array<{ id: number; position: Position; data: T }> {
    const result: Array<{ id: number; position: Position; data: T }> = [];

    for (const [id, { position, data }] of this.objectMap.entries()) {
      result.push({
        id,
        position: { x: position.x, y: position.y, z: position.z },
        data,
      });
    }

    return result;
  }

  /**
   * Clear all objects from the grid
   */
  clear(): void {
    this.cells.clear();
    this.objectMap.clear();
  }

  /**
   * Get the number of objects in the grid
   */
  get size(): number {
    return this.objectMap.size;
  }
}

/**
 * SpatialIndexService
 *
 * Service for managing spatial indexing of graph nodes and edges
 * Provides methods for efficient spatial queries
 */
class SpatialIndexService {
  private nodeIndex: ISpatialIndex<INodeEntity>;
  private autoUpdateEnabled: boolean = true;
  private boundingBox: { min: Position; max: Position } = {
    min: { x: -500, y: -500, z: -500 },
    max: { x: 500, y: 500, z: 500 },
  };

  /**
   * Create a new SpatialIndexService
   *
   * @param indexType The type of spatial index to use ('octree' or 'grid')
   * @param options Configuration options for the spatial index
   */
  constructor(
    indexType: "octree" | "grid" = "octree",
    options: {
      center?: Position;
      size?: number;
      cellSize?: number;
      maxObjects?: number;
      maxDepth?: number;
      autoUpdate?: boolean;
    } = {}
  ) {
    const {
      center = { x: 0, y: 0, z: 0 },
      size = 1000,
      cellSize = 10,
      maxObjects = 8,
      maxDepth = 8,
      autoUpdate = true,
    } = options;

    this.autoUpdateEnabled = autoUpdate;

    // Create the appropriate spatial index
    if (indexType === "octree") {
      this.nodeIndex = new Octree<INodeEntity>(
        center,
        size,
        maxObjects,
        maxDepth
      );
    } else {
      this.nodeIndex = new SpatialHashGrid<INodeEntity>(cellSize);
    }

    // Set initial bounding box based on size
    const halfSize = size / 2;
    this.boundingBox = {
      min: {
        x: center.x - halfSize,
        y: center.y - halfSize,
        z: center.z - halfSize,
      },
      max: {
        x: center.x + halfSize,
        y: center.y + halfSize,
        z: center.z + halfSize,
      },
    };
  }

  /**
   * Add a node to the spatial index
   */
  addNode(node: INodeEntity): void {
    if (!node.pos) return;
    this.nodeIndex.insert(node.id, node.pos, node);
  }

  /**
   * Remove a node from the spatial index
   */
  removeNode(id: number): boolean {
    return this.nodeIndex.remove(id);
  }

  /**
   * Update a node's position in the spatial index
   */
  updateNodePosition(id: number, position: Position): boolean {
    return this.nodeIndex.update(id, position);
  }

  /**
   * Find nodes within a radius of a position
   */
  findNodesInRadius(position: Position, radius: number): Array<INodeEntity> {
    const results = this.nodeIndex.query(position, radius);
    return results.map((result) => result.data);
  }

  /**
   * Find node IDs within a radius of a position
   */
  findNodeIdsInRadius(position: Position, radius: number): Array<number> {
    const results = this.nodeIndex.query(position, radius);
    return results.map((result) => result.id);
  }

  /**
   * Find nodes within a rectangular region
   */
  findNodesInRegion(min: Position, max: Position): Array<INodeEntity> {
    const results = this.nodeIndex.queryBox(min, max);
    return results.map((result) => result.data);
  }

  /**
   * Find node IDs within a rectangular region
   */
  findNodeIdsInRegion(min: Position, max: Position): Array<number> {
    const results = this.nodeIndex.queryBox(min, max);
    return results.map((result) => result.id);
  }

  /**
   * Find the nearest node to a position
   */
  findNearestNode(
    position: Position,
    maxRadius: number = 100
  ): INodeEntity | null {
    // Start with a small radius and increase until we find something
    let radius = 1;
    while (radius <= maxRadius) {
      const nodes = this.findNodesInRadius(position, radius);
      if (nodes.length > 0) {
        // Find the closest node
        let closestNode = nodes[0];
        let closestDistSq = this.distanceSquared(position, closestNode.pos!);

        for (let i = 1; i < nodes.length; i++) {
          const distSq = this.distanceSquared(position, nodes[i].pos!);
          if (distSq < closestDistSq) {
            closestNode = nodes[i];
            closestDistSq = distSq;
          }
        }

        return closestNode;
      }

      // Double the radius and try again
      radius *= 2;
    }

    return null;
  }

  /**
   * Calculate the squared distance between two positions
   */
  private distanceSquared(a: Position, b: Position): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Find potential collision candidates for a node
   */
  findCollisionCandidates(nodeId: number, radius: number): Array<INodeEntity> {
    // Get the node's position
    const node = this.getNodeById(nodeId);
    if (!node || !node.pos) return [];

    // Find nodes within the radius, excluding the node itself
    const results = this.findNodesInRadius(node.pos, radius);
    return results.filter((n) => n.id !== nodeId);
  }

  /**
   * Get a node by ID
   */
  private getNodeById(id: number): INodeEntity | null {
    const allNodes = this.nodeIndex.getAll();
    const node = allNodes.find((n) => n.id === id);
    return node ? node.data : null;
  }

  /**
   * Update the bounding box of the spatial index
   */
  updateBoundingBox(min: Position, max: Position): void {
    this.boundingBox = { min, max };
  }

  /**
   * Get the current bounding box
   */
  getBoundingBox(): { min: Position; max: Position } {
    return this.boundingBox;
  }

  /**
   * Enable or disable auto-updating
   */
  setAutoUpdate(enabled: boolean): void {
    this.autoUpdateEnabled = enabled;
  }

  /**
   * Check if auto-updating is enabled
   */
  isAutoUpdateEnabled(): boolean {
    return this.autoUpdateEnabled;
  }

  /**
   * Clear the spatial index
   */
  clear(): void {
    this.nodeIndex.clear();
  }

  /**
   * Get the number of nodes in the spatial index
   */
  get nodeCount(): number {
    return (this.nodeIndex as unknown as { size: number }).size || 0;
  }

  /**
   * Rebuild the spatial index from a list of nodes
   */
  rebuildFromNodes(nodes: INodeEntity[]): void {
    this.clear();
    for (const node of nodes) {
      if (node.pos) {
        this.addNode(node);
      }
    }
  }
}

export default SpatialIndexService;
