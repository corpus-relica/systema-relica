# Clarity Package Test Suite

This directory contains comprehensive tests for the Clarity package, an Object-Semantic Mapper (OSM) that transforms raw semantic facts into structured object models.

## 📁 Test Structure

```
test/
└── io/
    └── relica/
        └── clarity/
            ├── test_helpers.clj           # Common test utilities
            ├── test_fixtures.clj          # Mock data and fixtures
            ├── io/
            │   └── ws_handlers_test.clj   # WebSocket handler tests
            └── services/
                ├── semantic_model_service_test.clj      # Core OSM routing
                ├── physical_object_model_service_test.clj
                ├── aspect_model_service_test.clj
                ├── role_model_service_test.clj
                ├── relation_model_service_test.clj
                ├── occurrence_model_service_test.clj
                └── entity_model_service_test.clj
```

## 🧪 Running Tests

### Run All Tests
```bash
# From clarity directory
clj -M:test

# With documentation reporter
clj -M:test --reporter kaocha.report/documentation

# Fail fast on first failure
clj -M:test --fail-fast
```

### Run Specific Test Namespace
```bash
# Run only semantic model service tests
clj -M:test --focus io.relica.clarity.services.semantic-model-service-test

# Run with pattern matching
clj -M:test --focus "*semantic*"
```

### Run Single Test
```bash
# Run specific test function
clj -M:test --focus io.relica.clarity.services.semantic-model-service-test/test-retrieve-semantic-model-physical-object-kind
```

### Watch Mode (if configured)
```bash
clj -M:test --watch
```

## 📊 Test Coverage

| Service | Tests | Coverage Areas |
|---------|-------|----------------|
| **Semantic Model** | 25 | Core routing, entity type handling, category mapping |
| **Physical Object** | 20 | Aspects, roles, parts, connections, totalities |
| **Aspect** | 19 | Kind/individual aspects, data validation |
| **Role** | 18 | Role players, requiring relations |
| **Relation** | 28 | Role requirements, special cases |
| **Occurrence** | 24 | Event modeling, future extensions |
| **Entity** | 27 | Base model, helpers, fact filtering |
| **WebSocket** | 10 | Message handling, error responses |

**Total**: 171+ test cases

## 🔧 Test Patterns

### 1. Async Testing
All service tests use core.async patterns:
```clojure
(let [result-chan (service/some-operation "uid")
      result (async/<!! (async/go (async/<! result-chan)))]
  (is (= (:expected result) "value")))
```

### 2. Mocking with with-redefs
```clojure
(with-redefs [dependency/function 
              (fn [arg] (go {:mocked "response"}))]
  ; test code here
  )
```

### 3. Error Handling Tests
```clojure
(with-redefs [service/operation
              (fn [_] (throw (Exception. "Test error")))]
  (let [result (async/<!! (service/function "uid"))]
    (is (nil? result)))) ; or check error structure
```

### 4. Performance Testing
```clojure
(let [start-time (System/currentTimeMillis)
      results (run-concurrent-operations)
      duration (- (System/currentTimeMillis) start-time)]
  (is (< duration 1000))) ; Should complete within 1 second
```

### 5. Integration Tests
```clojure
(deftest ^:integration test-real-service
  (when (System/getProperty "clarity.integration.tests")
    ; test with real dependencies
    ))
```

## 📋 Test Fixtures

### Mock Archivist Data (`test_fixtures.clj`)
- Pre-defined semantic facts for consistent testing
- Mock Archivist client implementation
- Expected transformation results
- Performance test datasets

### Test Helpers (`test_helpers.clj`)
- WebSocket message creation utilities
- Async test helpers (wait-for-reply)
- HTTP request/response mocks
- Common test patterns

## 🎯 Testing Focus Areas

### 1. Object-Semantic Transformation
- Raw facts → typed object models
- Entity type routing (kind vs individual)
- Category-based model selection

### 2. Model Service Coverage
- Physical Objects: parts, connections, aspects, roles
- Aspects: simple property models
- Roles: player requirements, relation constraints
- Relations: binary relationships, role requirements
- Occurrences: events and processes
- Entities: base model with classification

### 3. Error Resilience
- Nil/empty UID handling
- Archivist connection failures
- Timeout scenarios
- Malformed data handling

### 4. Performance
- Concurrent request handling
- Large dataset processing
- Async operation efficiency

## 🐛 Known Issues

1. **WebSocket Handler Tests**: Some failures due to message routing
2. **Nil UID Edge Cases**: Services may need additional nil checks
3. **Coverage Reporting**: Cloverage plugin needs configuration

## 🚀 Future Enhancements

1. **Property-Based Testing**: Add test.check for generative tests
2. **Performance Benchmarks**: Add criterium for detailed performance analysis
3. **Contract Testing**: Validate API contracts between services
4. **Mutation Testing**: Ensure test quality with mutation analysis
5. **Visual Test Reports**: HTML test reports with detailed coverage

## 📝 Contributing

When adding new tests:
1. Follow existing naming conventions (`test-function-name-scenario`)
2. Include success, error, and edge cases
3. Use consistent async patterns
4. Add appropriate test metadata (^:integration, etc.)
5. Update this README with new test counts

## 📚 Resources

- [Kaocha Documentation](https://github.com/lambdaisland/kaocha)
- [clojure.test Guide](https://clojure.github.io/clojure/clojure.test-api.html)
- [core.async Testing](https://clojuredocs.org/clojure.core.async)
- [Clarity WebSocket API](../websocket-api.md)
- [AODF Specification](../AODF.md)