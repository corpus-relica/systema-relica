# Shared Testing Infrastructure

This directory contains shared testing utilities, mocks, and configurations for TypeScript packages in the systema-relica project. The infrastructure is designed to provide consistent testing patterns across frontend packages while reducing code duplication.

## Overview

The shared testing infrastructure provides:
- **Comprehensive Mocks**: WebSocket, Axios, Three.js, Material-UI, and MobX mocks
- **Test Fixtures**: Common test data generators and predefined datasets
- **Jest Configuration**: Package-specific Jest configurations with shared patterns
- **Setup Utilities**: Browser API mocks and Jest environment setup

## Directory Structure

```
packages_ts/shared/testing/
├── README.md                 # This documentation
├── index.ts                  # Main entry point
├── mocks/
│   ├── index.ts             # Mock exports
│   ├── websocket.ts         # WebSocket mocking utilities
│   ├── axios.ts             # HTTP request mocking
│   ├── three.ts             # Three.js and React Three Fiber mocks
│   ├── mui.ts               # Material-UI component mocks
│   └── mobx.ts              # MobX store testing utilities
├── fixtures/
│   └── index.ts             # Test data generators and datasets
├── setup/
│   └── jest.ts              # Jest environment setup
└── presets/
    ├── 3d-graph-ui.ts       # 3D graph component testing preset
    ├── fact-search-ui.ts    # Fact search component testing preset
    └── viewfinder.ts        # Viewfinder application testing preset
```

## Usage

### Basic Import

```typescript
import { 
  MockWebSocket, 
  MockAxiosAdapter, 
  mockThreeJS,
  mockMUI,
  createMockStore 
} from '@relica/shared/testing';
```

### Package-Specific Presets

Each target package has a specific testing preset that includes the most relevant mocks and utilities:

```typescript
// For 3d-graph-ui components
import { setup3DGraphUITesting } from '@relica/shared/testing/presets/3d-graph-ui';

// For fact-search-ui components  
import { setupFactSearchUITesting } from '@relica/shared/testing/presets/fact-search-ui';

// For viewfinder application
import { setupViewfinderTesting } from '@relica/shared/testing/presets/viewfinder';
```

## Mock Implementations

### WebSocket Mocking

The WebSocket mock provides a complete WebSocket API implementation for testing:

```typescript
import { MockWebSocket, setupWebSocketMock, cleanupWebSocketMock } from '@relica/shared/testing';

describe('WebSocket functionality', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    cleanupWebSocketMock();
  });

  it('should handle WebSocket connections', () => {
    const ws = new WebSocket('ws://localhost:8080');
    expect(ws).toBeInstanceOf(MockWebSocket);
    
    // Test connection events
    ws.onopen = jest.fn();
    ws.dispatchEvent(new Event('open'));
    expect(ws.onopen).toHaveBeenCalled();
  });
});
```

### HTTP Request Mocking

The Axios mock provides flexible HTTP request mocking:

```typescript
import { MockAxiosAdapter, createMockResponse, createMockError } from '@relica/shared/testing';

describe('API calls', () => {
  let mockAdapter: MockAxiosAdapter;

  beforeEach(() => {
    mockAdapter = new MockAxiosAdapter();
  });

  it('should mock successful API responses', async () => {
    const mockData = { id: 1, name: 'Test Entity' };
    mockAdapter.onGet('/api/entities/1').reply(200, mockData);

    const response = await axios.get('/api/entities/1');
    expect(response.data).toEqual(mockData);
  });

  it('should mock API errors', async () => {
    mockAdapter.onGet('/api/entities/1').reply(404, { error: 'Not found' });

    await expect(axios.get('/api/entities/1')).rejects.toThrow();
  });
});
```

### Three.js Mocking

Comprehensive Three.js mocking for 3D graphics testing:

```typescript
import { mockThreeJS } from '@relica/shared/testing';

describe('3D Graphics', () => {
  beforeEach(() => {
    mockThreeJS();
  });

  it('should create Three.js objects', () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    
    scene.add(cube);
    expect(scene.children).toContain(cube);
  });
});
```

### Material-UI Mocking

Material-UI component mocking for UI testing:

```typescript
import { mockMUI } from '@relica/shared/testing';

describe('Material-UI Components', () => {
  beforeEach(() => {
    mockMUI();
  });

  it('should render MUI components', () => {
    render(<Button variant="contained">Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
});
```

### MobX Store Mocking

MobX store testing utilities:

```typescript
import { createMockStore, MockRootStore } from '@relica/shared/testing';

describe('MobX Stores', () => {
  let mockStore: MockRootStore;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('should provide mock store functionality', () => {
    expect(mockStore.dataStore).toBeDefined();
    expect(mockStore.uiStore).toBeDefined();
    expect(mockStore.cacheStore).toBeDefined();
  });
});
```

## Test Fixtures

The fixtures module provides common test data generators:

```typescript
import { 
  createMockEntity, 
  createMockUser, 
  createMockRelation,
  createMockFact,
  createMockAPIResponse 
} from '@relica/shared/testing/fixtures';

describe('Data Processing', () => {
  it('should process entities', () => {
    const entity = createMockEntity({ name: 'Test Entity' });
    expect(entity.name).toBe('Test Entity');
    expect(entity.id).toBeDefined();
  });

  it('should handle API responses', () => {
    const response = createMockAPIResponse({
      data: [createMockEntity(), createMockEntity()],
      total: 2
    });
    expect(response.data).toHaveLength(2);
  });
});
```

## Jest Configuration

Each package has its own Jest configuration that extends the shared patterns:

### 3d-graph-ui Configuration

```javascript
// packages_ts/frontend/components/3d-graph-ui/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@relica/shared/testing$': '<rootDir>/../../shared/testing/index.ts',
    // ... other mappings
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

## Package Scripts

Each package includes the following test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Best Practices

### 1. Use Package-Specific Presets

Always use the appropriate preset for your package to ensure you have the right mocks and utilities:

```typescript
// In 3d-graph-ui tests
import { setup3DGraphUITesting } from '@relica/shared/testing/presets/3d-graph-ui';

describe('3D Graph Component', () => {
  beforeEach(() => {
    setup3DGraphUITesting();
  });
  // ... tests
});
```

### 2. Clean Up After Tests

Always clean up mocks and global state after tests:

```typescript
import { cleanupWebSocketMock, cleanupThreeJSMock } from '@relica/shared/testing';

afterEach(() => {
  cleanupWebSocketMock();
  cleanupThreeJSMock();
  jest.clearAllMocks();
});
```

### 3. Use Fixtures for Consistent Test Data

Use the provided fixtures instead of creating test data inline:

```typescript
import { createMockEntity, createMockRelation } from '@relica/shared/testing/fixtures';

// Good
const entity = createMockEntity({ name: 'Test Entity' });

// Avoid
const entity = { id: '123', name: 'Test Entity', type: 'entity' };
```

### 4. Mock External Dependencies

Always mock external dependencies to ensure tests are isolated:

```typescript
// Mock WebSocket connections
setupWebSocketMock();

// Mock HTTP requests
const mockAdapter = new MockAxiosAdapter();
mockAdapter.onGet('/api/data').reply(200, mockData);
```

## Coverage Targets

All packages are configured with 85% coverage thresholds:
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%
- **Statements**: 85%

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**: Ensure Jest configuration includes correct `moduleNameMapping` for shared testing utilities.

2. **WebSocket Mock Not Working**: Make sure to call `setupWebSocketMock()` before creating WebSocket instances.

3. **Three.js Errors**: Call `mockThreeJS()` before importing or using Three.js components.

4. **MUI Component Errors**: Ensure `mockMUI()` is called before rendering Material-UI components.

### Debug Tips

1. Use `jest --verbose` to see detailed test output
2. Use `jest --no-cache` to clear Jest cache if experiencing module resolution issues
3. Check that all required mocks are set up in `setupTests.ts` files

## Contributing

When adding new mocks or utilities:

1. Add the implementation to the appropriate file in `mocks/` or `fixtures/`
2. Export it from the main `index.ts` file
3. Update the relevant preset files if needed
4. Add documentation and examples to this README
5. Write tests for the new functionality

## Migration from Package-Specific Tests

If migrating existing tests to use the shared infrastructure:

1. Replace package-specific mocks with shared equivalents
2. Update imports to use `@relica/shared/testing`
3. Use the appropriate preset for your package type
4. Update Jest configuration to use shared patterns
5. Remove duplicate mock implementations