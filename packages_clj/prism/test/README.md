# Prism Test Suite

This directory contains comprehensive tests for the Prism service, focusing on cache management, performance validation, and integration testing.

## 🧪 Test Structure

### Core Services Tests (`services/`)

#### Cache Management
- **`cache_invalidation_test.clj`** - Cache invalidation strategies and data consistency
  - Individual entity invalidation
  - Cascade invalidation for related entities
  - Selective cache clearing with data preservation
  - Batch invalidation operations

- **`cache_eviction_test.clj`** - Memory pressure testing and eviction policies
  - Graceful handling of memory limits
  - Redis eviction behavior simulation
  - Performance under memory constraints
  - Memory cleanup validation

- **`cache_concurrency_test.clj`** - Concurrent access patterns and thread safety
  - Multiple concurrent writers without data loss
  - Read/write conflict prevention
  - Race condition testing during rebuilds
  - High concurrency performance validation

- **`cache_reliability_test.clj`** - Failure scenarios and recovery mechanisms
  - Network timeout handling
  - Partial data failure recovery
  - Redis connection failure resilience
  - Cache consistency during failures

- **`cache_rebuild_test.clj`** - Cache rebuild orchestration and status tracking
  - Rebuild status management
  - Progress tracking and broadcasting
  - Error handling during rebuild operations
  - Concurrent rebuild prevention

- **`xls_cache_test.clj`** - XLS transformation caching optimization
  - File content-based cache invalidation
  - UID mapping state caching
  - Cache warming for frequent files
  - Performance benchmarking vs file system access

### Performance Tests (`performance/`)

- **`cache_rebuild_perf_test.clj`** - Comprehensive performance benchmarking
  - Dataset size scaling (1K, 10K, 100K records)
  - Multiple access patterns: sequential, random, hot-spot, burst
  - Memory usage monitoring during operations
  - Linear scaling validation

- **`cache_memory_test.clj`** - Memory usage patterns and leak detection
  - JVM heap vs non-heap monitoring
  - Memory leak detection across repeated operations
  - Memory pressure simulation
  - Resource cleanup validation

### Integration Tests (`integration/`)

- **`cache_rebuild_flow_test.clj`** - End-to-end cache rebuild workflows
  - Complete rebuild flow validation
  - WebSocket integration testing
  - Cache content verification

### Statechart Tests (`statechart/`)

- **`statechart_cache_test.clj`** - Cache coordination with statechart state management
  - State transition coordination
  - Cache build sequencing through states
  - Error recovery in statechart context
  - Cache integrity during state changes

### WebSocket Tests (`io/`)

- **`ws_handlers_cache_test.clj`** - WebSocket handler testing for cache operations
  - Cache rebuild initiation via WebSocket
  - Status broadcasting and updates
  - Error handling in WebSocket context

## 🚀 Running Tests

### All Tests
```bash
cd packages_clj/prism
clj -M:test
```

### Specific Test Namespace
```bash
cd packages_clj/prism
clj -M:test -n io.relica.prism.services.cache-invalidation-test
```

### Performance Tests Only
```bash
cd packages_clj/prism
clj -M:test -n io.relica.prism.performance.*
```

### Integration Tests Only
```bash
cd packages_clj/prism
clj -M:test -n io.relica.prism.integration.*
```

## 📊 Performance Targets

The test suite validates these performance benchmarks:

- **Cache Rebuild**: < 5 seconds for standard datasets
- **Memory Usage**: < 2GB during peak operations
- **Concurrent Access**: < 100ms latency
- **Cache Hit Ratio**: > 85% for typical workloads

## 🛠️ Test Infrastructure

### Mocking & Setup
- Redis connection mocking for isolated testing
- Cache service component lifecycle management
- WebSocket message simulation
- Memory pressure simulation utilities

### Test Data Generation
- Configurable fact datasets (1K-100K records)
- Various access pattern generators
- Mock XLS file data
- Lineage relationship simulation

### Performance Measurement
- JVM memory monitoring utilities
- Execution time benchmarking
- Concurrent operation coordination
- Resource usage tracking

## 🎯 Coverage Areas

### Cache Operations
- ✅ Entity facts cache management
- ✅ Entity lineage cache operations
- ✅ Descendants/subtypes cache handling
- ✅ Cache invalidation strategies
- ✅ Memory pressure handling

### Performance Validation
- ✅ Multiple data access patterns
- ✅ Scaling across dataset sizes
- ✅ Memory leak detection
- ✅ Concurrent operation efficiency

### Integration Testing
- ✅ WebSocket handler integration
- ✅ Statechart coordination
- ✅ XLS transformation workflows
- ✅ End-to-end cache rebuilds

### Reliability Testing
- ✅ Network failure scenarios
- ✅ Partial data corruption handling
- ✅ Recovery mechanism validation
- ✅ Data consistency verification

## 🔧 Configuration

Tests use the standard Prism test configuration with:
- Redis connection mocking
- Midje testing framework
- Async operation coordination with core.async
- Memory monitoring via JVM management beans

## 📝 Adding New Tests

When adding cache-related tests:

1. **Follow naming conventions**: `cache_[functionality]_test.clj`
2. **Include setup/teardown**: Use `before`/`after` for cache cleanup
3. **Mock external dependencies**: Redis, WebSocket, database connections
4. **Test multiple scenarios**: Success cases, failure cases, edge cases
5. **Validate performance**: Include timing and memory assertions where relevant

## 🐛 Troubleshooting

### Common Issues
- **Redis connection errors**: Ensure cache service mocking is properly configured
- **Memory test failures**: GC timing can affect memory measurements
- **Async test flakiness**: Use appropriate timeouts for `go` blocks
- **Concurrent test race conditions**: Ensure proper synchronization

### Debug Mode
Enable detailed logging during tests:
```bash
PRISM_LOG_LEVEL=debug clj -M:test
```

This comprehensive test suite ensures Prism's cache layer performs optimally under various load conditions and failure scenarios, providing confidence in the reliability and performance of the caching infrastructure.