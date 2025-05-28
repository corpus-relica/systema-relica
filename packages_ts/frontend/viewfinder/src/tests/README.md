# Cache Rebuild UI Tests

This directory contains comprehensive tests for the Cache Rebuild UI feature in the Viewfinder application.

## Running the Tests

### Using Yarn Workspaces (Recommended)

From the **root directory** of the project:

```bash
# Install all dependencies
yarn install

# Run all tests in the viewfinder workspace
yarn workspace @relica/viewfinder test

# Run tests in watch mode
yarn workspace @relica/viewfinder test:watch

# Run tests with coverage
yarn workspace @relica/viewfinder test:coverage

# Run only cache-related tests
yarn workspace @relica/viewfinder test:cache
```

### From the Viewfinder Directory

If you're already in the `packages_ts/frontend/viewfinder` directory:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run only cache-related tests
yarn test:cache
```

### Running All Tests Across the Project

From the root directory:

```bash
# Run tests in all workspaces
yarn test

# Run tests in watch mode for all workspaces
yarn test:watch
```

## Test Structure

```
src/tests/
├── setup/
│   ├── websocketMock.ts       # WebSocket mocking utilities
│   ├── cacheMockData.ts       # Mock data for cache rebuild scenarios
│   └── jest.setup.ts          # Jest configuration and global mocks
├── helpers/
│   └── cacheTestHelpers.ts    # Common test utilities
├── integration/
│   └── CacheRebuild.test.tsx  # End-to-end integration tests
└── mocks/
    └── fileMock.js            # Mock for static file imports
```

Component tests are located alongside their components:
```
src/components/Settings/CacheManagement/__tests__/
├── CacheManagementSection.test.tsx
├── RebuildButton.test.tsx
├── ProgressIndicator.test.tsx
├── StatusMessages.test.tsx
├── CacheTypeSelect.test.tsx
└── hooks/
    └── useCacheRebuild.test.ts
```

## Test Coverage

The tests cover:

- **Unit Tests**: Individual component behavior and rendering
- **Hook Tests**: Custom React hook logic and WebSocket handling
- **Integration Tests**: Complete user flows and component interactions
- **WebSocket Communication**: Message sending/receiving and event handling
- **Error Scenarios**: Network failures, authorization errors, disconnections
- **Accessibility**: ARIA attributes and keyboard navigation

## Debugging Tests

To debug a specific test:

```bash
# Run a specific test file
yarn test CacheManagementSection.test.tsx

# Run tests matching a pattern
yarn test --testNamePattern="handles cache rebuild errors"

# Run tests with verbose output
yarn test --verbose

# Debug in VS Code
# Add breakpoints in your test files and use the Jest extension
```

## Writing New Tests

When adding new tests:

1. Use the existing mock utilities in `tests/setup/` and `tests/helpers/`
2. Follow the naming convention: `ComponentName.test.tsx`
3. Include both positive and negative test cases
4. Add snapshot tests for UI components
5. Mock external dependencies (WebSocket, API calls)
6. Test accessibility features

Example test structure:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { setupMockWebSocket, cleanupMockWebSocket } from '../tests/helpers/cacheTestHelpers';

describe('ComponentName', () => {
  let mockWs;

  beforeEach(() => {
    mockWs = setupMockWebSocket();
  });

  afterEach(() => {
    cleanupMockWebSocket();
  });

  it('should handle user interaction', () => {
    render(<Component />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(/* assertion */).toBe(/* expected */);
  });
});
```

## Troubleshooting

If you encounter issues:

1. **Dependencies not found**: Run `yarn install` from the root directory
2. **Module resolution errors**: These can be ignored as per project configuration
3. **WebSocket errors**: Ensure the mock is properly initialized in your test
4. **Snapshot failures**: Update snapshots with `yarn test -u` if changes are intentional

## Continuous Integration

These tests are designed to run in CI environments. Ensure all tests pass before submitting PRs:

```bash
# Run all checks
yarn test:coverage
yarn lint
yarn type-check