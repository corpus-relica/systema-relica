# Cache Management in Prism

This document describes the cache management functionality in Prism, including procedures for rebuilding caches, performance considerations, and best practices.

## Overview

Prism maintains several caches to optimize performance:
- Entity Facts Cache
- Entity Lineage Cache
- Subtypes Cache

These caches can be rebuilt through the UI when needed, such as during initial setup or for maintenance purposes.

## Cache Rebuild Process

### Via User Interface

1. Navigate to the Settings page in Viewfinder
2. Locate the "Cache Management" section (admin users only)
3. Select the caches you want to rebuild
4. Click the "Rebuild Caches" button
5. Monitor the progress through the UI

### WebSocket Messages

The cache rebuild process uses the following WebSocket messages:

```clojure
;; Start rebuild
{:type :prism.cache/rebuild
 :data {:cacheTypes ["entity-facts" "lineage" "subtypes"]}}

;; Progress updates
{:type :prism.cache/rebuild-progress
 :data {:status :rebuilding
        :progress 33
        :message "Building entity facts cache"}}

;; Completion
{:type :prism.cache/rebuild-complete
 :data {:status :complete
        :message "Cache rebuild completed successfully"}}

;; Error
{:type :prism.cache/rebuild-error
 :data {:status :error
        :error "Failed to build cache"
        :message "Cache rebuild failed"}}
```

## Performance Considerations

### Resource Usage

- Memory: Cache rebuilding requires additional memory during the process
  - Small dataset (~1000 records): ~50MB
  - Medium dataset (~10,000 records): ~200MB
  - Large dataset (~100,000 records): ~1GB

### Expected Completion Times

- Small dataset: ~5 seconds
- Medium dataset: ~15 seconds
- Large dataset: ~60 seconds

### Best Practices

1. **Timing**: Schedule rebuilds during low-traffic periods
2. **Monitoring**: Watch for:
   - Memory usage spikes
   - Increased database load
   - WebSocket connection stability

3. **Error Recovery**: If a rebuild fails:
   - Check error messages in the UI
   - Verify database connectivity
   - Ensure sufficient system resources
   - Retry the rebuild

## System Impact

During cache rebuilding:
- System remains operational
- Some operations may be slower
- New cache entries are buffered
- Existing cache entries remain available

## Security

- Cache management is restricted to admin users
- All rebuild operations are logged
- WebSocket connections require authentication

## Troubleshooting

### Common Issues

1. **WebSocket Disconnection**
   - UI will show connection warning
   - Rebuild will continue in background
   - Progress updates resume on reconnection

2. **Resource Constraints**
   - Monitor system metrics
   - Consider reducing batch size
   - Schedule during off-peak hours

3. **Partial Failures**
   - System maintains consistency
   - Failed rebuilds are rolled back
   - Error messages indicate specific failure points

### Recovery Steps

1. For connection issues:
   - Refresh the page
   - Check network connectivity
   - Verify WebSocket server status

2. For resource issues:
   - Monitor system metrics
   - Clear temporary data
   - Restart with smaller batch size

3. For partial failures:
   - Review error messages
   - Fix underlying issues
   - Retry rebuild operation

## API Documentation

### REST Endpoints

None - All cache management is handled through WebSocket connections.

### WebSocket Endpoints

#### :prism.cache/rebuild
Initiates cache rebuild process.
- Request:
  ```clojure
  {:type :prism.cache/rebuild
   :data {:cacheTypes [string]}}
  ```
- Response:
  ```clojure
  {:success boolean
   :message string}
  ```

#### :prism.cache/status
Gets current rebuild status.
- Request:
  ```clojure
  {:type :prism.cache/status}
  ```
- Response:
  ```clojure
  {:success boolean
   :data {:status keyword
          :progress number
          :message string
          :error string?}}
  ```

## Maintenance Schedule

Recommended cache rebuild frequency:
- Production: Monthly or after significant data changes
- Development: As needed during testing
- Initial Setup: Required after data import

## Monitoring

Key metrics to monitor:
- Cache hit rates
- Rebuild completion times
- Memory usage during rebuilds
- Error rates and types