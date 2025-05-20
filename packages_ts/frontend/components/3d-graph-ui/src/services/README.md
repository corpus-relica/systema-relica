# Services Directory

This directory contains service modules that handle external operations and complex functionality for the 3D Graph UI. Services are organized into subdirectories based on their domain.

## Directory Structure

- **physics/**: Services related to physics simulation
  - `PhysicsService.ts`: Manages communication with the physics simulation web worker
  - `physicsWorker.ts`: Web worker implementation for physics simulation

- **rendering/**: Services related to Three.js rendering
  - `MaterialService.ts`: Manages and reuses materials for efficient rendering

- **spatial/**: Services related to spatial operations
  - `SpatialIndexService.ts`: Provides spatial indexing for efficient spatial queries

- **layout/**: Services related to graph layout algorithms
  - (Future implementation of layout algorithms)

## Service Responsibilities

### Physics Services

The physics services handle the simulation of forces and movement in the 3D graph. The main components are:

- **PhysicsService**: Acts as a bridge between the main thread and the worker thread
  - Initializes the physics simulation
  - Sends commands to the worker (add/remove nodes, update config, etc.)
  - Receives position updates from the worker
  - Provides callbacks for position updates

- **physicsWorker**: Runs the actual physics simulation in a separate thread
  - Uses ngraph.forcelayout for force-directed layout
  - Handles node and edge physics
  - Calculates positions based on forces
  - Sends position updates back to the main thread

### Rendering Services

The rendering services handle the visual representation of the graph:

- **MaterialService**: Manages Three.js materials for efficient rendering
  - Implements material pooling and reuse
  - Provides materials for nodes, edges, and text
  - Supports different states (selected, hovered, etc.)
  - Implements level-of-detail materials for performance optimization

### Spatial Services

The spatial services handle spatial operations and queries:

- **SpatialIndexService**: Provides spatial indexing for efficient spatial queries
  - Implements octree and spatial hash grid data structures
  - Supports queries like finding nodes in a radius or region
  - Optimizes collision detection and raycasting
  - Provides methods for spatial operations

## Usage

Services are typically instantiated and used by stores:

```typescript
// Example: PhysicsStore using PhysicsService
class PhysicsStore {
  private physicsService: PhysicsService;

  constructor() {
    this.physicsService = new PhysicsService();
    this.initializePhysicsService();
  }

  // ...
}

// Example: MaterialService singleton usage
const material = MaterialService.getInstance().getNodeMaterial(color, isSelected, isHovered);
```

## Best Practices

- Services should be focused on a single responsibility
- Use dependency injection for service dependencies
- Implement proper error handling and recovery
- Use TypeScript interfaces for clear service contracts
- Consider using the singleton pattern for services that should have only one instance