# Utils Directory

This directory contains utility functions and helper classes used throughout the 3D Graph UI. These utilities provide common operations and functionality that can be reused across different parts of the application.

## Available Utilities

- **vector.ts**: Utility functions for vector operations
  - Vector calculations (distance, direction, etc.)
  - Vector transformations
  - Conversion between Position and THREE.Vector3
  - Vector math operations (add, subtract, multiply, etc.)

- **spatial.ts**: Utility functions for spatial calculations
  - Spatial queries (point in box, sphere intersects box, etc.)
  - Frustum calculations
  - Bounding box operations
  - Projection and unprojection between 3D and 2D

- **color.ts**: Utility functions for color operations
  - Color conversion (hex to RGB, RGB to hex, etc.)
  - Color manipulation (brighten, darken, etc.)
  - Color interpolation
  - Category-based color mapping

- **performance.ts**: Utility functions for performance monitoring and optimization
  - Performance timer for measuring execution time
  - Performance metrics collection
  - Throttling and debouncing functions
  - RequestAnimationFrame scheduling
  - Device capability detection

## Usage Examples

### Vector Operations

```typescript
import { distance, normalize, add } from '../utils/vector';

// Calculate distance between two positions
const dist = distance(positionA, positionB);

// Normalize a vector
const normalizedVector = normalize(vector);

// Add two vectors
const sumVector = add(vectorA, vectorB);
```

### Spatial Calculations

```typescript
import { isPointInBox, calculateBoundingBox } from '../utils/spatial';

// Check if a point is inside a box
const isInside = isPointInBox(point, boxMin, boxMax);

// Calculate bounding box for a set of positions
const { min, max } = calculateBoundingBox(positions);
```

### Color Operations

```typescript
import { hexToRgb, brightenColor, getNodeColorByCategory } from '../utils/color';

// Convert hex color to RGB
const rgb = hexToRgb('#ff0000');

// Brighten a color
const brightColor = brightenColor('#0000ff', 0.2);

// Get color based on node category
const nodeColor = getNodeColorByCategory('Physical Object');
```

### Performance Utilities

```typescript
import { PerformanceTimer, throttle, debounce } from '../utils/performance';

// Measure execution time
const timer = new PerformanceTimer('Operation');
timer.start();
// ... perform operation
timer.stop().log();

// Throttle a function
const throttledFunction = throttle(expensiveFunction, 100);

// Debounce a function
const debouncedFunction = debounce(expensiveFunction, 200);
```

## Best Practices

- Keep utility functions pure and side-effect free when possible
- Use TypeScript for proper typing
- Document function parameters and return values
- Implement proper error handling
- Write unit tests for utility functions
- Group related functions in the same file
- Use named exports for better tree-shaking