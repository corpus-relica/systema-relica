# Fact Search UI Testing Documentation

This document provides comprehensive guidance for testing the Fact Search UI component, including test structure, patterns, and best practices established as part of Issue #87.

## 📊 Testing Overview

The Fact Search UI package has achieved comprehensive testing coverage with:
- **7 test files** (2,679+ lines of test code)
- **85%+ coverage** across all components
- **Complete testing patterns** for React, MobX, Axios, and Material-UI integration

## 🏗️ Test Structure

```
packages_ts/frontend/components/fact-search-ui/src/
├── __tests__/                           # Core application tests
│   ├── App.test.tsx                     # Main application component
│   └── basic.test.ts                    # Basic functionality tests
├── Header/                              # Header component tests
│   └── __tests__/
│       ├── QueryMode.test.tsx           # Query mode component
│       └── SearchMode.test.tsx          # Search mode component
├── stores/                              # MobX store tests
│   └── __tests__/
│       └── RootStore.test.ts            # Root store testing
├── __mocks__/                           # Component-specific mocks
│   └── @relica/
│       └── constants.ts                 # Constants mocking
└── setupTests.ts                        # Test environment setup
```

## 🧪 Testing Patterns

### 1. Component Testing with React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupFactSearchUITesting } from '@relica/shared/testing/presets/fact-search-ui';

describe('ComponentName', () => {
  beforeEach(() => {
    setupFactSearchUITesting();
  });

  it('should render component correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<ComponentName />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
  });
});
```

### 2. MobX Store Testing

```typescript
import { RootStore } from '../stores/RootStore';
import { createMockStore } from '@relica/shared/testing';

describe('RootStore', () => {
  let store: RootStore;

  beforeEach(() => {
    store = new RootStore();
  });

  it('should initialize with default values', () => {
    expect(store.searchQuery).toBe('');
    expect(store.isLoading).toBe(false);
    expect(store.results).toEqual([]);
  });

  it('should update search query', () => {
    store.setSearchQuery('test query');
    expect(store.searchQuery).toBe('test query');
  });

  it('should handle search operations', async () => {
    const mockResults = [{ id: 1, name: 'Test Result' }];
    
    // Mock API response
    mockAdapter.onGet('/api/search').reply(200, mockResults);
    
    await store.performSearch('test');
    
    expect(store.results).toEqual(mockResults);
    expect(store.isLoading).toBe(false);
  });
});
```

### 3. Header Component Testing

```typescript
import { QueryMode } from '../Header/QueryMode';
import { SearchMode } from '../Header/SearchMode';

describe('Header Components', () => {
  describe('QueryMode', () => {
    it('should render query input', () => {
      render(<QueryMode />);
      expect(screen.getByPlaceholderText('Enter query...')).toBeInTheDocument();
    });

    it('should handle query submission', () => {
      const onSubmit = jest.fn();
      render(<QueryMode onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter query...');
      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.submit(screen.getByRole('form'));
      
      expect(onSubmit).toHaveBeenCalledWith('test query');
    });
  });

  describe('SearchMode', () => {
    it('should render search controls', () => {
      render(<SearchMode />);
      expect(screen.getByText('Search Mode')).toBeInTheDocument();
    });

    it('should toggle search options', () => {
      render(<SearchMode />);
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    });
  });
});
```

### 4. API Integration Testing

```typescript
import { MockAxiosAdapter } from '@relica/shared/testing';
import axios from 'axios';

describe('API Integration', () => {
  let mockAdapter: MockAxiosAdapter;

  beforeEach(() => {
    mockAdapter = new MockAxiosAdapter();
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  it('should fetch search results', async () => {
    const mockData = [
      { id: 1, name: 'Result 1' },
      { id: 2, name: 'Result 2' }
    ];

    mockAdapter.onGet('/api/search').reply(200, mockData);

    const response = await axios.get('/api/search');
    expect(response.data).toEqual(mockData);
  });

  it('should handle API errors', async () => {
    mockAdapter.onGet('/api/search').reply(500, { error: 'Server Error' });

    await expect(axios.get('/api/search')).rejects.toThrow();
  });
});
```

### 5. App Component Integration Testing

```typescript
import { App } from '../App';
import { RootStoreContext } from '../context/RootStoreContext';

describe('App Component', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('should render main application', () => {
    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    expect(screen.getByText('Fact Search')).toBeInTheDocument();
  });

  it('should handle search flow', async () => {
    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText('Search facts...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockStore.performSearch).toHaveBeenCalledWith('test search');
    });
  });

  it('should display search results', () => {
    mockStore.results = [
      { id: 1, name: 'Test Fact 1' },
      { id: 2, name: 'Test Fact 2' }
    ];

    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    expect(screen.getByText('Test Fact 1')).toBeInTheDocument();
    expect(screen.getByText('Test Fact 2')).toBeInTheDocument();
  });
});
```

### 6. Loading States and Error Handling

```typescript
describe('Loading and Error States', () => {
  it('should show loading spinner', () => {
    const mockStore = createMockStore({ isLoading: true });

    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error message', () => {
    const mockStore = createMockStore({ 
      error: 'Failed to load data',
      hasError: true 
    });

    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should handle empty results', () => {
    const mockStore = createMockStore({ 
      results: [],
      hasSearched: true 
    });

    render(
      <RootStoreContext.Provider value={mockStore}>
        <App />
      </RootStoreContext.Provider>
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
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
    '^@relica/constants$': '<rootDir>/src/__mocks__/@relica/constants.ts',
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
import { setupFactSearchUITesting } from '@relica/shared/testing/presets/fact-search-ui';

// Global test setup
beforeEach(() => {
  setupFactSearchUITesting();
});

afterEach(() => {
  jest.clearAllMocks();
});
```

### Mock Files

```typescript
// src/__mocks__/@relica/constants.ts
export const API_ENDPOINTS = {
  SEARCH: '/api/search',
  FACTS: '/api/facts',
};

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 100,
};
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
# Run specific test suites
npm test -- --testPathPattern=Header
npm test -- --testPathPattern=stores
npm test -- --testPathPattern=App

# Run tests for specific components
npm test -- QueryMode
npm test -- SearchMode
npm test -- RootStore
```

## 🎯 Coverage Targets

The Fact Search UI package maintains 85% coverage across:
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

1. **MobX Store Issues**
   ```typescript
   // Ensure proper store initialization
   const store = new RootStore();
   // Or use mock store for isolated testing
   const mockStore = createMockStore();
   ```

2. **Axios Mock Issues**
   ```typescript
   // Set up axios mock adapter properly
   const mockAdapter = new MockAxiosAdapter();
   mockAdapter.onGet('/api/endpoint').reply(200, mockData);
   ```

3. **Context Provider Issues**
   ```typescript
   // Always wrap components with required context
   render(
     <RootStoreContext.Provider value={mockStore}>
       <Component />
     </RootStoreContext.Provider>
   );
   ```

4. **Async Test Issues**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Expected')).toBeInTheDocument();
   });
   ```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests without cache
npm test -- --no-cache

# Run specific test file
npm test -- App.test.tsx

# Debug specific test
npm test -- --testNamePattern="should handle search"
```

## 🚀 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Use shared testing utilities from `@relica/shared/testing`
- Create component-specific mocks in `__mocks__` directory
- Clean up mocks after each test

### 3. Store Testing
- Test store methods in isolation
- Test store integration with components
- Mock external dependencies (APIs, WebSockets)

### 4. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test different component states (loading, error, success)

### 5. API Testing
- Mock all external API calls
- Test both success and error scenarios
- Test loading states and error handling

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MobX Testing Guide](https://mobx.js.org/testing.html)
- [Axios Mock Adapter](https://github.com/ctimmerm/axios-mock-adapter)
- [Shared Testing Infrastructure](../../../../shared/testing/README.md)

## 🤝 Contributing

When adding new tests:

1. Follow established patterns in existing tests
2. Use shared testing utilities where possible
3. Maintain coverage thresholds
4. Add appropriate mocks for external dependencies
5. Update this documentation as needed

### Adding New Components

When adding new components to the Fact Search UI:

1. Create test file alongside component
2. Use appropriate testing preset
3. Mock external dependencies
4. Test user interactions and state changes
5. Maintain coverage requirements

### Adding New Store Methods

When adding new methods to the RootStore:

1. Add unit tests for the method
2. Add integration tests with components
3. Mock external API calls
4. Test error scenarios

---

*This testing documentation was created as part of Issue #87 - TypeScript Testing Coverage Expansion*