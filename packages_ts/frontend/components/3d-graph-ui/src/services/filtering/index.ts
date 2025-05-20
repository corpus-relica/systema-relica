/**
 * Filtering module
 *
 * Provides services for filtering nodes and edges based on criteria
 */

// Export filter system
export { default as FilterSystem } from "./FilterSystem.js";

// Export filter interfaces and enums
export {
  FilterOperator,
  type FilterCriteria,
  type CompositeFilterCriteria,
  type TypeFilterCriteria,
  type PropertyFilterCriteria,
  type CustomFilterCriteria,
  type FilterResult,
  FilterFactory,
} from "./FilterSystem.js";
