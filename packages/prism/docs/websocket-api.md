# Prism WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Prism component of the Systema Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `prism`)
- `resource` is the entity or concept being operated on (e.g., `setup`, `cache`)
- `command` is the action being performed (e.g., `get-status`, `start`, `rebuild`)

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **Setup Operations**: Operations related to system setup and initialization
3. **Cache Operations**: Operations related to cache management and rebuilding
4. **Health Operations**: Operations related to service health monitoring
5. **System Operations**: Operations related to application status and connection management (common across modules)
6. **Broadcast Events**: Messages sent to all connected clients

## Message Reference Overview

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/get-status` | Get the current setup status |
| `:prism.cache/status` | Get the current cache rebuild status |
| `:prism.health/status` | Get overall service health status |
| `:prism.health/neo4j` | Get Neo4j connection health |
| `:prism.health/cache` | Get Redis cache health |

### Setup Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/start` | Start the setup sequence |
| `:prism.setup/create-user` | Create an admin user during setup |

### Cache Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.cache/rebuild` | Start cache rebuild process |

### Health Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.health/status` | Get aggregated service health |
| `:prism.health/neo4j` | Get Neo4j database health |
| `:prism.health/cache` | Get Redis cache health |

### System Operations (Common across modules)

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |

### Broadcast Events

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/event` | Setup status update event |
| `:prism.cache/event` | Cache rebuild progress event |

## Individual Message Documentation

---

## `:prism.setup/get-status`

**Type:** Query  
**Component:** Prism  
**Resource:** Setup  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'idle' | 'checking_db' | 'awaiting_user_credentials' | 'creating_admin_user' | 
            'seeding_db' | 'building_caches' | 'setup_complete' | 'error',
    stage: string | null,
    message: string,
    progress: number, // 0-100
    error?: string,
    timestamp: string
  }
}
```

### Description

Retrieves the current status of the system setup process. This includes information about the setup progress, current stage, and any error messages.

### Examples

```typescript
// Example request
{
  type: ':prism.setup/get-status',
  payload: {}
}

// Example success response (setup not started)
{
  success: true,
  data: {
    status: 'idle',
    stage: null,
    message: 'Idle',
    progress: 0,
    timestamp: '2025-06-14T17:15:52.738Z'
  }
}

// Example success response (setup in progress)
{
  success: true,
  data: {
    status: 'checking_db',
    stage: 'checking_db',
    message: 'Checking database status...',
    progress: 20,
    timestamp: '2025-06-14T17:16:15.234Z'
  }
}

// Example success response (setup completed)
{
  success: true,
  data: {
    status: 'setup_complete',
    stage: null,
    message: 'Setup completed successfully',
    progress: 100,
    timestamp: '2025-06-14T17:18:42.567Z'
  }
}
```

---

## `:prism.setup/start`

**Type:** Command  
**Component:** Prism  
**Resource:** Setup  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: string,
    stage: string,
    message: string,
    progress: number
  },
  error?: {
    code: string,
    message: string
  }
}
```

### Description

Initiates the system setup process. This command will start the setup sequence and transition the system from 'idle' to 'checking_db' state.

### Examples

```typescript
// Example request
{
  type: ':prism.setup/start',
  payload: {}
}

// Example success response
{
  success: true,
  data: {
    status: 'checking_db',
    stage: 'checking_db',
    message: 'Starting database check...',
    progress: 10
  }
}

// Example error response (setup already in progress)
{
  success: false,
  error: {
    code: 'setup_already_in_progress',
    message: 'Setup is already in progress'
  }
}
```

---

## `:prism.setup/create-user`

**Type:** Command  
**Component:** Prism  
**Resource:** Setup  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  username: string,
  password: string
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: string,
    stage: string,
    message: string,
    progress: number
  },
  error?: {
    code: string,
    message: string
  }
}
```

### Description

Creates an administrator user during the system setup process. This command is only valid when the setup is in the 'awaiting_user_credentials' state.

### Examples

```typescript
// Example request
{
  type: ':prism.setup/create-user',
  payload: {
    username: 'admin',
    password: 'securePassword123'
  }
}

// Example success response
{
  success: true,
  data: {
    status: 'creating_admin_user',
    stage: 'creating_admin_user',
    message: 'Creating admin user...',
    progress: 60
  }
}

// Example error response
{
  success: false,
  error: {
    code: 'invalid_credentials',
    message: 'Username and password are required'
  }
}
```

---

## `:prism.cache/rebuild`

**Type:** Command  
**Component:** Prism  
**Resource:** Cache  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'rebuilding' | 'complete' | 'error',
    message: string
  },
  error?: {
    code: string,
    message: string
  }
}
```

### Description

Initiates a cache rebuild process for entity facts, lineage, and subtypes caches. This is a long-running operation that will send progress updates via broadcast events.

### Examples

```typescript
// Example request
{
  type: ':prism.cache/rebuild',
  payload: {}
}

// Example success response
{
  success: true,
  data: {
    status: 'rebuilding',
    message: 'Cache rebuild started'
  }
}

// Example error response
{
  success: false,
  error: {
    code: 'rebuild_already_in_progress',
    message: 'Cache rebuild is already in progress'
  }
}
```

---

## `:prism.cache/status`

**Type:** Query  
**Component:** Prism  
**Resource:** Cache  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'idle' | 'rebuilding' | 'complete' | 'error',
    progress: number, // 0-100
    message?: string,
    error?: string
  }
}
```

### Description

Retrieves the current status of cache rebuild operations, including progress information for ongoing rebuilds.

### Examples

```typescript
// Example request
{
  type: ':prism.cache/status',
  payload: {}
}

// Example success response (rebuilding)
{
  success: true,
  data: {
    status: 'rebuilding',
    progress: 45,
    message: 'Building entity lineage cache...'
  }
}

// Example success response (idle)
{
  success: true,
  data: {
    status: 'idle',
    progress: 0
  }
}
```

---

## `:prism.health/status`

**Type:** Query  
**Component:** Prism  
**Resource:** Health  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy',
    services: {
      neo4j: {
        status: 'healthy' | 'unhealthy',
        message: string,
        responseTime?: number
      },
      redis: {
        status: 'healthy' | 'unhealthy', 
        message: string,
        responseTime?: number
      }
    },
    uptime: number,
    timestamp: string
  }
}
```

### Description

Retrieves the overall health status of the Prism service and its dependencies (Neo4j and Redis).

### Examples

```typescript
// Example request
{
  type: ':prism.health/status',
  payload: {}
}

// Example success response
{
  success: true,
  data: {
    status: 'healthy',
    services: {
      neo4j: {
        status: 'healthy',
        message: 'Connected successfully',
        responseTime: 15
      },
      redis: {
        status: 'healthy',
        message: 'Connected successfully', 
        responseTime: 8
      }
    },
    uptime: 3600000,
    timestamp: '2025-06-14T17:30:00.000Z'
  }
}
```

---

## `:prism.health/neo4j`

**Type:** Query  
**Component:** Prism  
**Resource:** Health  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'healthy' | 'unhealthy',
    message: string,
    responseTime?: number,
    version?: string,
    database?: string
  }
}
```

### Description

Performs a specific health check on the Neo4j database connection.

---

## `:prism.health/cache`

**Type:** Query  
**Component:** Prism  
**Resource:** Health  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  // No required fields
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    status: 'healthy' | 'unhealthy',
    message: string,
    responseTime?: number,
    memory?: {
      used: number,
      peak: number
    }
  }
}
```

### Description

Performs a specific health check on the Redis cache connection.

---

## `:relica.app/heartbeat`

**Type:** Command  
**Component:** Relica (Common)  
**Resource:** App  
**Direction:** Client→Server

### Payload Schema

```typescript
{
  timestamp: number
}
```

### Response

```typescript
{
  success: boolean,
  data: {
    receivedAt: number,
    serverTime: string
  }
}
```

### Description

Sends a heartbeat message to maintain the WebSocket connection and verify that both client and server are still active.

### Examples

```typescript
// Example request
{
  type: ':relica.app/heartbeat',
  payload: {
    timestamp: 1718384400000
  }
}

// Example success response
{
  success: true,
  data: {
    receivedAt: 1718384400050,
    serverTime: '2025-06-14T17:40:00Z'
  }
}
```

---

## Broadcast Events

### `:prism.setup/event`

**Type:** Broadcast Event  
**Component:** Prism  
**Resource:** Setup  
**Direction:** Server→All Clients

### Payload Schema

```typescript
{
  status: string,
  stage: string | null,
  message: string,
  progress: number,
  timestamp: string,
  error?: string
}
```

### Description

Broadcast event sent to all connected clients when the setup status changes. Allows clients to receive real-time updates about the setup process.

### Examples

```typescript
// Setup started event
{
  type: ':prism.setup/event',
  payload: {
    status: 'checking_db',
    stage: 'checking_db', 
    message: 'Checking database status...',
    progress: 10,
    timestamp: '2025-06-14T17:15:00.000Z'
  }
}

// Setup progress event
{
  type: ':prism.setup/event',
  payload: {
    status: 'seeding_db',
    stage: 'seeding_db',
    message: 'Importing data from XLS files...',
    progress: 70,
    timestamp: '2025-06-14T17:17:30.000Z'
  }
}

// Setup completed event
{
  type: ':prism.setup/event',
  payload: {
    status: 'setup_complete',
    stage: null,
    message: 'Setup completed successfully',
    progress: 100,
    timestamp: '2025-06-14T17:18:00.000Z'
  }
}
```

### `:prism.cache/event`

**Type:** Broadcast Event  
**Component:** Prism  
**Resource:** Cache  
**Direction:** Server→All Clients

### Payload Schema

```typescript
{
  status: 'rebuilding' | 'complete' | 'error',
  progress: number,
  message: string,
  timestamp: string,
  error?: string
}
```

### Description

Broadcast event sent during cache rebuild operations to provide real-time progress updates.

### Examples

```typescript
// Cache rebuild progress
{
  type: ':prism.cache/event',
  payload: {
    status: 'rebuilding',
    progress: 33,
    message: 'Building entity facts cache...',
    timestamp: '2025-06-14T17:20:00.000Z'
  }
}

// Cache rebuild completed
{
  type: ':prism.cache/event',
  payload: {
    status: 'complete',
    progress: 100,
    message: 'Cache rebuild completed successfully',
    timestamp: '2025-06-14T17:21:30.000Z'
  }
}
```

## Implementation Notes

### Message Handling

All messages follow a standard request-response pattern, where the client sends a message with a specific type and payload, and the server responds with a standardized result format.

### Error Handling

When an operation fails, the server will respond with an error object containing:
- `code`: A machine-readable error code
- `message`: A human-readable error message

Common error codes:
- `invalid_state`: Operation not valid in current state
- `validation_error`: Invalid input data
- `system_error`: Internal system error
- `timeout`: Operation timed out
- `connection_error`: Database connection failed

### Response Format

All responses follow a standard format:

```typescript
{
  success: boolean,
  data?: any,     // Present when success is true
  error?: {       // Present when success is false
    code: string,
    message: string
  }
}
```

### Performance Considerations

- **Heartbeat Interval**: Recommended 30 seconds
- **Long Operations**: Setup and cache rebuild operations may take several minutes
- **Broadcast Events**: Used for real-time progress updates
- **Connection Management**: Auto-reconnection handled by client

### Security

- All operations require authenticated WebSocket connections
- Sensitive data (passwords) are not logged
- Setup operations are restricted during active setup process
- Health checks provide limited system information