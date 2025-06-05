# Archivist Test Suite

This directory contains comprehensive tests for the Archivist service, migrated from Midje to clojure.test + Kaocha. The test suite focuses on WebSocket message handling, response formats, connection lifecycle, performance benchmarks, and error scenarios with enhanced reliability and modern testing practices.

## Running Tests

### Running the General Test Suite

To run all unit tests (that do not require a running server):

```bash
cd packages_clj/archivist
clj -M:test
```

### Running WebSocket Performance Tests

To run performance benchmarks and load tests:

```bash
cd packages_clj/archivist
clj -M:test --focus io.relica.archivist.ws-interface-test/websocket-performance-test
```

### Running WebSocket Connection Tests

To run connection lifecycle and reliability tests:

```bash
cd packages_clj/archivist
clj -M:test --focus io.relica.archivist.io.ws-connection-test
```

### Running the Archivist Client Tests

This test suite verifies the archivist-client interface against a running Archivist server:

```bash
# Run specific client tests
cd packages_clj/archivist
clj -M:test --focus io.relica.archivist.archivist-client-test

# Run all interface tests (requires live server)
clj -M:test --focus-meta :live
```

This verifies that:
1. The client can connect to the server
2. The client correctly sends requests
3. The server responds with standardized response format
4. Error conditions are handled properly

### Development with Auto-Reloading

For development with auto-reloaded tests using Kaocha watch mode:

```bash
cd packages_clj/archivist
clj -M:test --watch
```

Or start a REPL session:

```bash
cd packages_clj/archivist
clj -M:dev
```

Then in the REPL:

```clojure
(require '[clojure.test :refer [run-tests]])
(require 'io.relica.archivist.archivist-client-test)

;; Run all tests in a namespace
(run-tests 'io.relica.archivist.core.fact-test)

;; Run specific test
(clojure.test/test-var #'io.relica.archivist.core.fact-test/create-fact-test)
```

## Test Structure

The test suite is organized into the following main components:

### Unit Tests

- `utils/response_test.clj`: Tests for the standardized response format utilities
- `io/ws_handlers_test.clj`: Enhanced WebSocket message handlers tests with comprehensive edge case coverage
- `core/fact_test.clj`: Tests for core fact operations
- `core/submission_test.clj`: Tests for submission operations

### Integration Tests

- `integration/websocket_test.clj`: Enhanced integration tests for WebSocket server and client communication with complex data structures
- `io/ws_connection_test.clj`: **NEW** - Comprehensive connection lifecycle, reliability, and error recovery tests
- `ws_interface_test.clj`: **ENHANCED** - Live WebSocket interface tests with performance and load testing

### Performance Tests

- `io/ws_performance_test.clj`: **NEW** - Performance benchmarking infrastructure including:
  - Handler execution time benchmarks
  - Message processing throughput tests
  - Memory usage monitoring
  - Concurrent connection performance tests
  - Performance regression prevention tests

### Test Helpers

- `test_helpers.clj`: Shared testing utilities and clojure.test helpers  
- `test_fixtures.clj`: **NEW** - Centralized mock services for UID, Graph, and Cache
- `fact_test_helper.clj`: **NEW** - High-level fact operation mocks avoiding Neo4j dependencies

## Test Coverage Areas

The enhanced test suite now covers:

### WebSocket Handler Coverage (90%+)
- ✅ All CRUD operations (create, read, update, delete)
- ✅ Batch operations and bulk processing
- ✅ Search operations (text and UID search)
- ✅ Entity operations and type resolution
- ✅ Graph query execution
- ✅ Submission operations (definitions, collections, naming)
- ✅ Lineage and relation operations
- ✅ Error handling for all handler types
- ✅ Missing field validation
- ✅ Database error scenarios

### Connection Lifecycle Coverage
- ✅ Connection establishment and teardown
- ✅ Auto-disconnect scenarios
- ✅ Message sending when connected/disconnected
- ✅ Heartbeat functionality
- ✅ Connection state tracking
- ✅ Multiple rapid connections/disconnections
- ✅ Reconnection logic with retry limits
- ✅ Network failure simulation and recovery

### Message Queuing and Delivery
- ✅ Message enqueueing and processing
- ✅ Delivery guarantee testing
- ✅ Failed message retry mechanisms
- ✅ Queue state management

### Performance Benchmarks
- ✅ Handler execution time measurements
- ✅ Throughput testing under load
- ✅ Memory usage monitoring
- ✅ Concurrent connection performance
- ✅ Performance regression prevention
- ✅ Comprehensive performance reporting

### Error Scenarios
- ✅ Database connection failures
- ✅ Invalid query syntax handling
- ✅ Non-existent entity lookups
- ✅ Missing required fields
- ✅ Malformed request handling
- ✅ Large payload processing
- ✅ Timeout scenarios
- ✅ Server stress conditions

## Adding New Tests

### Testing a New Handler

1. Add a new deftest to `ws_handlers_test.clj`:

```clojure
(deftest your-new-handler-test
  (testing "handles successful operation"
    (with-redefs [your-service/operation (fn [data] {:success true :result data})]
      (let [msg (mock-message :archivist.your-domain/your-action 
                             {:param1 "value1" 
                              :request_id "req-123"})
            result-ch (handle-message-async msg)]
        (is (helpers/valid-success? (async/<!! result-ch) "req-123"))
        (is (helpers/has-data-key? (async/<!! result-ch) :expected-key "expected-value")))))
  
  (testing "handles error conditions"
    (with-redefs [your-service/operation (fn [_] {:success false :error "test error"})]
      (let [msg (mock-message :archivist.your-domain/your-action 
                             {:error true
                              :request_id "req-456"})
            result-ch (handle-message-async msg)]
        (is (helpers/valid-error? (async/<!! result-ch) "req-456"))
        (is (helpers/has-error-type? (async/<!! result-ch) "expected-error-type"))))))
```

2. Add appropriate mocks using `with-redefs` or extend the `test_fixtures.clj` if needed.

### Testing Response Format

If you add new response format utilities, add tests to `response_test.clj`:

```clojure
(deftest your-new-response-utility-test
  (testing "correctly formats responses"
    (is (= (your-response-function arg1 arg2)
           {:expected "structure"}))))
```

### Testing Client-Server Integration

To test full client-server integration:

1. Add a new handler method in `websocket_test.clj`:

```clojure
(defmethod ws-server/handle-ws-message :test/your-action
  [{:keys [?data ?reply-fn]}]
  (when ?reply-fn
    (?reply-fn (response/success-response 
                {:your-result "value"} 
                (:request_id ?data)))))
```

2. Add a new test in the integration test block:

```clojure
(deftest your-action-integration-test
  (testing "client can send your-action and receive expected response"
    (let [result-ch (ws-client/send-message! client :test/your-action 
                                            {:your-param "value"
                                             :request_id "test-req-789"} 
                                            5000)
          response (<!! result-ch)]
      (is (helpers/valid-success? response "test-req-789"))
      (is (= (get-in response [:data :your-result]) "value")))))
```

## Debugging Tests

When tests fail, clojure.test provides detailed error messages. You can run tests in the REPL for more detailed output:

```clojure
;; Run a specific test function
(clojure.test/test-var #'your-namespace/your-test-name)

;; Run all tests in a namespace with detailed output
(clojure.test/run-tests 'your-namespace)

;; Use Kaocha for even more detailed reporting
;; clj -M:test --reporter documentation
```

## Running Specific Test Categories

### Performance Tests
```bash
# Run WebSocket performance tests
clj -M:test --focus io.relica.archivist.ws-interface-test/websocket-performance-test

# Run performance tests with metadata tags
clj -M:test --focus-meta :performance
```

### Connection Tests
```bash
# Run all connection lifecycle tests
clj -M:test --focus io.relica.archivist.io.ws-connection-test
```

### Live Interface Tests (requires running server)
```bash
# Run all live interface tests
clj -M:test --focus-meta :live

# Run specific interface test namespace
clj -M:test --focus io.relica.archivist.ws-interface-test
```

## Performance Benchmarks

The test suite includes comprehensive performance benchmarks with baselines:

- **Single Handler Max Time**: 50ms
- **Batch Processing Max Time**: 200ms (for 100 items)
- **Minimum Throughput**: 10 operations/second
- **Maximum Memory Increase**: 100MB
- **Concurrent Connections Max Time**: 5 seconds (for 10 connections)

Performance regression tests automatically fail if these baselines are exceeded.

## Testing Philosophy

1. **Handler Tests**: Focus on testing the correct behavior of WebSocket message handlers using clojure.test:
   - Success path responses with `(testing ...)` blocks
   - Error path responses with proper assertions
   - Validation of incoming data using `(is ...)` assertions
   - Service unavailability handling with `with-redefs` mocking
   - **ENHANCED**: Edge cases and boundary conditions
   - **ENHANCED**: Mock-based testing avoiding external dependencies

2. **Response Format Tests**: Verify that the standardized response format is correctly implemented:
   - Complex nested data structures validation
   - Various error types and codes testing
   - Empty data handling scenarios
   - Response format consistency across handlers
   - **UPDATED**: Using clojure.test assertions instead of Midje arrows

3. **Integration Tests**: Test the full communication path between clients and the server:
   - **ENHANCED**: Connection reliability with proper setup/teardown
   - **ENHANCED**: Mock services using protocols and records
   - **NEW**: Test fixtures for centralized mock management
   - **ENHANCED**: Performance under load with real metrics

4. **Performance Tests**: Ensure the system maintains acceptable performance:
   - **FIXED**: WebSocket performance test now passing (20 requests in ~1.1s)
   - Handler execution time benchmarks
   - Connection establishment reliability
   - Response format validation accuracy
   - **NEW**: Enhanced debugging output for performance analysis