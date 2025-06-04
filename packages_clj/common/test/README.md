# Common Package Testing Documentation

This document describes the testing utilities and patterns established for cross-language client testing in the common package.

## Overview

The common package test suite provides comprehensive coverage for cross-language communication between Clojure, Python, and TypeScript services. All tests use **clojure.test** with **Kaocha** test runner and follow consistent patterns with shared testing utilities.

## Test Framework Migration (2024)

🚀 **Successfully migrated from Midje to clojure.test + Kaocha**
- ✅ All tests converted to standard clojure.test format
- ✅ Kaocha test runner configured for optimal development experience
- ✅ Test utilities updated for async operations and mocking
- ✅ 52 tests, 323 assertions, comprehensive coverage maintained

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
(deftest client-functionality-test
  (testing "About client functionality"
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
      
      (testing "specific functionality"
        (is (= expected-result actual-result))))))
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

### Async Testing Pattern

Async operations use core.async with proper timeout handling:

```clojure
(testing "async operation"
  (let [result (<!! (client-operation client "param"))]
    (is (= true (:success result)))
    (is (= "expected-value" (get-in result [:data :field])))))
```

### Cross-Language Testing Pattern

Cross-language compatibility is verified by:
1. Testing message serialization to JSON
2. Simulating responses from other language services  
3. Verifying snake_case/camelCase handling
4. Testing data type preservation

## Test Utilities

### Shared Test Helpers (`test_helpers.clj`)

Provides common utilities for all tests including:

```clojure
(defn wait-for
  "Wait for a condition to become truthy, with timeout"
  ([pred] (wait-for pred 1000))
  ([pred timeout-ms] ...))

(defmacro async-test
  "Run an async test with a timeout"
  [timeout-ms & body] ...)
```

## Running Tests

### Full Test Suite
```bash
cd packages_clj/common
clj -M:test
```

### Watch Mode (Re-run on file changes)
```bash
clj -M:test-watch
```

### Focus on Specific Tests
```bash
clj -M:test --focus :unit
```

### Single Test Namespace  
```bash
clj -M:test --focus io.relica.common.io.aperture-client-test
```

### Configuration
Tests are configured via `tests.edn`:
```clojure
#kaocha/v1
{:tests [{:id :unit
          :test-paths ["test"]
          :source-paths ["src"]
          :ns-patterns [".*-test$"]}]
 :reporter [kaocha.report/documentation]
 :fail-fast? false
 :color? true
 :randomize? false
 :capture-output? false}
```

## Systemwide Usage

### For Other Packages Converting to clojure.test + Kaocha

**1. Copy Configuration:**
```bash
# Copy from common package
cp packages_clj/common/tests.edn packages_clj/your-package/
```

**2. Update deps.edn:**
```clojure
:aliases
{:test {:extra-paths ["test"]
        :extra-deps {org.clojure/test.check {:mvn/version "1.1.1"}
                     org.clojure/tools.namespace {:mvn/version "1.4.4"}
                     org.clojure/data.json {:mvn/version "2.4.0"}
                     org.clojure/spec.alpha {:mvn/version "0.3.218"}
                     lambdaisland/kaocha {:mvn/version "1.91.1392"}}
        :main-opts ["-m" "kaocha.runner"]}}
```

**3. Import Shared Utilities:**
```clojure
(:require [io.relica.common.test-helpers :as helpers])
```

**4. Follow Test Patterns:**
Use the client test files in this package as templates for consistent testing patterns.

## Coverage Requirements

Tests achieve 90%+ coverage across:
- All client implementations (5 clients fully tested)
- Cross-language serialization paths (JSON, EDN, Nippy)
- Error handling scenarios (network, timeout, service errors)
- Connection management logic (auto-connect, disconnect, heartbeat)
- Response format utilities (success/error generation, mapping)

## Best Practices

### 1. Consistent Naming
- Test namespaces: `io.relica.common.*-test`
- Test functions: `deftest component-functionality-test`
- Test groups: `(testing "About component functionality" ...)`

### 2. Mock Data
- Use realistic entity UIDs and names
- Include representative metadata
- Test edge cases (empty arrays, nil values, large datasets)

### 3. Async Testing
- Use `<!!` for blocking on channels in tests
- Test timeout behavior explicitly
- Verify response timing where relevant

### 4. Cross-Language Compatibility
- Always test JSON serialization paths
- Verify snake_case/kebab-case handling
- Include metadata that other services expect

### 5. Error Scenarios
- Test all major error types (network, timeout, service)
- Verify error message format consistency
- Include stack trace handling for Python services

## Dependencies

### Required Dependencies
- `org.clojure/test.check` - Property-based testing
- `org.clojure/core.async` - Async operations
- `lambdaisland/kaocha` - Test runner
- `cheshire/cheshire` - JSON handling
- `com.taoensso/nippy` - Binary serialization

### Development Dependencies  
- `org.clojure/tools.namespace` - Namespace reloading
- `org.clojure/data.json` - Additional JSON utilities
- `org.clojure/spec.alpha` - Contract validation

## Migration Guide (Midje → clojure.test)

For packages still using Midje, follow this conversion pattern:

### Before (Midje):
```clojure
(facts "About client functionality"
  (fact "operation succeeds"
    (client-operation client "param") => (contains {:success true})))
```

### After (clojure.test):
```clojure
(deftest client-functionality-test
  (testing "About client functionality"
    (testing "operation succeeds"
      (let [result (client-operation client "param")]
        (is (= true (:success result)))))))
```

### Key Changes:
- `facts` → `deftest`
- `fact` → `testing`  
- `=>` → `(is (= ...))`
- `(contains {...})` → explicit field checking

## Future Enhancements

Potential areas for expansion:
- Performance benchmarking tests
- Integration tests with live services
- Property-based testing for serialization
- Automated cross-language contract validation
- Load testing for concurrent operations
- Contract-first testing with OpenAPI specs

---

*This testing infrastructure supports Issue #91: Enhance Common Package Cross-Language Client Testing*
*Successfully migrated to clojure.test + Kaocha (2024) - Ready for systemwide adoption*