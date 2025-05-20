import createGraph, { Graph, Link } from "ngraph.graph";
import createLayout, { Layout } from "ngraph.forcelayout";
import { Position } from "../../types.js";

// Types for messages received from the main thread
type WorkerMessage = {
  cmd: string;
  payload: unknown;
};

// Types for simulation configuration
interface ISimulationConfig {
  readonly timeStep: number;
  readonly dimensions: number;
  readonly gravity: number;
  readonly theta: number;
  readonly springLength: number;
  readonly springCoefficient: number;
  readonly dragCoefficient: number;
}

// Default simulation configuration
const DEFAULT_SIMULATION_CONFIG: ISimulationConfig = {
  timeStep: 1,
  dimensions: 3,
  gravity: -6,
  theta: 0.8,
  springLength: 10,
  springCoefficient: 0.9,
  dragCoefficient: 0.9,
};

// Physics simulation state
let graph: Graph;
let layout: Layout<Graph>;
const links: Map<number, Link> = new Map();
let config: ISimulationConfig = DEFAULT_SIMULATION_CONFIG;

/**
 * Initialize the physics simulation
 */
function initSimulation(customConfig: Partial<ISimulationConfig> = {}) {
  // Merge provided config with defaults
  config = { ...DEFAULT_SIMULATION_CONFIG, ...customConfig };

  // Initialize physics engine
  graph = createGraph();
  layout = createLayout(graph, config);

  // Add custom forces
  setupCustomForces();

  return { success: true };
}

/**
 * Set up custom forces for the simulation
 */
function setupCustomForces() {
  // Add a force to push classification relations downward
  layout.simulator.addForce("classificationForce", () => {
    graph.forEachLink((link) => {
      if (link.data.rel_type_uid === 1146) {
        const fromBody = layout.getBody(link.fromId);
        if (fromBody) {
          // Push classification relations downward
          fromBody.force.y += -0.1;
        }
      }
    });
  });

  // Add a bounding sphere force to keep nodes within a certain radius
  layout.simulator.addForce("boundingSphere", () => {
    const radius = 61.8; // Golden ratio * 10 for aesthetics

    graph.forEachNode((node) => {
      const body = layout.getBody(node.id);
      if (!body) return;

      // Calculate distance from origin
      const posZ = body.pos.z || 0;
      const distanceFromOrigin = Math.sqrt(
        body.pos.x ** 2 + body.pos.y ** 2 + posZ ** 2
      );

      // If outside the bounding sphere, apply a force toward the center
      if (distanceFromOrigin > radius) {
        const forceMagnitude = 0.1 * (distanceFromOrigin - radius);
        const forceX = (-body.pos.x / distanceFromOrigin) * forceMagnitude;
        const forceY = (-body.pos.y / distanceFromOrigin) * forceMagnitude;
        const forceZ = (-posZ / distanceFromOrigin) * forceMagnitude;

        body.force.x += forceX;
        body.force.y += forceY;
        if (body.force.z !== undefined) {
          body.force.z += forceZ;
        }
      }
    });
  });
}

/**
 * Add a node to the physics simulation
 */
function addNode(node: {
  id: number;
  name: string;
  val: number;
  pos?: Position;
}) {
  graph.beginUpdate();

  if (!graph.getNode(node.id)) {
    const graphNode = graph.addNode(node.id);

    // Pin the root node at a fixed position
    if (node.id === 730000) {
      layout.pinNode(graphNode, true);
      layout.setNodePosition(730000, 0, 25, 0);
    }

    // If the node has a position, use it
    if (node.pos) {
      layout.setNodePosition(node.id, node.pos.x, node.pos.y, node.pos.z);
    }
  }

  graph.endUpdate();
  return { success: true };
}

/**
 * Remove a node from the physics simulation
 */
function removeNode(id: number) {
  graph.beginUpdate();

  const node = graph.getNode(id);
  if (node) {
    graph.removeNode(id);
  }

  graph.endUpdate();
  return { success: true };
}

/**
 * Add a link (edge) to the physics simulation
 */
function addLink(edge: {
  id: number;
  source: number;
  target: number;
  fact: {
    fact_uid: number;
    rel_type_uid?: number;
    [key: string]: unknown;
  };
}) {
  graph.beginUpdate();

  if (!links.has(edge.id)) {
    // Skip self-loops in the physics simulation
    if (edge.source !== edge.target) {
      const link = graph.addLink(edge.source, edge.target, edge.fact);
      links.set(edge.id, link);
    }
  }

  graph.endUpdate();
  return { success: true };
}

/**
 * Remove a link from the physics simulation
 */
function removeLink(id: number) {
  graph.beginUpdate();

  const link = links.get(id);
  if (link) {
    graph.removeLink(link);
    links.delete(id);
  }

  graph.endUpdate();
  return { success: true };
}

/**
 * Update the physics configuration
 */
function updateConfig(newConfig: Partial<ISimulationConfig>) {
  config = { ...config, ...newConfig };

  // Recreate the layout with the new config
  layout = createLayout(graph, config);
  setupCustomForces();

  return { success: true };
}

/**
 * Set the position of a node
 */
function setNodePosition(id: number, position: Position) {
  layout.setNodePosition(id, position.x, position.y, position.z);
  return { success: true };
}

/**
 * Pin a node at its current position
 */
function pinNode(id: number, isPinned: boolean) {
  const node = graph.getNode(id);
  if (node) {
    layout.pinNode(node, isPinned);
  }
  return { success: true };
}

/**
 * Perform one step of the physics simulation and return all positions
 */
function stepSimulation() {
  // Step the layout
  layout.step();

  // Collect node positions
  const nodePositions: Record<number, Position> = {};
  graph.forEachNode((node) => {
    const id = node.id as number;
    const nodePosition = layout.getNodePosition(id);
    if (!nodePosition) return;

    // Ensure z-coordinate exists
    nodePositions[id] = {
      x: nodePosition.x,
      y: nodePosition.y,
      z: nodePosition.z || 0,
    };
  });

  // Collect edge positions
  const edgePositions: Record<number, { source: Position; target: Position }> =
    {};
  graph.forEachLink((link: Link) => {
    const { fromId, toId, data } = link;

    // Get positions from the physics simulation
    const source = layout.getNodePosition(fromId);
    const target = layout.getNodePosition(toId);

    if (!source || !target) return;

    // Create position objects
    edgePositions[data.fact_uid] = {
      source: {
        x: source.x,
        y: source.y,
        z: source.z || 0,
      },
      target: {
        x: target.x,
        y: target.y,
        z: target.z || 0,
      },
    };
  });

  return {
    nodePositions,
    edgePositions,
  };
}

// Handle messages from the main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { cmd, payload } = e.data;

  let response;
  switch (cmd) {
    case "INIT":
      response = initSimulation(payload);
      break;
    case "ADD_NODE":
      response = addNode(payload);
      break;
    case "REMOVE_NODE":
      response = removeNode(payload);
      break;
    case "ADD_EDGE":
      response = addLink(payload);
      break;
    case "REMOVE_EDGE":
      response = removeLink(payload);
      break;
    case "UPDATE_CONFIG":
      response = updateConfig(payload);
      break;
    case "SET_NODE_POSITION":
      response = setNodePosition(payload.id, payload.position);
      break;
    case "PIN_NODE":
      response = pinNode(payload.id, payload.isPinned);
      break;
    case "STEP":
      response = stepSimulation();
      break;
    default:
      response = { error: `Unknown command: ${cmd}` };
  }

  // Send response back to the main thread
  self.postMessage({
    cmd,
    payload: response,
  });
};

// Let the main thread know the worker is ready
self.postMessage({ cmd: "READY", payload: { success: true } });
