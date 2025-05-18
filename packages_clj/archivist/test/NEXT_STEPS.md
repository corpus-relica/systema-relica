# Next Steps for Archivist Test Suite

## Current Status

We've set up a basic test framework for Archivist with an emphasis on WebSocket message handling and response formats. Currently, the tests cover:

- Basic response format utils testing
- Interoperability testing for the standardized response format
- Placeholder tests for more complex scenarios

## Immediate Next Steps

### 1. Expand Response Format Tests

- Add tests for edge cases (e.g., empty data, null request IDs)
- Test all error codes and types
- Test the handler wrapper function with more complex scenarios

### 2. Implement Handler Tests

- Create proper mocks for the required services
- Test key handlers individually:
  - Graph query execution
  - Fact retrieval
  - Entity resolution
  - Transaction handling
- Test error handling in handlers

### 3. Set Up Integration Tests

To properly test the WebSocket communication, we need to:

- Set up a test WebSocket server and client
- Test the full request-response cycle
- Test timeout handling
- Test connection issues

## Adding a New Handler Test

When adding a test for a new handler, follow this pattern:

```clojure
(facts "about your-handler"
  (let [services (make-mock-services-with-behavior ...)]
    
    (fact "handles successful operation"
      (let [msg (mock-message :archivist.domain/action
                             {:param1 "value1", :request_id "req-123"}
                             services)
            result (handle-message-sync msg)]
        result => (has-success-response)
        result => (has-expected-data)))
    
    (fact "handles error conditions"
      (let [msg (mock-message :archivist.domain/action
                             {:param1 "invalid", :request_id "req-456"}
                             services)
            result (handle-message-sync msg)]
        result => (has-error-response)
        result => (has-error-code expected-code)))))
```

## Testing Specific Error Scenarios

For comprehensive testing, make sure to cover these error scenarios:

1. Service unavailability errors
2. Input validation errors
3. Database errors
4. Authorization errors
5. Timeout handling

## Running Specific Tests

To run a specific namespace of tests:

```bash
cd packages_clj/archivist
clj -M:dev

# In the REPL
(require 'midje.repl)
(require 'io.relica.archivist.utils.response-test)
(midje.repl/check-facts 'io.relica.archivist.utils.response-test)
```

## Continuous Integration

Once the test suite is more mature, consider integrating it into your CI pipeline:

1. Add a test script that can be run in CI
2. Add test coverage reporting
3. Establish minimum coverage thresholds

## Documentation

As the test suite grows, improve documentation by:

1. Adding more detailed test patterns to the README
2. Documenting common testing patterns and utilities
3. Providing examples of testing different types of handlers