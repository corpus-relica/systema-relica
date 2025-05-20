/**
 * Rendering module
 *
 * Provides services for customizing the appearance of nodes and edges
 */

// Export style system
export { default as StyleSystem } from "./StyleSystem.js";

// Export style interfaces
export {
  type NodeStyle,
  type EdgeStyle,
  type Theme,
  type StyleRule,
  type StylePreset,
  LIGHT_THEME,
  DARK_THEME,
} from "./StyleSystem.js";

// Export material service if it exists
export { default as MaterialService } from "./MaterialService.js";
