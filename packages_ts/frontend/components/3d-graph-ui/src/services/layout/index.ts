/**
 * Layout module
 *
 * Provides a plugin system for graph layout algorithms
 */

// Import types and classes
import LayoutRegistry from "./LayoutRegistry.js";
import ForceDirectedLayout from "./ForceDirectedLayout.js";
import GridLayout from "./GridLayout.js";

// Export interfaces and base classes
export type { LayoutPlugin } from "./LayoutPlugin.js";
export { BaseLayoutPlugin } from "./LayoutPlugin.js";
export { default as LayoutRegistry } from "./LayoutRegistry.js";

// Export concrete layout implementations
export { default as ForceDirectedLayout } from "./ForceDirectedLayout.js";
export { default as GridLayout } from "./GridLayout.js";

// Factory function to create and register default layouts
export function createDefaultLayouts(registry: LayoutRegistry): void {
  // Create and register force-directed layout
  const forceDirectedLayout = new ForceDirectedLayout();
  registry.registerPlugin(forceDirectedLayout);

  // Create and register grid layout
  const gridLayout = new GridLayout();
  registry.registerPlugin(gridLayout);
}
