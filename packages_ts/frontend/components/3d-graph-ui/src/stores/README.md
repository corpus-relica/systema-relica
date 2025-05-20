# Stores Directory

This directory contains MobX stores that manage the state of the 3D Graph UI. The stores follow a modular architecture with a root store that composes all other stores.

## Store Structure

- **RootStore**: Composes all store modules and provides a unified interface for the application to interact with the state.
- **GraphDataStore**: Manages graph data entities (nodes and edges).
- **UIStateStore**: Manages UI-related state (selection, hover, viewport, filters).
- **PhysicsStore**: Manages the physics simulation for the graph.
- **SimulationStore**: Manages simulation parameters and state.

## Store Responsibilities

### RootStore
- Initializes and composes all store modules
- Provides access to all stores through a single entry point
- Coordinates interactions between stores

### GraphDataStore
- Manages node and edge entities
- Provides methods for adding, removing, and querying graph entities
- Handles spatial indexing for efficient spatial queries
- Manages node categories and colors

### UIStateStore
- Manages selection state (selected nodes and edges)
- Manages hover state (hovered nodes and edges)
- Manages viewport state (camera, zoom, etc.)
- Manages filter state (visibility filters)

### PhysicsStore
- Manages the physics simulation for the graph
- Handles node positions and forces
- Communicates with the PhysicsService for web worker operations
- Handles collision detection

### SimulationStore
- Manages simulation parameters
- Controls simulation state (running, paused, etc.)
- Handles simulation events

## Usage

Stores are accessed through React hooks:

```typescript
// Access the root store
const rootStore = useRootStore();

// Access specific stores
const graphDataStore = useGraphDataStore();
const uiStateStore = useUIStateStore();
const physicsStore = usePhysicsStore();

// Or use the legacy hook for backward compatibility
const { nodeData, hoveredNode } = useStores();
```

## Best Practices

- Use MobX actions for all state changes
- Implement computed values for derived data
- Keep stores focused on a single responsibility
- Use proper TypeScript typing throughout
- Avoid direct manipulation of store data from components