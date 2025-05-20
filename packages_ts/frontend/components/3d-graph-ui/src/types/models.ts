import { Position } from "../types.js";

/**
 * Represents a node entity in the graph
 * Immutable data structure with validation
 */
export interface INodeEntity {
  readonly id: number;
  readonly name: string;
  readonly val: number;
  readonly pos?: Position;
}

/**
 * Represents an edge entity in the graph
 * Immutable data structure with validation
 */
export interface IEdgeEntity {
  readonly id: number;
  readonly type: number;
  readonly label: string;
  readonly source: number;
  readonly target: number;
  readonly sourcePos?: Position;
  readonly targetPos?: Position;
}

/**
 * Factory function to create a validated node entity
 */
export function createNodeEntity(data: {
  id: number;
  name: string;
  val?: number;
  pos?: Position;
}): INodeEntity {
  if (!data.id) {
    throw new Error("Node entity must have an id");
  }

  if (!data.name) {
    throw new Error("Node entity must have a name");
  }

  return {
    id: data.id,
    name: data.name,
    val: data.val ?? 0.25,
    pos: data.pos,
  };
}

/**
 * Factory function to create a validated edge entity
 */
export function createEdgeEntity(data: {
  id: number;
  type: number;
  label: string;
  source: number;
  target: number;
  sourcePos?: Position;
  targetPos?: Position;
}): IEdgeEntity {
  if (!data.id) {
    throw new Error("Edge entity must have an id");
  }

  if (!data.source || !data.target) {
    throw new Error("Edge entity must have source and target");
  }

  return {
    id: data.id,
    type: data.type,
    label: data.label || "",
    source: data.source,
    target: data.target,
    sourcePos: data.sourcePos,
    targetPos: data.targetPos,
  };
}

/**
 * Type for category data
 */
export interface ICategory {
  readonly uid: number;
  readonly name: string;
  readonly descendants: ReadonlyArray<number>;
}

/**
 * Type for simulation configuration
 */
export interface ISimulationConfig {
  readonly timeStep: number;
  readonly dimensions: number;
  readonly gravity: number;
  readonly theta: number;
  readonly springLength: number;
  readonly springCoefficient: number;
  readonly dragCoefficient: number;
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: ISimulationConfig = {
  timeStep: 1,
  dimensions: 3,
  gravity: -6,
  theta: 0.8,
  springLength: 10,
  springCoefficient: 0.9,
  dragCoefficient: 0.9,
};
