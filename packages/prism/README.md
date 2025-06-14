# Prism Service

Prism is the system initialization, monitoring, and batch operations service for Systema Relica. It handles database seeding, bulk data import/export, cache management, and health monitoring across all services.

## Overview

Prism serves as the central orchestrator for system bootstrapping and maintenance operations. It provides:

- **System Initialization**: Complete setup flow with database checks, user creation, and data seeding
- **Batch Operations**: XLS→CSV→Neo4j data pipeline with UID resolution 
- **Cache Management**: Redis-based entity facts, lineage, and subtypes caching
- **Health Monitoring**: Service health aggregation and status reporting
- **WebSocket API**: Real-time status updates and command interface

## Architecture

### Core Components

```
┌─────────────────┐
│   WebSocket     │ ← Real-time communication
│    Gateway      │
└─────────────────┘
         │
┌─────────────────┐
│  Setup State    │ ← XState orchestration
│    Machine      │
└─────────────────┘
         │
┌─────────┬─────────┬─────────┐
│ Batch   │ Cache   │ Health  │
│ Service │ Service │ Service │
└─────────┴─────────┴─────────┘
         │
┌─────────────────┐
│   Neo4j &      │ ← Data persistence
│   Redis         │
└─────────────────┘
```

### State Machine Flow

The setup process follows a deterministic state machine:

```
idle → checking_db → awaiting_user_credentials → creating_admin_user 
  → seeding_db → building_caches → setup_complete
```

Each state handles specific responsibilities and can transition to error states with proper recovery mechanisms.

## Features

### System Initialization

- **Database Detection**: Automatically detects empty Neo4j instances
- **User Creation**: Creates admin users during setup
- **Data Seeding**: Processes XLS files and loads into Neo4j
- **Progress Tracking**: Real-time progress updates via WebSocket

### Batch Operations

- **XLS Processing**: Reads Excel files with header normalization
- **UID Resolution**: Resolves temporary UIDs (< 1000) to permanent ranges
- **CSV Generation**: Creates Neo4j-compatible CSV files
- **Bulk Loading**: Efficient LOAD CSV operations with retry logic

### Cache Management

- **Entity Facts Cache**: Caches fact-entity relationships
- **Lineage Cache**: Builds entity inheritance hierarchies  
- **Subtypes Cache**: Manages type-subtype relationships
- **Rebuilding**: On-demand cache reconstruction

### Health Monitoring

- **Service Health**: Monitors Neo4j, Redis, and dependent services
- **Status Aggregation**: Provides system-wide health overview
- **Connection Monitoring**: Tracks database connectivity

## Installation & Setup

### Prerequisites

- Node.js 20+
- Neo4j 5.12+ with APOC plugin
- Redis 6+
- Docker & Docker Compose (recommended)

### Environment Variables

```bash
# Database connections
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://redis:6379

# Service configuration
PRISM_PORT=3005
NODE_ENV=development

# Data directories
PRISM_SEED_XLS_DIR=/usr/src/app/seed_xls
PRISM_CSV_OUTPUT_DIR=/usr/src/app/seed_csv
PRISM_NEO4J_IMPORT_DIR=/var/lib/neo4j/import

# UID configuration (optional)
PRISM_MIN_FREE_UID=1000000000
PRISM_MIN_FREE_FACT_UID=2000000000
PRISM_MAX_TEMP_UID=1000
```

### Development Setup

```bash
# Install dependencies
yarn install

# Start in development mode
yarn start:dev

# Run tests
yarn test

# Type checking
yarn type-check

# Build for production
yarn build
```

### Docker Setup

```bash
# Build and start with Docker Compose
docker-compose up --build prism

# View logs
docker-compose logs -f prism
```

## API Documentation

### WebSocket API

Prism uses a WebSocket-first architecture for real-time communication. All message identifiers follow the `:component.resource/command` format.

#### Setup Operations

**Get Setup Status**
```typescript
// Request
{
  type: ':prism.setup/get-status',
  payload: {}
}

// Response
{
  success: true,
  data: {
    status: 'idle' | 'in_progress' | 'completed',
    stage: string | null,
    message: string,
    progress: number, // 0-100
    timestamp: string
  }
}
```

**Start Setup Process**
```typescript
// Request
{
  type: ':prism.setup/start',
  payload: {}
}

// Response
{
  success: true,
  data: {
    status: 'in_progress',
    stage: 'checking_db',
    message: 'Setup process started'
  }
}
```

**Create Admin User**
```typescript
// Request
{
  type: ':prism.setup/create-user',
  payload: {
    username: string,
    password: string
  }
}

// Response
{
  success: true,
  data: {
    status: 'in_progress',
    stage: 'seeding_db',
    message: 'Admin user created successfully'
  }
}
```

#### Cache Operations

**Rebuild Caches**
```typescript
// Request
{
  type: ':prism.cache/rebuild',
  payload: {}
}

// Response
{
  success: true,
  data: {
    status: 'rebuilding',
    message: 'Cache rebuild started'
  }
}
```

**Get Cache Status**
```typescript
// Request
{
  type: ':prism.cache/status',
  payload: {}
}

// Response
{
  success: true,
  data: {
    status: 'idle' | 'rebuilding' | 'complete' | 'error',
    progress: number,
    message?: string,
    error?: string
  }
}
```

#### Health Operations

**Get Service Health**
```typescript
// Request
{
  type: ':prism.health/status',
  payload: {}
}

// Response
{
  success: true,
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy',
    services: {
      neo4j: { status: string, message: string },
      redis: { status: string, message: string }
    }
  }
}
```

#### System Operations

**Heartbeat**
```typescript
// Request
{
  type: ':relica.app/heartbeat',
  payload: {
    timestamp: number
  }
}

// Response
{
  success: true,
  data: {
    receivedAt: number,
    serverTime: string
  }
}
```

### REST Endpoints

Limited REST API for basic operations:

- `GET /` - Service information
- `GET /status` - Service status
- `GET /setup/status` - Setup status
- `POST /setup/start` - Start setup (redirects to WebSocket)
- `POST /setup/create-user` - Create user (redirects to WebSocket)

## Data Processing

### XLS File Format

Prism expects XLS files with the following structure:

```
Row 1: Headers (ignored)
Row 2: Column IDs (used as CSV headers)
Row 3: Data types (ignored)
Row 4+: Data rows
```

### Column Processing

- **Column 2 (lh_object_uid)**: Left-hand object UID
- **Column 15 (rh_object_uid)**: Right-hand object UID  
- **Column 60 (rel_type_uid)**: Relationship type UID
- **Column 1 (fact_uid)**: Fact UID
- **Columns 9,10**: Date columns (auto-formatted)
- **All columns**: Comma removal from numeric strings

### UID Resolution

Temporary UIDs (< 1000) are automatically resolved:

- **Entity UIDs**: Start from `PRISM_MIN_FREE_UID` (default: 1,000,000,000)
- **Fact UIDs**: Start from `PRISM_MIN_FREE_FACT_UID` (default: 2,000,000,000)
- **Mapping**: Maintained across all files in a batch

### Neo4j Loading

Two-phase loading process:

1. **Nodes**: `MERGE (lh:Entity {uid: ...}) MERGE (rh:Entity {uid: ...})`
2. **Relationships**: Create Fact nodes and relationships

## Cache Management

### Cache Types

**Entity Facts Cache**
- Maps entities to their associated facts
- Improves fact retrieval performance
- Rebuilt from Archivist data

**Entity Lineage Cache**  
- Stores inheritance hierarchies
- Enables fast subtype queries
- Built from relationship types 1146, 1726

**Subtypes Cache**
- Maps types to all their subtypes
- Optimizes taxonomy queries  
- Derived from lineage data

### Rebuild Process

1. **Facts Cache**: Query facts in batches, build entity mappings
2. **Lineage Cache**: Process hierarchy relationships, build trees
3. **Subtypes Cache**: Traverse lineage trees, map descendants

Rebuilds are atomic - either all succeed or all are rolled back.

## Monitoring & Observability

### Health Checks

- **Neo4j**: Connection test with simple query
- **Redis**: Ping test and basic operations
- **Application**: Memory usage and request metrics

### Logging

Structured logging with levels:
- **INFO**: Normal operations, state changes
- **WARN**: Recoverable errors, retries
- **ERROR**: Failed operations, system issues
- **DEBUG**: Detailed execution traces

### Metrics

Key metrics tracked:
- Setup completion times
- Batch processing rates
- Cache rebuild durations
- Health check response times

## Configuration

### Performance Tuning

```typescript
// Neo4j batch sizes
NEO4J_BATCH_SIZE=1000

// Cache rebuild batching
CACHE_BATCH_SIZE=5000

// Connection timeouts
NEO4J_TIMEOUT=30000
REDIS_TIMEOUT=5000
```

### Development Options

```typescript
// Enable debug logging
LOG_LEVEL=debug

// Skip cache building in development
SKIP_CACHE_BUILD=true

// Use test data directories
PRISM_SEED_XLS_DIR=./test/fixtures
```

## Testing

### Test Categories

**Unit Tests**
```bash
yarn test
```

**Integration Tests**
```bash
yarn test:e2e
```

**Type Checking**
```bash
yarn type-check
```

### Test Structure

```
test/
├── unit/           # Pure unit tests
├── integration/    # Service integration tests
├── fixtures/       # Test data files
└── helpers/        # Test utilities
```

## Deployment

### Production Considerations

- **Resource Allocation**: 2GB RAM minimum for large datasets
- **Storage**: Ensure sufficient disk space for CSV files
- **Network**: Low latency to Neo4j and Redis
- **Monitoring**: Set up health check alerts

### Security

- **Environment Variables**: Never commit secrets
- **WebSocket Security**: Authentication required for all operations
- **Data Access**: Restrict file system access to data directories
- **Logging**: Sanitize sensitive data in logs

## Troubleshooting

### Common Issues

**Setup Fails at Database Check**
- Verify Neo4j is running and accessible
- Check authentication credentials
- Ensure APOC plugin is installed

**XLS Processing Errors**
- Verify file format matches expected structure
- Check for unsupported Excel features
- Ensure files are readable and not corrupted

**Cache Rebuild Timeouts**
- Increase timeout values for large datasets
- Check available system memory
- Verify Redis connectivity

**WebSocket Connection Issues**
- Check network connectivity
- Verify port 3005 is accessible
- Review firewall settings

### Performance Issues

**Slow Batch Processing**
- Increase batch sizes for better throughput
- Check Neo4j query performance
- Monitor system resource usage

**Cache Rebuild Slowness**
- Optimize Redis configuration
- Increase memory allocation
- Consider smaller batch sizes

## Contributing

### Development Workflow

1. Create feature branch from `develop-ts`
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Conventional commit messages
- Comprehensive error handling

## Related Documentation

- [WebSocket API Reference](./docs/websocket-api.md)
- [Cache Management Guide](./docs/cache-management.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Overview](../../docs/architecture.md)

## Support

For issues and questions:
- Create GitHub issues for bugs
- Use discussions for questions
- Check logs for error details
- Review this documentation first

---

**Port**: 3005  
**Protocol**: WebSocket (primary), HTTP (secondary)  
**Dependencies**: Neo4j, Redis  
**Language**: TypeScript/NestJS  
**Status**: Active Development