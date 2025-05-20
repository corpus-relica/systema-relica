# Hooks Directory

This directory contains custom React hooks used throughout the 3D Graph UI. These hooks encapsulate reusable logic and provide a clean interface for components to interact with stores, services, and other functionality.

## Available Hooks

- **useStores.ts**: Hooks for accessing the MobX stores
  - `useRootStore()`: Access the root store
  - `useGraphDataStore()`: Access the graph data store
  - `useUIStateStore()`: Access the UI state store
  - `usePhysicsStore()`: Access the physics store
  - `useStores()`: Legacy hook for backward compatibility

- **useFrustumCulling.ts**: Hook for implementing view frustum culling
  - Optimizes rendering by only rendering nodes that are visible in the camera's view frustum
  - Significantly improves performance for large graphs

- **useLevelOfDetail.ts**: Hook for implementing level-of-detail rendering
  - Adjusts rendering detail based on distance from camera
  - Improves performance by reducing detail for distant objects

- **useSelectors.ts**: Hook for creating efficient selectors from MobX stores
  - Prevents unnecessary re-renders by memoizing selectors
  - Provides a clean interface for accessing store data

- **useMouseRaycast.ts**: Hook for handling mouse raycasting
  - Handles mouse interactions with 3D objects
  - Supports instanced meshes and node groups
  - Uses spatial indexing for efficient raycasting

## Usage Examples

### Store Access

```typescript
import { useGraphDataStore, useUIStateStore } from '../hooks/useStores';

function MyComponent() {
  const graphDataStore = useGraphDataStore();
  const uiStateStore = useUIStateStore();
  
  // Use store methods and properties
  const nodes = graphDataStore.allNodes;
  const selectedNode = uiStateStore.selectedNode;
  
  // ...
}
```

### Frustum Culling

```typescript
import useFrustumCulling from '../hooks/useFrustumCulling';

function NodesLayer() {
  const nodeMap = new Map<number, INodeEntity>();
  // ... populate nodeMap
  
  // Get visible node IDs using frustum culling
  const visibleNodeIds = useFrustumCulling(nodeMap);
  
  // Render only visible nodes
  return (
    <>
      {visibleNodeIds.map(id => (
        <Node key={id} id={id} />
      ))}
    </>
  );
}
```

### Mouse Raycasting

```typescript
import useMouseRaycast from '../hooks/useMouseRaycast';

function InteractiveScene() {
  // Handle intersection with 3D objects
  const handleIntersection = (intersection) => {
    if (intersection) {
      // Handle intersection
    } else {
      // Handle no intersection
    }
  };
  
  // Use the hook to handle mouse raycasting
  useMouseRaycast(handleIntersection);
  
  // ...
}
```

## Best Practices

- Keep hooks focused on a single responsibility
- Use TypeScript for proper typing
- Implement proper cleanup in useEffect to prevent memory leaks
- Use memoization to prevent unnecessary recalculations
- Document hook parameters and return values