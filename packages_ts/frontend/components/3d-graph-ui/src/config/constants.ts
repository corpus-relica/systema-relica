/**
 * Configuration Constants for 3D Graph UI
 *
 * This file contains all the configuration constants used throughout the application.
 * Centralizing these values makes it easier to adjust the behavior and appearance
 * of the graph visualization.
 */

// Physics simulation constants
export const PHYSICS_CONSTANTS = {
  // Default collision radius for nodes
  COLLISION_RADIUS: 5,

  // Bounding sphere radius for physics simulation
  BOUNDING_SPHERE_RADIUS: 61.8, // Golden ratio * 10 for aesthetics

  // Force magnitudes
  CLASSIFICATION_FORCE: 0.1,
  BOUNDING_FORCE_MULTIPLIER: 0.1,
};

// Default simulation configuration
export const DEFAULT_SIMULATION_CONFIG = {
  timeStep: 1,
  dimensions: 3,
  gravity: -6,
  theta: 0.8,
  springLength: 10,
  springCoefficient: 0.9,
  dragCoefficient: 0.9,
};

// Spatial indexing constants
export const SPATIAL_INDEX_CONSTANTS = {
  // Default octree configuration
  OCTREE_CONFIG: {
    size: 1000,
    maxObjects: 16,
    maxDepth: 8,
  },

  // Default spatial hash grid configuration
  GRID_CONFIG: {
    cellSize: 10,
  },

  // Default bounding box
  DEFAULT_BOUNDING_BOX: {
    min: { x: -500, y: -500, z: -500 },
    max: { x: 500, y: 500, z: 500 },
  },
};

// Rendering constants
export const RENDERING_CONSTANTS = {
  // Default node size
  DEFAULT_NODE_SIZE: 0.25,

  // Default edge thickness
  DEFAULT_EDGE_THICKNESS: 0.1,

  // Opacity values
  HOVER_OPACITY: 0.8,
  EDGE_DEFAULT_OPACITY: 0.6,

  // Selection brightness multiplier
  SELECTION_BRIGHTNESS_MULTIPLIER: 1.2,

  // Search radius for raycasting
  RAYCAST_SEARCH_RADIUS: 20,
};

// Animation constants
export const ANIMATION_CONSTANTS = {
  // Default sleep delay for physics simulation
  DEFAULT_SLEEP_DELAY: 30000,
};

// Category colors
export const CATEGORY_COLORS = {
  PHYSICAL_OBJECT: "#8d70c9", // Physical Object (730044)
  OCCURRENCE: "#7fa44a", // Occurrence (193671)
  ROLE: "#ca5686", // Role (160170)
  ASPECT: "#49adad", // Aspect (790229)
  RELATION: "#c7703f", // Relation (2850)
  ROOT: "#ffffff", // Root node
  DEFAULT: "#999999", // Default color
};

// Text colors (imported from colors.ts)
export const TEXT_COLORS = {
  ULTIMATE_HIGHLIGHT: "#FFFFFF",
  HIGHLIGHT: "#FFFFFF",
  DEFAULT: "#FFFFFF",
};
