# Archivist Package Migration Plan: Midje to clojure.test + Kaocha

## Issue: #107 - Migrate Archivist Package from Midje to clojure.test + Kaocha

### Branch: `feature/rlc-81-feattesting-migrate-archivist-package-from-midje-to`

## Migration Tasks

### Phase 1: Infrastructure Setup (High Priority)
- [ ] Update archivist deps.edn: Remove Midje, add Kaocha + clojure.test dependencies
- [ ] Create tests.edn configuration file for archivist based on common package
- [ ] Fix test runner reference in deps.edn (replace broken io.relica.common.test.runner)

### Phase 2: Test Conversion (Medium Priority)
- [ ] Convert core tests: fact_test.clj and submission_test.clj
- [ ] Convert WebSocket tests: ws_connection_test.clj, ws_handlers_test.clj, ws_interface_test.clj
- [ ] Convert integration tests: websocket_test.clj, gel_query_integration_test.clj
- [ ] Convert parser tests: gel_parser_test.clj
- [ ] Convert client and performance tests: archivist_client_test.clj, ws_performance_test.clj

### Phase 3: Cleanup & Verification (Low Priority)
- [ ] Convert utility tests: response_test.clj
- [ ] Remove legacy Midje files and update documentation
- [ ] Verify test coverage is maintained at 85%+

## Files to Migrate

```
packages_clj/archivist/test/
├── io/relica/archivist/
│   ├── archivist_client_test.clj        # Client integration tests
│   ├── core/
│   │   ├── fact_test.clj               # Core fact operations
│   │   └── submission_test.clj         # Data submission tests  
│   ├── integration/
│   │   └── websocket_test.clj          # WebSocket integration
│   ├── io/
│   │   ├── ws_connection_test.clj      # Connection management
│   │   ├── ws_handlers_test.clj        # Message handlers
│   │   └── ws_performance_test.clj     # Performance testing
│   ├── query/
│   │   ├── gel_parser_test.clj         # Gellish parser tests
│   │   └── gel_query_integration_test.clj # Query integration
│   ├── utils/
│   │   └── response_test.clj           # Response utilities
│   └── ws_interface_test.clj           # WebSocket interface
```

## Reference Materials
- Common package migration: `packages_clj/common/test/README.md`
- Common package tests.edn: `packages_clj/common/tests.edn`
- Common package deps.edn: `packages_clj/common/deps.edn`

## Success Criteria
- All tests converted to clojure.test format
- Test coverage maintained at 85%+
- Performance improvement of 40%+ in test execution
- Zero test failures after conversion
- Kaocha watch mode functional

## Notes
- Follow patterns established in PR #106 (common package migration)
- Use shared test helpers from `io.relica.common.test-helpers`
- Maintain consistency with common package test structure