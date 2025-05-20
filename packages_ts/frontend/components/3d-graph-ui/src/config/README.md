# Config Directory

This directory contains configuration constants and settings used throughout the 3D Graph UI. Centralizing configuration in this directory makes it easier to adjust the behavior and appearance of the graph visualization without modifying the core code.

## Configuration Files

- **constants.ts**: Core configuration constants
  - Physics simulation parameters
  - Spatial indexing settings
  - Rendering constants
  - Animation settings
  - Default values for various components

- **colors.ts**: Color-related constants
  - Text colors
  - Highlight colors
  - Default colors

## Usage Examples

### Using Physics Constants

```typescript
import { PHYSICS_CONSTANTS } from '../config/constants';

// Use collision radius in physics calculations
const radius = PHYSICS_CONSTANTS.COLLISION_RADIUS;

// Use bounding sphere radius
const boundingSphereRadius = PHYSICS_CONSTANTS.BOUNDING_SPHERE_RADIUS;
```

### Using Simulation Configuration

```typescript
import { DEFAULT_SIMULATION_CONFIG } from '../config/constants';

// Initialize physics simulation with default config
const layout = createLayout(graph, DEFAULT_SIMULATION_CONFIG);

// Override specific settings
const customConfig = {
  ...DEFAULT_SIMULATION_CONFIG,
  springLength: 15,
  gravity: -8,
};
```

### Using Rendering Constants

```typescript
import { RENDERING_CONSTANTS } from '../config/constants';

// Set node size
const nodeSize = RENDERING_CONSTANTS.DEFAULT_NODE_SIZE;

// Set edge thickness
const edgeThickness = RENDERING_CONSTANTS.DEFAULT_EDGE_THICKNESS;

// Use opacity values
const hoverOpacity = RENDERING_CONSTANTS.HOVER_OPACITY;
```

### Using Color Constants

```typescript
import { CATEGORY_COLORS } from '../config/constants';
import { TEXT_COLORS } from '../config/colors';

// Get color for a specific category
const physicalObjectColor = CATEGORY_COLORS.PHYSICAL_OBJECT;

// Use text colors
const highlightTextColor = TEXT_COLORS.HIGHLIGHT;
```

## Best Practices

- Keep configuration values centralized in this directory
- Use meaningful constant names
- Group related constants together
- Document the purpose and units of each constant
- Use TypeScript for proper typing
- Consider using environment-specific configurations for different deployment environments
- Avoid hardcoding values in components or services