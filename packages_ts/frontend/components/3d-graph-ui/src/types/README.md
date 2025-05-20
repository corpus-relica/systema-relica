# Types Directory

This directory contains TypeScript type definitions used throughout the 3D Graph UI. Centralizing type definitions in this directory ensures consistency across the application and makes it easier to maintain and update types.

## Type Files

- **models.ts**: Core data model type definitions
  - `INodeEntity`: Interface for node entities
  - `IEdgeEntity`: Interface for edge entities
  - `ISimulationConfig`: Interface for physics simulation configuration
  - Factory functions for creating entities

- **three-types.ts**: Three.js related type definitions
  - `ThreeIntersection`: Extended intersection type for Three.js raycasting
  - Other Three.js specific type extensions

- **index.d.ts**: Global type declarations
  - Module declarations
  - Global interface extensions

## Usage Examples

### Using Node and Edge Types

```typescript
import { INodeEntity, IEdgeEntity, createNodeEntity, createEdgeEntity } from '../types/models';

// Create a new node entity
const node: INodeEntity = createNodeEntity({
  id: 1,
  name: 'Node 1',
  pos: { x: 0, y: 0, z: 0 }
});

// Create a new edge entity
const edge: IEdgeEntity = createEdgeEntity({
  id: 1,
  source: 1,
  target: 2,
  type: 1,
  label: 'connects to'
});
```

### Using Simulation Config Types

```typescript
import { ISimulationConfig, DEFAULT_SIMULATION_CONFIG } from '../types/models';

// Create a custom simulation configuration
const customConfig: ISimulationConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  timeStep: 0.5,
  springLength: 15
};
```

### Using Three.js Types

```typescript
import { ThreeIntersection } from '../types/three-types';

// Handle intersection with 3D objects
const handleIntersection = (intersection: ThreeIntersection | null) => {
  if (intersection) {
    const nodeId = intersection.object.userData.uid;
    // Handle node intersection
  }
};
```

## Type Hierarchy

```
Position
├── x: number
├── y: number
└── z: number

INodeEntity
├── id: number
├── name: string
├── val: number
└── pos?: Position

IEdgeEntity
├── id: number
├── source: number
├── target: number
├── type: number
├── label: string
├── sourcePos?: Position
└── targetPos?: Position

ISimulationConfig
├── timeStep: number
├── dimensions: number
├── gravity: number
├── theta: number
├── springLength: number
├── springCoefficient: number
└── dragCoefficient: number
```

## Best Practices

- Use interfaces for object types
- Use type aliases for union types and complex types
- Use const assertions for literal types
- Document all type definitions
- Keep types focused and specific
- Use generics for reusable type patterns
- Export all types that are used across multiple files
- Use factory functions to ensure consistent entity creation