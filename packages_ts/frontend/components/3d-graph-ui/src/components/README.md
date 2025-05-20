# Components Directory

This directory contains all the React components used in the 3D Graph UI. The components are organized into subdirectories based on their functionality:

## Directory Structure

- **Graph/**: Contains the main graph components that handle the overall structure and rendering of the graph
  - `GraphContainer.tsx`: Manages the layout and dimensions of the graph
  - `GraphCanvas.tsx`: Handles the Three.js canvas setup
  - `GraphScene.tsx`: Manages the 3D scene

- **Node/**: Contains components related to node rendering and behavior
  - `Node.tsx`: Individual node component
  - `NodesLayer.tsx`: Manages the rendering of all nodes
  - `InstancedNodes.tsx`: Optimized node rendering using instanced meshes

- **Edge/**: Contains components related to edge rendering and behavior
  - `Edge.tsx`: Individual edge component
  - `EdgesLayer.tsx`: Manages the rendering of all edges
  - `UnaryEdge.tsx`: Special edge component for self-referential edges

- **Controls/**: Contains UI control components
  - `GraphControls.tsx`: UI controls for interacting with the graph

## Component Hierarchy

```
3DGraphUI
└── GraphContainer
    ├── GraphCanvas
    │   └── GraphScene
    │       ├── NodesLayer
    │       │   └── Node (multiple)
    │       └── EdgesLayer
    │           ├── Edge (multiple)
    │           └── UnaryEdge (multiple)
    └── GraphControls
```

## Best Practices

- Components should be focused on rendering and user interaction
- Business logic should be delegated to stores and services
- Use MobX for state management and React hooks for accessing stores
- Implement proper memoization to prevent unnecessary re-renders