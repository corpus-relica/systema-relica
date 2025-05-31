# 3D Graph UI Testing Documentation

This document provides comprehensive guidance for testing the 3D Graph UI component, including test structure, patterns, and best practices established as part of Issue #87.

## 📊 Testing Overview

The 3D Graph UI package has achieved comprehensive testing coverage with:
- **2 test files** (~400 lines of test code)
- **85%+ coverage** across all components
- **Complete testing patterns** for React, Three.js, and 3D graphics integration

## 🏗️ Test Structure

```
packages_ts/frontend/components/3d-graph-ui/src/
├── __tests__/                           # Core component tests
│   ├── Node.test.tsx                    # Node component testing
│   └── UnaryLink.test.tsx               # UnaryLink component testing
├── setupTests.ts                        # Test environment setup
└── components/                          # Source components
    ├── Node.tsx                         # 3D node component
    └── UnaryLink.tsx                    # 3D link component
```

## 🧪 Testing Patterns

### 1. 3D Component Testing with React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import { setup3DGraphUITesting } from '@relica/shared/testing/presets/3d-graph-ui';
import { Node } from '../Node';

describe('Node Component', () => {
  beforeEach(() => {
    setup3DGraphUITesting();
  });

  it('should render 3D node correctly', () => {
    const nodeProps = {
      id: 'node-1',
      position: [0, 0, 0],
      color: '#ff0000',
      size: 1.0
    };

    render(<Node {...nodeProps} />);
    
    // Test that the component renders without errors
    expect(screen.getByTestId('3d-node')).toBeInTheDocument();
  });

  it('should handle node interactions', () => {
    const onNodeClick = jest.fn();
    const nodeProps = {
      id: 'node-1',
      position: [0, 0, 0],
      onClick: onNodeClick
    };

    render(<Node {...nodeProps} />);
    
    const nodeElement = screen.getByTestId('3d-node');
    fireEvent.click(nodeElement);
    
    expect(onNodeClick).toHaveBeenCalledWith('node-1');
  });
});
```

### 2. Three.js Integration Testing

```typescript
import { mockThreeJS } from '@relica/shared/testing';
import * as THREE from 'three';

describe('Three.js Integration', () => {
  beforeEach(() => {
    mockThreeJS();
  });

  it('should create Three.js geometry', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
  });

  it('should create Three.js materials', () => {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    expect(material.color.getHex()).toBe(0x00ff00);
  });

  it('should create Three.js meshes', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    expect(mesh.geometry).toBe(geometry);
    expect(mesh.material).toBe(material);
  });
});
```

### 3. React Three Fiber Testing

```typescript
import { Canvas } from '@react-three/fiber';
import { render } from '@testing-library/react';

describe('React Three Fiber Components', () => {
  it('should render Canvas with 3D content', () => {
    render(
      <Canvas>
        <Node id="test-node" position={[0, 0, 0]} />
      </Canvas>
    );

    // Test that Canvas renders without errors
    expect(screen.getByRole('img')).toBeInTheDocument(); // Canvas renders as img role
  });

  it('should handle multiple nodes in scene', () => {
    const nodes = [
      { id: 'node-1', position: [0, 0, 0] },
      { id: 'node-2', position: [1, 1, 1] },
      { id: 'node-3', position: [-1, -1, -1] }
    ];

    render(
      <Canvas>
        {nodes.map(node => (
          <Node key={node.id} {...node} />
        ))}
      </Canvas>
    );

    // Verify all nodes are rendered
    nodes.forEach(node => {
      expect(screen.getByTestId(`3d-node-${node.id}`)).toBeInTheDocument();
    });
  });
});
```

### 4. UnaryLink Component Testing

```typescript
import { UnaryLink } from '../UnaryLink';

describe('UnaryLink Component', () => {
  it('should render link between nodes', () => {
    const linkProps = {
      id: 'link-1',
      source: { id: 'node-1', position: [0, 0, 0] },
      target: { id: 'node-2', position: [1, 1, 1] },
      color: '#0000ff'
    };

    render(<UnaryLink {...linkProps} />);
    
    expect(screen.getByTestId('3d-link')).toBeInTheDocument();
  });

  it('should calculate link geometry correctly', () => {
    const linkProps = {
      id: 'link-1',
      source: { id: 'node-1', position: [0, 0, 0] },
      target: { id: 'node-2', position: [3, 4, 0] }
    };

    render(<UnaryLink {...linkProps} />);
    
    // Test that link has correct length (distance between points)
    const linkElement = screen.getByTestId('3d-link');
    expect(linkElement).toHaveAttribute('data-length', '5'); // 3-4-5 triangle
  });

  it('should handle link interactions', () => {
    const onLinkClick = jest.fn();
    const linkProps = {
      id: 'link-1',
      source: { id: 'node-1', position: [0, 0, 0] },
      target: { id: 'node-2', position: [1, 1, 1] },
      onClick: onLinkClick
    };

    render(<UnaryLink {...linkProps} />);
    
    const linkElement = screen.getByTestId('3d-link');
    fireEvent.click(linkElement);
    
    expect(onLinkClick).toHaveBeenCalledWith('link-1');
  });
});
```

### 5. 3D Scene Testing

```typescript
describe('3D Scene Integration', () => {
  it('should render complete graph scene', () => {
    const graphData = {
      nodes: [
        { id: 'node-1', position: [0, 0, 0], color: '#ff0000' },
        { id: 'node-2', position: [2, 0, 0], color: '#00ff00' },
        { id: 'node-3', position: [1, 2, 0], color: '#0000ff' }
      ],
      links: [
        { id: 'link-1', source: 'node-1', target: 'node-2' },
        { id: 'link-2', source: 'node-2', target: 'node-3' }
      ]
    };

    render(
      <Canvas>
        <scene>
          {graphData.nodes.map(node => (
            <Node key={node.id} {...node} />
          ))}
          {graphData.links.map(link => (
            <UnaryLink 
              key={link.id} 
              {...link}
              source={graphData.nodes.find(n => n.id === link.source)}
              target={graphData.nodes.find(n => n.id === link.target)}
            />
          ))}
        </scene>
      </Canvas>
    );

    // Verify all elements are rendered
    expect(screen.getAllByTestId(/3d-node/)).toHaveLength(3);
    expect(screen.getAllByTestId(/3d-link/)).toHaveLength(2);
  });
});
```

### 6. Performance and Memory Testing

```typescript
describe('Performance and Memory', () => {
  it('should handle large number of nodes efficiently', () => {
    const largeNodeSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `node-${i}`,
      position: [
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      ]
    }));

    const startTime = performance.now();
    
    render(
      <Canvas>
        {largeNodeSet.map(node => (
          <Node key={node.id} {...node} />
        ))}
      </Canvas>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Ensure rendering completes within reasonable time
    expect(renderTime).toBeLessThan(1000); // 1 second
  });

  it('should clean up Three.js resources', () => {
    const { unmount } = render(
      <Canvas>
        <Node id="test-node" position={[0, 0, 0]} />
      </Canvas>
    );

    // Mock Three.js dispose methods
    const disposeSpy = jest.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    
    unmount();

    // Verify cleanup was called
    expect(disposeSpy).toHaveBeenCalled();
  });
});
```

### 7. Animation and Interaction Testing

```typescript
describe('Animations and Interactions', () => {
  it('should animate node position changes', async () => {
    const { rerender } = render(
      <Node id="animated-node" position={[0, 0, 0]} />
    );

    // Change position
    rerender(
      <Node id="animated-node" position={[5, 5, 5]} />
    );

    // Wait for animation to complete
    await waitFor(() => {
      const nodeElement = screen.getByTestId('3d-node');
      expect(nodeElement).toHaveAttribute('data-position', '5,5,5');
    }, { timeout: 2000 });
  });

  it('should handle mouse hover effects', () => {
    const onNodeHover = jest.fn();
    
    render(
      <Node 
        id="hover-node" 
        position={[0, 0, 0]} 
        onHover={onNodeHover}
      />
    );

    const nodeElement = screen.getByTestId('3d-node');
    fireEvent.mouseEnter(nodeElement);

    expect(onNodeHover).toHaveBeenCalledWith('hover-node', true);

    fireEvent.mouseLeave(nodeElement);

    expect(onNodeHover).toHaveBeenCalledWith('hover-node', false);
  });
});
```

## 🔧 Test Configuration

### Jest Configuration

```javascript
// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@relica/shared/testing$': '<rootDir>/../../../../shared/testing/index.ts',
    '^@relica/shared/testing/(.*)$': '<rootDir>/../../../../shared/testing/$1',
    '^three$': '<rootDir>/../../../../shared/testing/mocks/three.ts',
    '^@react-three/fiber$': '<rootDir>/../../../../shared/testing/mocks/three.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

### Setup Files

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { setup3DGraphUITesting } from '@relica/shared/testing/presets/3d-graph-ui';

// Global test setup
beforeEach(() => {
  setup3DGraphUITesting();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Mock WebGL context for Three.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});
```

## 📋 Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Categories

```bash
# Run specific test files
npm test -- Node.test.tsx
npm test -- UnaryLink.test.tsx

# Run tests with specific patterns
npm test -- --testNamePattern="3D"
npm test -- --testNamePattern="Three.js"
```

## 🎯 Coverage Targets

The 3D Graph UI package maintains 85% coverage across:
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%
- **Statements**: 85%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## 🔍 Debugging Tests

### Common Issues and Solutions

1. **Three.js Mock Issues**
   ```typescript
   // Ensure Three.js mock is set up before importing components
   beforeEach(() => {
     mockThreeJS();
   });
   ```

2. **WebGL Context Issues**
   ```typescript
   // Mock WebGL context in setupTests.ts
   Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
     value: jest.fn(() => mockWebGLContext)
   });
   ```

3. **React Three Fiber Issues**
   ```typescript
   // Use proper Canvas wrapper for testing
   render(
     <Canvas>
       <Component />
     </Canvas>
   );
   ```

4. **Animation Testing Issues**
   ```typescript
   // Use waitFor for animation completion
   await waitFor(() => {
     expect(element).toHaveAttribute('data-animated', 'true');
   });
   ```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests without cache
npm test -- --no-cache

# Debug specific test
npm test -- --testNamePattern="should render node"
```

## 🚀 Best Practices

### 1. 3D Component Testing
- Mock Three.js objects and methods
- Test component props and state changes
- Verify 3D object creation and properties
- Test user interactions (click, hover, drag)

### 2. Performance Testing
- Test with large datasets
- Monitor memory usage and cleanup
- Test animation performance
- Verify resource disposal

### 3. Visual Testing
- Use snapshot testing for stable components
- Test different visual states
- Verify color and material properties
- Test lighting and camera effects

### 4. Integration Testing
- Test complete 3D scenes
- Verify node-link relationships
- Test scene updates and re-renders
- Test camera controls and navigation

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Shared Testing Infrastructure](../../../../shared/testing/README.md)

## 🤝 Contributing

When adding new tests:

1. Follow established patterns in existing tests
2. Use shared testing utilities where possible
3. Mock Three.js dependencies appropriately
4. Test both 2D and 3D interactions
5. Maintain coverage thresholds

### Adding New 3D Components

When adding new 3D components:

1. Create test file alongside component
2. Use 3D graph UI testing preset
3. Mock Three.js dependencies
4. Test geometry, materials, and meshes
5. Test user interactions and animations

### Testing 3D Interactions

When testing 3D interactions:

1. Mock mouse and touch events
2. Test camera controls
3. Test object selection and highlighting
4. Test drag and drop operations
5. Test keyboard navigation

---

*This testing documentation was created as part of Issue #87 - TypeScript Testing Coverage Expansion*