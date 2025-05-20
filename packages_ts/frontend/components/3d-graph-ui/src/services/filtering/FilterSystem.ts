import { makeAutoObservable } from "mobx";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";

/**
 * Filter operator types for combining criteria
 */
export enum FilterOperator {
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
}

/**
 * Base filter criteria interface
 */
export interface FilterCriteria<T> {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  evaluate: (entity: T) => boolean;
}

/**
 * Composite filter criteria for combining multiple criteria
 */
export interface CompositeFilterCriteria<T> extends FilterCriteria<T> {
  operator: FilterOperator;
  criteria: Array<FilterCriteria<T>>;
}

/**
 * Type filter criteria for filtering by entity type
 */
export interface TypeFilterCriteria<T> extends FilterCriteria<T> {
  types: number[];
  getType: (entity: T) => number;
}

/**
 * Property filter criteria for filtering by entity property
 */
export interface PropertyFilterCriteria<T> extends FilterCriteria<T> {
  property: string;
  value: unknown;
  comparator:
    | "equals"
    | "notEquals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan";
}

/**
 * Custom filter criteria for custom filtering logic
 */
export interface CustomFilterCriteria<T> extends FilterCriteria<T> {
  customEvaluator: (entity: T) => boolean;
}

/**
 * Filter result containing filtered node and edge IDs
 */
export interface FilterResult {
  visibleNodeIds: Set<number>;
  visibleEdgeIds: Set<number>;
}

/**
 * Factory functions for creating filter criteria
 */
export const FilterFactory = {
  /**
   * Create a composite filter criteria
   */
  createComposite<T>(
    id: string,
    name: string,
    operator: FilterOperator,
    criteria: Array<FilterCriteria<T>>,
    enabled = true
  ): CompositeFilterCriteria<T> {
    return {
      id,
      name,
      operator,
      criteria,
      enabled,
      evaluate: (entity: T) => {
        const enabledCriteria = criteria.filter((c) => c.enabled);

        if (enabledCriteria.length === 0) {
          return true; // No enabled criteria means everything passes
        }

        switch (operator) {
          case FilterOperator.AND:
            return enabledCriteria.every((c) => c.evaluate(entity));
          case FilterOperator.OR:
            return enabledCriteria.some((c) => c.evaluate(entity));
          case FilterOperator.NOT:
            return !enabledCriteria.some((c) => c.evaluate(entity));
          default:
            return true;
        }
      },
    };
  },

  /**
   * Create a type filter criteria
   */
  createTypeFilter<T>(
    id: string,
    name: string,
    types: number[],
    getType: (entity: T) => number,
    enabled = true
  ): TypeFilterCriteria<T> {
    return {
      id,
      name,
      types,
      getType,
      enabled,
      evaluate: (entity: T) => {
        const type = getType(entity);
        return types.includes(type);
      },
    };
  },

  /**
   * Create a property filter criteria
   */
  createPropertyFilter<T>(
    id: string,
    name: string,
    property: string,
    value: unknown,
    comparator:
      | "equals"
      | "notEquals"
      | "contains"
      | "startsWith"
      | "endsWith"
      | "greaterThan"
      | "lessThan",
    enabled = true
  ): PropertyFilterCriteria<T> {
    return {
      id,
      name,
      property,
      value,
      comparator,
      enabled,
      evaluate: (entity: T) => {
        const entityValue = (entity as Record<string, unknown>)[property];

        switch (comparator) {
          case "equals":
            return entityValue === value;
          case "notEquals":
            return entityValue !== value;
          case "contains":
            return (
              typeof entityValue === "string" &&
              typeof value === "string" &&
              entityValue.includes(value)
            );
          case "startsWith":
            return (
              typeof entityValue === "string" &&
              typeof value === "string" &&
              entityValue.startsWith(value)
            );
          case "endsWith":
            return (
              typeof entityValue === "string" &&
              typeof value === "string" &&
              entityValue.endsWith(value)
            );
          case "greaterThan":
            return (
              typeof entityValue === "number" &&
              typeof value === "number" &&
              entityValue > value
            );
          case "lessThan":
            return (
              typeof entityValue === "number" &&
              typeof value === "number" &&
              entityValue < value
            );
          default:
            return true;
        }
      },
    };
  },

  /**
   * Create a custom filter criteria
   */
  createCustomFilter<T>(
    id: string,
    name: string,
    customEvaluator: (entity: T) => boolean,
    enabled = true
  ): CustomFilterCriteria<T> {
    return {
      id,
      name,
      customEvaluator,
      enabled,
      evaluate: customEvaluator,
    };
  },
};

/**
 * Filter system for filtering nodes and edges
 */
export class FilterSystem {
  private nodeFilters: Map<string, FilterCriteria<INodeEntity>> = new Map();
  private edgeFilters: Map<string, FilterCriteria<IEdgeEntity>> = new Map();
  private cachedResult: FilterResult | null = null;
  private isDirty = true;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Add a node filter
   */
  addNodeFilter(filter: FilterCriteria<INodeEntity>): void {
    this.nodeFilters.set(filter.id, filter);
    this.invalidateCache();
  }

  /**
   * Remove a node filter
   */
  removeNodeFilter(id: string): boolean {
    const result = this.nodeFilters.delete(id);
    if (result) {
      this.invalidateCache();
    }
    return result;
  }

  /**
   * Get a node filter by ID
   */
  getNodeFilter(id: string): FilterCriteria<INodeEntity> | undefined {
    return this.nodeFilters.get(id);
  }

  /**
   * Add an edge filter
   */
  addEdgeFilter(filter: FilterCriteria<IEdgeEntity>): void {
    this.edgeFilters.set(filter.id, filter);
    this.invalidateCache();
  }

  /**
   * Remove an edge filter
   */
  removeEdgeFilter(id: string): boolean {
    const result = this.edgeFilters.delete(id);
    if (result) {
      this.invalidateCache();
    }
    return result;
  }

  /**
   * Get an edge filter by ID
   */
  getEdgeFilter(id: string): FilterCriteria<IEdgeEntity> | undefined {
    return this.edgeFilters.get(id);
  }

  /**
   * Enable or disable a node filter
   */
  setNodeFilterEnabled(id: string, enabled: boolean): boolean {
    const filter = this.nodeFilters.get(id);
    if (!filter) {
      return false;
    }

    filter.enabled = enabled;
    this.invalidateCache();
    return true;
  }

  /**
   * Enable or disable an edge filter
   */
  setEdgeFilterEnabled(id: string, enabled: boolean): boolean {
    const filter = this.edgeFilters.get(id);
    if (!filter) {
      return false;
    }

    filter.enabled = enabled;
    this.invalidateCache();
    return true;
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.nodeFilters.clear();
    this.edgeFilters.clear();
    this.invalidateCache();
  }

  /**
   * Apply filters to nodes and edges
   */
  applyFilters(
    nodes: Map<number, INodeEntity>,
    edges: Map<number, IEdgeEntity>
  ): FilterResult {
    // Use cached result if available
    if (!this.isDirty && this.cachedResult) {
      return this.cachedResult;
    }

    const visibleNodeIds = new Set<number>();
    const visibleEdgeIds = new Set<number>();

    // Get enabled filters
    const enabledNodeFilters = Array.from(this.nodeFilters.values()).filter(
      (f) => f.enabled
    );
    const enabledEdgeFilters = Array.from(this.edgeFilters.values()).filter(
      (f) => f.enabled
    );

    // If no filters are enabled, all nodes and edges are visible
    if (enabledNodeFilters.length === 0 && enabledEdgeFilters.length === 0) {
      nodes.forEach((_, id) => visibleNodeIds.add(id));
      edges.forEach((_, id) => visibleEdgeIds.add(id));

      this.cachedResult = { visibleNodeIds, visibleEdgeIds };
      this.isDirty = false;
      return this.cachedResult;
    }

    // Apply node filters
    nodes.forEach((node, id) => {
      if (
        enabledNodeFilters.length === 0 ||
        enabledNodeFilters.every((filter) => filter.evaluate(node))
      ) {
        visibleNodeIds.add(id);
      }
    });

    // Apply edge filters, but only consider edges where both nodes are visible
    edges.forEach((edge, id) => {
      if (
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target) &&
        (enabledEdgeFilters.length === 0 ||
          enabledEdgeFilters.every((filter) => filter.evaluate(edge)))
      ) {
        visibleEdgeIds.add(id);
      }
    });

    // Cache the result
    this.cachedResult = { visibleNodeIds, visibleEdgeIds };
    this.isDirty = false;

    return this.cachedResult;
  }

  /**
   * Check if a node is visible
   */
  isNodeVisible(node: INodeEntity): boolean {
    const enabledFilters = Array.from(this.nodeFilters.values()).filter(
      (f) => f.enabled
    );
    return (
      enabledFilters.length === 0 ||
      enabledFilters.every((filter) => filter.evaluate(node))
    );
  }

  /**
   * Check if an edge is visible
   */
  isEdgeVisible(edge: IEdgeEntity, visibleNodes: Set<number>): boolean {
    // Edge is only visible if both its nodes are visible
    if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) {
      return false;
    }

    const enabledFilters = Array.from(this.edgeFilters.values()).filter(
      (f) => f.enabled
    );
    return (
      enabledFilters.length === 0 ||
      enabledFilters.every((filter) => filter.evaluate(edge))
    );
  }

  /**
   * Invalidate the filter cache
   */
  private invalidateCache(): void {
    this.isDirty = true;
    this.cachedResult = null;
  }

  /**
   * Get all node filters
   */
  getAllNodeFilters(): FilterCriteria<INodeEntity>[] {
    return Array.from(this.nodeFilters.values());
  }

  /**
   * Get all edge filters
   */
  getAllEdgeFilters(): FilterCriteria<IEdgeEntity>[] {
    return Array.from(this.edgeFilters.values());
  }
}

export default FilterSystem;
