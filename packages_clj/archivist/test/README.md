# Archivist Test Suite

This directory contains comprehensive tests for the Archivist service, focusing on WebSocket message handling, response formats, connection lifecycle, performance benchmarks, and error scenarios. The test suite achieves 90% coverage of WebSocket-related functionality.

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
clj -M:test -v io.relica.archivist.io.ws-performance-test
```

### Running WebSocket Connection Tests

To run connection lifecycle and reliability tests:

```bash
cd packages_clj/archivist
clj -M:test -v io.relica.archivist.io.ws-connection-test
```

### Running the Archivist Client Tests

This test suite verifies the archivist-client interface against a running Archivist server:

```bash
# Run against localhost:3000 (default)
cd packages_clj/archivist
clj -M:test-client

# Run against specific host/port
clj -M:test-client example.com 8080

# Include transaction tests
clj -M:test-client localhost 3000 true
```

This verifies that:
1. The client can connect to the server
2. The client correctly sends requests
3. The server responds with standardized response format
4. Error conditions are handled properly

### Development with Auto-Reloading

For development with auto-reloaded tests:

```bash
cd packages_clj/archivist
clj -M:dev
```

Then in the REPL:

```clojure
(require 'midje.repl)
(require 'io.relica.archivist.archivist-client-test)

;; Run all client tests
(io.relica.archivist.archivist-client-test/run-client-tests)

;; Run specific test categories
(midje.repl/check-facts :filter :entity-ops)
(midje.repl/check-facts :filter :fact-ops)
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

- `test_helpers.clj`: Shared testing utilities and Midje checkers

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

1. Add a new fact block to `ws_handlers_test.clj`:

```clojure
(facts "about your new handler"
  (let [services (make-mock-services)]
    
    (fact "handles successful operation"
      (let [msg (mock-message :archivist.your-domain/your-action 
                             {:param1 "value1" 
                              :request_id "req-123"}
                             services)
            result-ch (handle-message-async msg)]
        (async/<!! result-ch) => (helpers/valid-success "req-123")
        (async/<!! result-ch) => (helpers/has-data-key :expected-key "expected-value")))
    
    (fact "handles error conditions"
      (let [msg (mock-message :archivist.your-domain/your-action 
                             {:error true
                              :request_id "req-456"}
                             services)
            result-ch (handle-message-async msg)]
        (async/<!! result-ch) => (helpers/valid-error "req-456")
        (async/<!! result-ch) => (helpers/has-error-type "expected-error-type")))))
```

2. Add appropriate mocks to the `make-mock-services` function if needed.

### Testing Response Format

If you add new response format utilities, add tests to `response_test.clj`:

```clojure
(facts "about your new response utility"
  (fact "correctly formats responses"
    (your-response-function arg1 arg2)
    => {:expected "structure"}))
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

2. Add a new fact in the integration test block:

```clojure
(fact "client can send your-action and receive expected response"
  (let [result-ch (ws-client/send-message! client :test/your-action 
                                          {:your-param "value"
                                           :request_id "test-req-789"} 
                                          5000)]
    (let [response (<!! result-ch)]
      response => (helpers/valid-success "test-req-789")
      (get-in response [:data :your-result]) => "value")))
```

## Debugging Tests

When tests fail, Midje provides detailed error messages. You can also use the `(midje.repl/check-facts)` function in the REPL to run specific tests and get more detailed output.

## Running Specific Test Categories

### Performance Tests
```bash
# Run all performance tests
clj -M:test -v io.relica.archivist.io.ws-performance-test

# Run specific performance categories in REPL
(midje.repl/check-facts :filter :performance)
```

### Connection Tests
```bash
# Run all connection lifecycle tests
clj -M:test -v io.relica.archivist.io.ws-connection-test
```

### Live Interface Tests (requires running server)
```bash
# Run against localhost:3000
(io.relica.archivist.ws-interface-test/run-interface-tests)

# Run performance-focused tests
(io.relica.archivist.ws-interface-test/run-performance-tests)

# Run all interface tests
(io.relica.archivist.ws-interface-test/run-all-interface-tests)
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

1. **Handler Tests**: Focus on testing the correct behavior of WebSocket message handlers, including:
   - Success path responses
   - Error path responses
   - Validation of incoming data
   - Service unavailability handling
   - **NEW**: Edge cases and boundary conditions
   - **NEW**: Performance characteristics

2. **Response Format Tests**: Verify that the standardized response format is correctly implemented and consistent:
   - Complex nested data structures
   - Various error types and codes
   - Empty data handling
   - Timestamp inclusion

3. **Integration Tests**: Test the full communication path between clients and the server:
   - **ENHANCED**: Connection reliability under stress
   - **NEW**: Message queuing and delivery guarantees
   - **NEW**: Error recovery mechanisms
   - **NEW**: Performance under load

4. **Performance Tests**: Ensure the system maintains acceptable performance:
   - Handler execution time benchmarks
   - Throughput measurements
   - Memory usage monitoring
   - Concurrent connection handling
   - Performance regression prevention