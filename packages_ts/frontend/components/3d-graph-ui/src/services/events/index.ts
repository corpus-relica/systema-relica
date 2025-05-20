/**
 * Events module
 *
 * Provides an event system for handling graph interactions
 */

// Export event system
export { default as EventSystem } from "./EventSystem.js";

// Export event types and interfaces
export {
  EventType,
  EventPhase,
  type Event,
  type NodeEvent,
  type EdgeEvent,
  type CanvasEvent,
  type SelectionEvent,
  type GraphEvent,
  type CustomEvent,
  type GraphEvents,
  type EventHandler,
  type EventMiddleware,
} from "./EventSystem.js";
