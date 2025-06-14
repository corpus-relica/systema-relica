# Cache Management in Prism

This document describes the cache management functionality in Prism, including procedures for rebuilding caches, performance considerations, and best practices.

## Overview

Prism maintains several Redis-based caches to optimize performance across the Systema Relica system:

- **Entity Facts Cache**: Maps entities to their associated facts for fast lookup
- **Entity Lineage Cache**: Stores inheritance hierarchies and type relationships  
- **Subtypes Cache**: Maps types to all their subtypes for taxonomy queries

These caches can be rebuilt through the WebSocket API when needed, such as during initial setup or for maintenance purposes.

## Cache Types

### Entity Facts Cache

**Purpose**: Provides fast access to facts associated with specific entities.

**Structure**:
```typescript
{
  entityUid: string,
  facts: [
    {
      factUid: string,
      relTypeUid: string,
      rhObjectUid: string,
      // Additional fact properties
    }
  ]
}
```

**Use Cases**:
- Retrieving all facts for an entity
- Finding relationships of specific types
- Optimizing entity detail queries

### Entity Lineage Cache

**Purpose**: Stores hierarchical relationships for inheritance and classification.

**Structure**:
```typescript
{
  entityUid: string,
  ancestors: string[],     // All parent types
  descendants: string[],   // All child types
  directParents: string[], // Immediate parents
  directChildren: string[] // Immediate children
}
```

**Use Cases**:
- Type hierarchy traversal
- Classification queries
- Inheritance validation

### Subtypes Cache

**Purpose**: Maps each type to all its subtypes for efficient taxonomy operations.

**Structure**:
```typescript
{
  typeUid: string,
  subtypes: string[], // All descendant types
  depth: number       // Maximum depth in hierarchy
}
```

**Use Cases**:
- Finding all subtypes of a given type
- Type-inclusive queries
- Taxonomy navigation

## Cache Rebuild Process

### Triggering a Rebuild

Cache rebuilds can be initiated through the WebSocket API:

```typescript
// Request cache rebuild
{
  type: ':prism.cache/rebuild',
  payload: {}
}

// Monitor progress with status checks
{
  type: ':prism.cache/status', 
  payload: {}
}

// Or listen for broadcast events
{
  type: ':prism.cache/event',
  payload: {
    status: 'rebuilding',
    progress: 45,
    message: 'Building entity lineage cache...'
  }
}
```

### Rebuild Sequence

The cache rebuild follows a specific sequence:

1. **Initialization** (0-10%)
   - Clear existing cache entries
   - Initialize Redis connections
   - Prepare data structures

2. **Entity Facts Cache** (10-40%)
   - Query facts from Archivist in batches
   - Process each fact to extract entity relationships
   - Store in Redis with optimized structure

3. **Entity Lineage Cache** (40-70%)
   - Fetch hierarchy relationships (rel-type-uids 1146, 1726)
   - Build bidirectional parent-child mappings
   - Calculate transitive closures for ancestors/descendants

4. **Subtypes Cache** (70-90%)
   - Process lineage data to extract subtype relationships
   - Build comprehensive subtype mappings
   - Optimize for query performance

5. **Finalization** (90-100%)
   - Validate cache consistency
   - Update metadata and timestamps
   - Broadcast completion event

### Progress Monitoring

Real-time progress updates are available through:

**WebSocket Status Query**:
```typescript
{
  type: ':prism.cache/status',
  payload: {}
}
// Returns current status, progress percentage, and stage
```

**Broadcast Events**:
```typescript
// Automatic progress updates sent to all connected clients
{
  type: ':prism.cache/event',
  payload: {
    status: 'rebuilding',
    progress: 65,
    message: 'Building subtypes cache...',
    timestamp: '2025-06-14T17:25:30.000Z'
  }
}
```

## Performance Considerations

### Resource Usage

Cache rebuilding requires additional resources during the process:

| Dataset Size | Memory Usage | Duration | Redis Storage |
|--------------|--------------|----------|---------------|
| Small (~1K records) | ~50MB | ~5 seconds | ~10MB |
| Medium (~10K records) | ~200MB | ~30 seconds | ~50MB |
| Large (~100K records) | ~1GB | ~3 minutes | ~200MB |
| Very Large (~1M records) | ~5GB | ~15 minutes | ~1GB |

### Optimization Strategies

**Batching**: Process data in configurable batch sizes to manage memory usage:
```typescript
CACHE_BATCH_SIZE=5000  // Adjust based on available memory
```

**Parallel Processing**: Where possible, cache types are built in parallel to reduce total time.

**Incremental Updates**: Future enhancement to support incremental cache updates rather than full rebuilds.

### Expected Completion Times

Typical completion times by dataset size:
- **Small datasets**: 5-10 seconds
- **Medium datasets**: 30-60 seconds  
- **Large datasets**: 3-10 minutes
- **Very large datasets**: 15-30 minutes

## Best Practices

### Timing Considerations

1. **Schedule during low-traffic periods** to minimize system impact
2. **Avoid concurrent rebuilds** - system prevents multiple simultaneous rebuilds
3. **Monitor system resources** during rebuilds on large datasets

### Monitoring Guidelines

Watch for these indicators during cache rebuilds:

**System Metrics**:
- Memory usage spikes (normal during rebuild)
- CPU utilization increase
- Redis memory consumption
- Network traffic between services

**Application Metrics**:
- WebSocket connection stability
- Query response times
- Error rates in dependent services

**Database Load**:
- Neo4j query performance
- Connection pool utilization
- Lock contention (rare but possible)

### Error Recovery

If a cache rebuild fails:

1. **Check Error Messages**: 
   ```typescript
   {
     type: ':prism.cache/status',
     payload: {}
   }
   // Will include error details if failed
   ```

2. **Verify Prerequisites**:
   - Neo4j connectivity and performance
   - Redis availability and memory
   - Archivist service accessibility

3. **Retry Strategy**:
   - Wait for system stabilization
   - Check resource availability
   - Retry the rebuild operation

4. **Escalation**:
   - Review service logs for detailed errors
   - Check database integrity
   - Contact system administrators if needed

## System Impact During Rebuilds

### Service Availability

- **System remains operational** during cache rebuilds
- **Query performance may be temporarily reduced** while caches are being rebuilt
- **New data is buffered** and will be included in the rebuilt caches
- **Existing cache entries remain available** until replacement is complete

### Dependency Effects

**Archivist Service**:
- Increased query load during fact retrieval
- Temporary performance impact on concurrent operations

**Redis**:
- Higher memory usage during transition period
- Increased network traffic for cache operations

**Client Applications**:
- May experience slower responses for cache-dependent queries
- Real-time updates continue normally

## Security and Access Control

### Authentication

- Cache management operations require **authenticated WebSocket connections**
- **Admin-level permissions** recommended for cache rebuild operations
- All operations are **logged and auditable**

### Data Protection

- **No sensitive data exposure** in cache rebuild operations
- Cache contents follow same **security model** as source data
- **Encryption in transit** for all WebSocket communications

### Audit Logging

All cache operations are logged with:
- User identity (when available)
- Operation type and parameters
- Timestamp and duration
- Success/failure status
- Error details (if applicable)

## Troubleshooting

### Common Issues

**WebSocket Disconnection During Rebuild**:
- Rebuild continues in background
- Progress updates resume on reconnection
- Status can be checked after reconnection

**Resource Constraints**:
```bash
# Monitor system resources
docker stats prism
redis-cli info memory
docker exec neo4j cypher-shell "CALL dbms.listQueries();"
```

**Partial Cache Failures**:
- System maintains consistency through atomic operations
- Failed rebuilds are automatically rolled back
- Error messages indicate specific failure points

**Performance Degradation**:
- Check system resource availability
- Review concurrent operations load
- Consider scheduling during off-peak hours

### Recovery Procedures

**For Connection Issues**:
1. Verify network connectivity
2. Check WebSocket server status
3. Restart client connections if needed

**For Resource Issues**:
1. Monitor system metrics
2. Free up memory if possible
3. Adjust batch sizes in configuration
4. Schedule rebuild during low-usage periods

**For Data Consistency Issues**:
1. Review rebuild error logs
2. Verify source data integrity
3. Check database connectivity
4. Retry rebuild after fixing underlying issues

### Diagnostic Commands

**Check Cache Status**:
```typescript
// WebSocket command
{
  type: ':prism.cache/status',
  payload: {}
}
```

**Monitor Redis Memory**:
```bash
docker exec redis redis-cli info memory
docker exec redis redis-cli monitor
```

**Check Neo4j Performance**:
```bash
docker exec neo4j cypher-shell "CALL dbms.listQueries();"
docker exec neo4j cypher-shell "CALL dbms.listConnections();"
```

## API Reference

### WebSocket Operations

#### Start Cache Rebuild
```typescript
{
  type: ':prism.cache/rebuild',
  payload: {}
}
```

#### Check Rebuild Status  
```typescript
{
  type: ':prism.cache/status',
  payload: {}
}
```

#### Progress Events (Broadcast)
```typescript
{
  type: ':prism.cache/event',
  payload: {
    status: 'rebuilding' | 'complete' | 'error',
    progress: number,
    message: string,
    timestamp: string,
    error?: string
  }
}
```

### Configuration Options

```bash
# Cache rebuild batch size
CACHE_BATCH_SIZE=5000

# Redis connection timeout
REDIS_TIMEOUT=5000

# Maximum rebuild duration (ms)  
CACHE_REBUILD_TIMEOUT=1800000  # 30 minutes

# Enable debug logging for cache operations
CACHE_DEBUG_LOGGING=true
```

## Maintenance Schedule

### Recommended Rebuild Frequency

**Production Environment**:
- **Monthly rebuilds** for routine maintenance
- **After significant data imports** or schema changes
- **When query performance degrades** noticeably

**Development Environment**:
- **As needed** during testing and development
- **After database resets** or major data changes
- **When testing cache-dependent features**

**Initial Setup**:
- **Required after initial data import**
- **Part of standard system initialization process**

### Monitoring and Alerting

Set up alerts for:
- Cache rebuild failures
- Unusually long rebuild times
- High memory usage during rebuilds
- Redis connectivity issues

Monitor these metrics:
- Cache hit rates before and after rebuilds
- Query response times
- System resource utilization
- Error rates in cache-dependent operations

## Future Enhancements

### Planned Improvements

1. **Incremental Cache Updates**: Update only changed entries rather than full rebuilds
2. **Selective Cache Rebuilds**: Rebuild only specific cache types
3. **Background Validation**: Continuous cache consistency checking
4. **Performance Analytics**: Detailed metrics on cache effectiveness
5. **Automated Scheduling**: Smart rebuild scheduling based on data change patterns

### Configuration Roadmap

Future configuration options under consideration:
- Cache warming strategies
- Partial rebuild capabilities  
- Performance tuning profiles
- Multi-region cache synchronization

---

For additional support or questions about cache management, refer to the main [Prism documentation](../README.md) or create an issue in the project repository.