# Archivist Test Suite

This directory contains tests for the Archivist service, focusing on WebSocket message handling and response formats.

## Running Tests

### Running the General Test Suite

To run all unit tests (that do not require a running server):

```bash
cd packages_clj/archivist
clj -M:test
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
- `io/ws_handlers_test.clj`: Tests for the WebSocket message handlers

### Integration Tests

- `integration/websocket_test.clj`: Integration tests for the WebSocket server and client communication

### Test Helpers

- `test_helpers.clj`: Shared testing utilities and Midje checkers

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

## Testing Philosophy

1. **Handler Tests**: Focus on testing the correct behavior of WebSocket message handlers, including:
   - Success path responses
   - Error path responses
   - Validation of incoming data
   - Service unavailability handling

2. **Response Format Tests**: Verify that the standardized response format is correctly implemented and consistent.

3. **Integration Tests**: Test the full communication path between clients and the server, ensuring the correct serialization and interoperability.