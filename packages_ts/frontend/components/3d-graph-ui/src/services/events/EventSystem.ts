import { makeAutoObservable } from "mobx";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";
import { Position } from "../../types.js";

/**
 * Event types supported by the event system
 */
export enum EventType {
  // Node events
  NODE_CLICK = "node:click",
  NODE_DOUBLE_CLICK = "node:doubleClick",
  NODE_HOVER_START = "node:hoverStart",
  NODE_HOVER_END = "node:hoverEnd",
  NODE_DRAG_START = "node:dragStart",
  NODE_DRAG = "node:drag",
  NODE_DRAG_END = "node:dragEnd",

  // Edge events
  EDGE_CLICK = "edge:click",
  EDGE_DOUBLE_CLICK = "edge:doubleClick",
  EDGE_HOVER_START = "edge:hoverStart",
  EDGE_HOVER_END = "edge:hoverEnd",

  // Canvas events
  CANVAS_CLICK = "canvas:click",
  CANVAS_DOUBLE_CLICK = "canvas:doubleClick",
  CANVAS_DRAG_START = "canvas:dragStart",
  CANVAS_DRAG = "canvas:drag",
  CANVAS_DRAG_END = "canvas:dragEnd",
  CANVAS_WHEEL = "canvas:wheel",

  // Selection events
  SELECTION_START = "selection:start",
  SELECTION_CHANGE = "selection:change",
  SELECTION_END = "selection:end",

  // Graph events
  GRAPH_UPDATE = "graph:update",
  LAYOUT_START = "layout:start",
  LAYOUT_STEP = "layout:step",
  LAYOUT_END = "layout:end",

  // Custom events
  CUSTOM = "custom",
}

/**
 * Base event interface
 */
export interface Event {
  type: EventType;
  timestamp: number;
  defaultPrevented: boolean;
  propagationStopped: boolean;
  target?: unknown;
  preventDefault(): void;
  stopPropagation(): void;
}

/**
 * Node event interface
 */
export interface NodeEvent extends Event {
  type:
    | EventType.NODE_CLICK
    | EventType.NODE_DOUBLE_CLICK
    | EventType.NODE_HOVER_START
    | EventType.NODE_HOVER_END
    | EventType.NODE_DRAG_START
    | EventType.NODE_DRAG
    | EventType.NODE_DRAG_END;
  node: INodeEntity;
  position: Position;
  originalEvent?: MouseEvent | TouchEvent;
}

/**
 * Edge event interface
 */
export interface EdgeEvent extends Event {
  type:
    | EventType.EDGE_CLICK
    | EventType.EDGE_DOUBLE_CLICK
    | EventType.EDGE_HOVER_START
    | EventType.EDGE_HOVER_END;
  edge: IEdgeEntity;
  position: Position;
  originalEvent?: MouseEvent | TouchEvent;
}

/**
 * Canvas event interface
 */
export interface CanvasEvent extends Event {
  type:
    | EventType.CANVAS_CLICK
    | EventType.CANVAS_DOUBLE_CLICK
    | EventType.CANVAS_DRAG_START
    | EventType.CANVAS_DRAG
    | EventType.CANVAS_DRAG_END
    | EventType.CANVAS_WHEEL;
  position: Position;
  delta?: Position;
  originalEvent?: MouseEvent | TouchEvent | WheelEvent;
}

/**
 * Selection event interface
 */
export interface SelectionEvent extends Event {
  type:
    | EventType.SELECTION_START
    | EventType.SELECTION_CHANGE
    | EventType.SELECTION_END;
  selectedNodeIds: number[];
  selectedEdgeIds: number[];
  bounds?: {
    min: Position;
    max: Position;
  };
}

/**
 * Graph event interface
 */
export interface GraphEvent extends Event {
  type:
    | EventType.GRAPH_UPDATE
    | EventType.LAYOUT_START
    | EventType.LAYOUT_STEP
    | EventType.LAYOUT_END;
  nodeCount?: number;
  edgeCount?: number;
  layoutName?: string;
  iteration?: number;
}

/**
 * Custom event interface
 */
export interface CustomEvent extends Event {
  type: EventType.CUSTOM;
  name: string;
  data?: Record<string, unknown>;
}

/**
 * Union type of all event interfaces
 */
export type GraphEvents =
  | NodeEvent
  | EdgeEvent
  | CanvasEvent
  | SelectionEvent
  | GraphEvent
  | CustomEvent;

/**
 * Event handler function type
 */
export type EventHandler<T extends Event = Event> = (event: T) => void;

/**
 * Event middleware function type
 */
export type EventMiddleware<T extends Event = Event> = (
  event: T,
  next: () => void
) => void;

/**
 * Event phase enum
 */
export enum EventPhase {
  CAPTURING = 1,
  AT_TARGET = 2,
  BUBBLING = 3,
}

/**
 * Event system for handling graph interactions
 *
 * Implements a middleware pattern for intercepting and modifying events
 * Supports event bubbling and capturing phases
 */
export class EventSystem {
  private handlers: Map<
    EventType,
    Array<{ handler: EventHandler; phase: EventPhase }>
  > = new Map();
  private middleware: Map<EventType, EventMiddleware[]> = new Map();

  constructor() {
    makeAutoObservable(this, {
      // These methods should not be observable
      dispatchEvent: false,
      // Private methods are automatically excluded
    });
  }

  /**
   * Add an event handler
   *
   * @param type The event type to listen for
   * @param handler The event handler function
   * @param phase The event phase to handle (default: EventPhase.AT_TARGET)
   * @returns A function to remove the handler
   */
  addEventListener<T extends Event>(
    type: EventType,
    handler: EventHandler<T>,
    phase: EventPhase = EventPhase.AT_TARGET
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    const handlers = this.handlers.get(type)!;
    const handlerObj = { handler: handler as EventHandler, phase };
    handlers.push(handlerObj);

    // Return a function to remove the handler
    return () => {
      const index = handlers.indexOf(handlerObj);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Remove an event handler
   *
   * @param type The event type
   * @param handler The event handler function to remove
   * @param phase The event phase (default: EventPhase.AT_TARGET)
   * @returns true if the handler was removed, false otherwise
   */
  removeEventListener<T extends Event>(
    type: EventType,
    handler: EventHandler<T>,
    phase: EventPhase = EventPhase.AT_TARGET
  ): boolean {
    if (!this.handlers.has(type)) {
      return false;
    }

    const handlers = this.handlers.get(type)!;
    const index = handlers.findIndex(
      (h) => h.handler === handler && h.phase === phase
    );

    if (index !== -1) {
      handlers.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Add middleware for an event type
   *
   * @param type The event type
   * @param middleware The middleware function
   * @returns A function to remove the middleware
   */
  addMiddleware<T extends Event>(
    type: EventType,
    middleware: EventMiddleware<T>
  ): () => void {
    if (!this.middleware.has(type)) {
      this.middleware.set(type, []);
    }

    const middlewares = this.middleware.get(type)!;
    const typedMiddleware = middleware as EventMiddleware;
    middlewares.push(typedMiddleware);

    // Return a function to remove the middleware
    return () => {
      const index = middlewares.indexOf(typedMiddleware);
      if (index !== -1) {
        middlewares.splice(index, 1);
      }
    };
  }

  /**
   * Remove middleware for an event type
   *
   * @param type The event type
   * @param middleware The middleware function to remove
   * @returns true if the middleware was removed, false otherwise
   */
  removeMiddleware<T extends Event>(
    type: EventType,
    middleware: EventMiddleware<T>
  ): boolean {
    if (!this.middleware.has(type)) {
      return false;
    }

    const middlewares = this.middleware.get(type)!;
    const index = middlewares.indexOf(middleware as EventMiddleware);

    if (index !== -1) {
      middlewares.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Dispatch an event
   *
   * @param event The event to dispatch
   * @returns true if the event was not prevented, false otherwise
   */
  dispatchEvent<T extends Event>(event: T): boolean {
    // Set default properties
    if (event.timestamp === undefined) {
      (event as Partial<Event>).timestamp = Date.now();
    }

    if (event.defaultPrevented === undefined) {
      (event as Partial<Event>).defaultPrevented = false;
    }

    if (event.propagationStopped === undefined) {
      (event as Partial<Event>).propagationStopped = false;
    }

    if (event.preventDefault === undefined) {
      (event as Partial<Event>).preventDefault = function (this: Event) {
        this.defaultPrevented = true;
      };
    }

    if (event.stopPropagation === undefined) {
      (event as Partial<Event>).stopPropagation = function (this: Event) {
        this.propagationStopped = true;
      };
    }

    // Apply middleware
    this.applyMiddleware(event, () => {
      // If propagation was stopped by middleware, don't call handlers
      if (event.propagationStopped) {
        return;
      }

      // Get handlers for this event type
      const handlers = this.handlers.get(event.type) || [];

      // Call capturing phase handlers
      handlers
        .filter((h) => h.phase === EventPhase.CAPTURING)
        .forEach((h) => {
          if (!event.propagationStopped) {
            h.handler(event);
          }
        });

      // Call at-target phase handlers
      if (!event.propagationStopped) {
        handlers
          .filter((h) => h.phase === EventPhase.AT_TARGET)
          .forEach((h) => {
            if (!event.propagationStopped) {
              h.handler(event);
            }
          });
      }

      // Call bubbling phase handlers
      if (!event.propagationStopped) {
        handlers
          .filter((h) => h.phase === EventPhase.BUBBLING)
          .forEach((h) => {
            if (!event.propagationStopped) {
              h.handler(event);
            }
          });
      }
    });

    return !event.defaultPrevented;
  }

  /**
   * Apply middleware to an event
   *
   * @param event The event
   * @param callback The callback to call after middleware
   */
  private applyMiddleware<T extends Event>(
    event: T,
    callback: () => void
  ): void {
    // Get middleware for this event type
    const middlewares = this.middleware.get(event.type) || [];

    if (middlewares.length === 0) {
      // No middleware, call the callback directly
      callback();
      return;
    }

    // Create a middleware chain
    let index = 0;

    const next = () => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        middleware(event, next);
      } else {
        callback();
      }
    };

    // Start the middleware chain
    next();
  }

  /**
   * Create a node event
   */
  createNodeEvent(
    type:
      | EventType.NODE_CLICK
      | EventType.NODE_DOUBLE_CLICK
      | EventType.NODE_HOVER_START
      | EventType.NODE_HOVER_END
      | EventType.NODE_DRAG_START
      | EventType.NODE_DRAG
      | EventType.NODE_DRAG_END,
    node: INodeEntity,
    position: Position,
    originalEvent?: MouseEvent | TouchEvent
  ): NodeEvent {
    return {
      type,
      node,
      position,
      originalEvent,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }

  /**
   * Create an edge event
   */
  createEdgeEvent(
    type:
      | EventType.EDGE_CLICK
      | EventType.EDGE_DOUBLE_CLICK
      | EventType.EDGE_HOVER_START
      | EventType.EDGE_HOVER_END,
    edge: IEdgeEntity,
    position: Position,
    originalEvent?: MouseEvent | TouchEvent
  ): EdgeEvent {
    return {
      type,
      edge,
      position,
      originalEvent,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }

  /**
   * Create a canvas event
   */
  createCanvasEvent(
    type:
      | EventType.CANVAS_CLICK
      | EventType.CANVAS_DOUBLE_CLICK
      | EventType.CANVAS_DRAG_START
      | EventType.CANVAS_DRAG
      | EventType.CANVAS_DRAG_END
      | EventType.CANVAS_WHEEL,
    position: Position,
    delta?: Position,
    originalEvent?: MouseEvent | TouchEvent | WheelEvent
  ): CanvasEvent {
    return {
      type,
      position,
      delta,
      originalEvent,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }

  /**
   * Create a selection event
   */
  createSelectionEvent(
    type:
      | EventType.SELECTION_START
      | EventType.SELECTION_CHANGE
      | EventType.SELECTION_END,
    selectedNodeIds: number[],
    selectedEdgeIds: number[],
    bounds?: {
      min: Position;
      max: Position;
    }
  ): SelectionEvent {
    return {
      type,
      selectedNodeIds,
      selectedEdgeIds,
      bounds,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }

  /**
   * Create a graph event
   */
  createGraphEvent(
    type:
      | EventType.GRAPH_UPDATE
      | EventType.LAYOUT_START
      | EventType.LAYOUT_STEP
      | EventType.LAYOUT_END,
    data?: {
      nodeCount?: number;
      edgeCount?: number;
      layoutName?: string;
      iteration?: number;
    }
  ): GraphEvent {
    return {
      type,
      ...data,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }

  /**
   * Create a custom event
   */
  createCustomEvent(name: string, data?: Record<string, unknown>): CustomEvent {
    return {
      type: EventType.CUSTOM,
      name,
      data,
      timestamp: Date.now(),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
  }
}

export default EventSystem;
