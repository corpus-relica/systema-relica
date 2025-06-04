# Common Package Testing Documentation

This document describes the testing utilities and patterns established for cross-language client testing in the common package.

## Overview

The common package test suite provides comprehensive coverage for cross-language communication between Clojure, Python, and TypeScript services. All tests follow consistent patterns and utilize shared testing utilities.

## Test Structure

### Client Tests (`io.relica.common.io.*_client_test.clj`)

Each client test follows a standardized pattern covering:

- **Message Identifiers**: Verifies standardized message types across services
- **Error Handling**: Tests graceful handling of various error conditions
- **Cross-Language Compatibility**: Ensures message formats work with Python/TypeScript
- **Connection Management**: Tests automatic connection and reconnection logic
- **Timeout Handling**: Verifies proper timeout behavior
- **Heartbeat Mechanisms**: Tests periodic heartbeat functionality

#### Available Client Tests:
- `aperture_client_test.clj` - Cross-service environment and entity operations
- `archivist_client_test.clj` - Graph database query and fact management
- `clarity_client_test.clj` - Model retrieval and visualization data
- `nous_client_test.clj` - Python LangChain agent communication
- `prism_client_test.clj` - Setup and cache management operations

### Utility Tests

#### Response Utilities (`utils/response_test.clj`)
Comprehensive tests for response format utilities including:
- Success/error response generation
- Cross-language serialization compatibility
- Error code mapping
- Metadata handling
- Data type preservation

#### WebSocket Format Tests (`websocket/format_test.clj`)
Tests for message serialization/deserialization:
- EDN format (Clojure-specific)
- JSON format (cross-language)
- Nippy format (performance)
- Format selection based on client type
- Cross-format compatibility

#### Cache Service Tests (`services/cache_service_test.clj`)
Cache operations and Redis integration:
- Entity facts caching
- Lineage tracking
- Descendants management
- Concurrent access patterns
- Error handling

### Contract Tests (`contract_test.clj`)

Cross-language compatibility contracts ensuring:
- Message format consistency across services
- API response format standardization
- Data type preservation in serialization
- Error format compatibility
- Service-specific message contracts

## Testing Patterns

### Mock WebSocket Client Pattern

All client tests use a consistent mock WebSocket client pattern:

```clojure
(let [captured-messages (atom [])
      mock-ws-client (reify ws/WebSocketClientProtocol
                       (connect! [_] true)
                       (disconnect! [_] true)
                       (connected? [_] true)
                       (register-handler! [_ _ _] nil)
                       (unregister-handler! [_ _] nil)
                       (send-message! [_ type payload timeout-ms]
                         (swap! captured-messages conj {:type type
                                                        :payload payload})
                         (go {:success true})))]
  ;; Test implementation
  )
```

### Error Testing Pattern

Error conditions are tested using case statements in mock responses:

```clojure
(send-message! [_ type payload timeout-ms]
  (go (case type
        :service.operation/action
        {:success false
         :error {:code "ERROR_CODE"
                 :message "Error description"}}
        {:success false
         :error {:code "UNKNOWN_ERROR"}})))
```

### Cross-Language Testing Pattern

Cross-language compatibility is verified by:
1. Testing message serialization to JSON
2. Simulating responses from other language services
3. Verifying snake_case/camelCase handling
4. Testing data type preservation

## Test Utilities

### Shared Test Helpers (`test_helpers.clj`)

Provides common utilities for all tests including mock setup and assertion helpers.

### Test Runner (`test/runner.clj`)

Simple test runner for executing the full test suite.

## Running Tests

### Full Test Suite
```bash
cd packages_clj/common
clj -M:test
```

### Individual Test Files
```bash
clj -M:midje -e "(require :reload 'test-namespace) (midje.repl/load-facts 'test-file-path')"
```

### Specific Test Functions
```bash
clj -M:test -v specific.namespace/test-function
```

## Coverage Requirements

Tests should achieve 85%+ coverage across:
- All client implementations
- Cross-language serialization paths
- Error handling scenarios
- Connection management logic
- Response format utilities

## Best Practices

### 1. Consistent Naming
- Test namespaces: `io.relica.common.*-test`
- Fact groups: `"About [component] [functionality]"`
- Individual facts: Use descriptive present-tense descriptions

### 2. Mock Data
- Use realistic entity UIDs and names
- Include representative metadata
- Test edge cases (empty arrays, nil values, large datasets)

### 3. Async Testing
- Use core.async channels consistently
- Test timeout behavior
- Verify response timing where relevant

### 4. Cross-Language Compatibility
- Always test JSON serialization paths
- Verify snake_case/kebab-case handling
- Include metadata that other services expect

### 5. Error Scenarios
- Test all major error types
- Verify error message format consistency
- Include stack trace handling for Python services

## Dependencies

### Required Dependencies
- `midje/midje` - Testing framework
- `org.clojure/core.async` - Async operations
- `cheshire/cheshire` - JSON handling
- `com.taoensso/nippy` - Binary serialization

### Optional Dependencies
- `org.clojure/tools.namespace` - Namespace reloading
- Test-specific mocking libraries as needed

## Future Enhancements

Potential areas for expansion:
- Performance benchmarking tests
- Integration tests with live services
- Property-based testing for serialization
- Automated cross-language contract validation
- Load testing for concurrent operations

---

*This testing infrastructure supports Issue #91: Enhance Common Package Cross-Language Client Testing*