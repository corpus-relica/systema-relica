# 📡 WebSocket API Reference

This document provides comprehensive documentation for the Archivist WebSocket API, including all 39 available handlers and their message formats.

## 🔌 Connection

### Establishing Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  upgrade: false,
  rememberUpgrade: false
});

socket.on('connect', () => {
  console.log('Connected to Archivist:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### Connection Events

```javascript
// Connection established
socket.on('connection:established', (data) => {
  console.log('Client ID:', data.clientId);
  console.log('Service:', data.server);
  console.log('Available handlers:', data.capabilities);
});

// Error handling
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## 💊 Health & Diagnostics

### Health Check

**Event**: `health`
**Response**: `health:status`

```javascript
// Request
socket.emit('health');

// Response
socket.on('health:status', (data) => {
  console.log({
    status: data.status,           // 'healthy'
    service: data.service,         // 'archivist'
    timestamp: data.timestamp,     // Unix timestamp
    handlers: data.handlers        // Array of available handler names
  });
});
```

### Ping/Pong

**Event**: `ping`
**Response**: `pong`

```javascript
// Request
socket.emit('ping');

// Response  
socket.on('pong', (data) => {
  console.log({
    timestamp: data.timestamp,     // Server timestamp
    latency: Date.now() - data.timestamp
  });
});
```

## 📝 Fact Operations

### Create Fact

**Event**: `fact:create`
**Response**: `fact:created` | `fact:error`

```javascript
// Request
socket.emit('fact:create', {
  lh_object_uid: 123456,
  lh_object_name: 'Car',
  rel_type_uid: 1146,
  rel_type_name: 'is a specialization of',
  rh_object_uid: 789012,
  rh_object_name: 'Vehicle',
  partial_definition: 'A car is a vehicle designed for transportation',
  full_definition: 'A car is a motor vehicle with four wheels designed for passenger transportation on roads',
  language_uid: 910036,
  language: 'English',
  sequence: 1
});

// Success Response
socket.on('fact:created', (result) => {
  console.log('Fact created:', result);
});

// Error Response
socket.on('fact:error', (error) => {
  console.error('Fact operation failed:', error.message);
});
```

### Retrieve Facts

**Event**: `fact:get`
**Response**: `fact:retrieved` | `fact:error`

```javascript
// Request
socket.emit('fact:get', {
  uid: 123456,
  includeRelated: true,
  maxDepth: 2
});

// Response
socket.on('fact:retrieved', (facts) => {
  console.log('Retrieved facts:', facts);
});
```

### Update Fact

**Event**: `fact:update`
**Response**: `fact:updated` | `fact:error`

```javascript
// Request
socket.emit('fact:update', {
  fact_uid: 789012,
  updates: {
    partial_definition: 'Updated definition',
    full_definition: 'Updated full definition'
  }
});

// Response
socket.on('fact:updated', (result) => {
  console.log('Fact updated:', result);
});
```

### Delete Fact

**Event**: `fact:delete`
**Response**: `fact:deleted` | `fact:error`

```javascript
// Request
socket.emit('fact:delete', {
  fact_uid: 789012
});

// Response
socket.on('fact:deleted', (result) => {
  console.log('Fact deleted:', result);
});
```

### Get Subtypes

**Event**: `fact:getSubtypes`
**Response**: `fact:subtypes` | `fact:error`

```javascript
// Request
socket.emit('fact:getSubtypes', {
  uid: 123456,
  includeSubtypes: true
});

// Response
socket.on('fact:subtypes', (subtypes) => {
  console.log('Subtypes:', subtypes);
});
```

### Get Supertypes

**Event**: `fact:getSupertypes`
**Response**: `fact:supertypes` | `fact:error`

```javascript
// Request
socket.emit('fact:getSupertypes', {
  uid: 123456,
  includeSubtypes: true
});

// Response
socket.on('fact:supertypes', (supertypes) => {
  console.log('Supertypes:', supertypes);
});
```

### Get Classified Entities

**Event**: `fact:getClassified`
**Response**: `fact:classified` | `fact:error`

```javascript
// Request
socket.emit('fact:getClassified', {
  uid: 123456
});

// Response
socket.on('fact:classified', (classified) => {
  console.log('Classified entities:', classified);
});
```

### Validate Fact

**Event**: `fact:validate`
**Response**: `fact:validated` | `fact:error`

```javascript
// Request
socket.emit('fact:validate', {
  lh_object_uid: 123456,
  rel_type_uid: 1146,
  rh_object_uid: 789012
});

// Response
socket.on('fact:validated', (result) => {
  console.log('Validation result:', result);
});
```

## 🔍 Search Operations

### General Search

**Event**: `search:general`
**Response**: `search:general:results` | `search:error`

```javascript
// Request
socket.emit('search:general', {
  query: 'automobile',
  page: 1,
  limit: 20,
  exactMatch: false
});

// Response
socket.on('search:general:results', (results) => {
  console.log('Search results:', {
    facts: results.facts,
    totalCount: results.totalCount,
    page: results.page,
    hasMore: results.hasMore
  });
});
```

### Individual Search

**Event**: `search:individual`
**Response**: `search:individual:results` | `search:error`

```javascript
// Request
socket.emit('search:individual', {
  query: 'specific entity name',
  page: 1,
  limit: 10
});

// Response
socket.on('search:individual:results', (results) => {
  console.log('Individual search results:', results);
});
```

### Kind Search

**Event**: `search:kind`
**Response**: `search:kind:results` | `search:error`

```javascript
// Request
socket.emit('search:kind', {
  query: 'vehicle types',
  page: 1,
  limit: 15
});

// Response
socket.on('search:kind:results', (results) => {
  console.log('Kind search results:', results);
});
```

### Execute Search Query

**Event**: `search:execute`
**Response**: `search:execute:results` | `search:error`

```javascript
// Request
socket.emit('search:execute', {
  query: 'complex search query',
  parameters: {
    relTypeUIDs: [1146, 1726],
    filterUIDs: [730000],
    exactMatch: false
  }
});

// Response
socket.on('search:execute:results', (results) => {
  console.log('Execute search results:', results);
});
```

### UID Search

**Event**: `search:uid`
**Response**: `search:uid:results` | `search:error`

```javascript
// Request
socket.emit('search:uid', {
  uid: 123456
});

// Response
socket.on('search:uid:results', (results) => {
  console.log('UID search results:', results);
});
```

## 🔎 Query Operations

### Execute Query

**Event**: `query:execute`
**Response**: `query:results` | `query:error`

```javascript
// Request - Gellish query format
socket.emit('query:execute', {
  query: [
    {
      lh_object_uid: 1,
      lh_object_name: '?entity',
      rel_type_uid: 1146,
      rel_type_name: 'is a specialization of',
      rh_object_uid: 123456,
      rh_object_name: 'Vehicle'
    },
    {
      lh_object_uid: 1,
      lh_object_name: '?entity',
      rel_type_uid: 1225,
      rel_type_name: 'is classified as a',
      rh_object_uid: 2,
      rh_object_name: '?kind'
    }
  ]
});

// Response
socket.on('query:results', (results) => {
  console.log({
    facts: results.facts,
    groundingFacts: results.groundingFacts,
    vars: results.vars,
    totalCount: results.totalCount
  });
});
```

### Validate Query

**Event**: `query:validate`
**Response**: `query:validated` | `query:error`

```javascript
// Request
socket.emit('query:validate', {
  query: [/* Gellish query facts */]
});

// Response
socket.on('query:validated', (result) => {
  console.log({
    valid: result.valid,
    message: result.message,
    errors: result.errors || []
  });
});
```

### Parse Query

**Event**: `query:parse`
**Response**: `query:parsed` | `query:error`

```javascript
// Request
socket.emit('query:parse', {
  query: 'natural language query or Gellish text'
});

// Response
socket.on('query:parsed', (result) => {
  console.log({
    parsed: result.parsed,
    message: result.message,
    structure: result.structure
  });
});
```

## ✅ Validation Operations

### Validate Single Fact

**Event**: `validation:validate`
**Response**: `validation:result` | `validation:error`

```javascript
// Request
socket.emit('validation:validate', {
  fact: {
    lh_object_uid: 123456,
    rel_type_uid: 1146,
    rh_object_uid: 789012,
    partial_definition: 'Test definition'
  }
});

// Response
socket.on('validation:result', (result) => {
  console.log({
    valid: result.valid,
    errors: result.errors || [],
    warnings: result.warnings || [],
    suggestions: result.suggestions || []
  });
});
```

### Validate Fact Collection

**Event**: `validation:collection`
**Response**: `validation:collection:result` | `validation:error`

```javascript
// Request
socket.emit('validation:collection', {
  facts: [
    { /* fact 1 */ },
    { /* fact 2 */ },
    { /* fact 3 */ }
  ]
});

// Response
socket.on('validation:collection:result', (results) => {
  console.log('Batch validation results:', results);
  results.forEach((result, index) => {
    console.log(`Fact ${index}:`, result);
  });
});
```

## 💡 Completion Operations

### Get Completions

**Event**: `completion:request`
**Response**: `completion:results` | `completion:error`

```javascript
// Request
socket.emit('completion:request', {
  query: 'vehic',
  context: {
    domain: 'transportation',
    maxSuggestions: 10
  }
});

// Response
socket.on('completion:results', (results) => {
  console.log('Completion suggestions:', results);
});
```

### Get Entity Completions

**Event**: `completion:entities`
**Response**: `completion:entities:results` | `completion:error`

```javascript
// Request
socket.emit('completion:entities', {
  query: 'car'
});

// Response
socket.on('completion:entities:results', (results) => {
  console.log('Entity completions:', results);
});
```

### Get Relation Completions

**Event**: `completion:relations`
**Response**: `completion:relations:results` | `completion:error`

```javascript
// Request
socket.emit('completion:relations', {
  query: 'is a'
});

// Response
socket.on('completion:relations:results', (results) => {
  console.log('Relation completions:', results);
});
```

## 🧩 Concept Operations

### Get Concept

**Event**: `concept:get`
**Response**: `concept:retrieved` | `concept:error`

```javascript
// Request
socket.emit('concept:get', {
  uid: 123456
});

// Response
socket.on('concept:retrieved', (concept) => {
  console.log('Concept details:', concept);
});
```

### Create Concept

**Event**: `concept:create`
**Response**: `concept:created` | `concept:error`

```javascript
// Request
socket.emit('concept:create', {
  data: {
    name: 'New Concept',
    definition: 'Definition of the new concept',
    supertypes: [123456],
    properties: {}
  }
});

// Response
socket.on('concept:created', (result) => {
  console.log('Concept created:', result);
});
```

### Update Concept

**Event**: `concept:update`
**Response**: `concept:updated` | `concept:error`

```javascript
// Request
socket.emit('concept:update', {
  uid: 123456,
  data: {
    definition: 'Updated definition',
    properties: { color: 'blue' }
  }
});

// Response
socket.on('concept:updated', (result) => {
  console.log('Concept updated:', result);
});
```

### Delete Concept

**Event**: `concept:delete`
**Response**: `concept:deleted` | `concept:error`

```javascript
// Request
socket.emit('concept:delete', {
  uid: 123456
});

// Response
socket.on('concept:deleted', (result) => {
  console.log('Concept deleted:', result);
});
```

## 📖 Definition Operations

### Get Definition

**Event**: `definition:get`
**Response**: `definition:retrieved` | `definition:error`

```javascript
// Request
socket.emit('definition:get', {
  uid: 123456
});

// Response
socket.on('definition:retrieved', (definition) => {
  console.log('Definition:', definition);
});
```

### Update Definition

**Event**: `definition:update`
**Response**: `definition:updated` | `definition:error`

```javascript
// Request
socket.emit('definition:update', {
  uid: 123456,
  definition: 'Updated definition text'
});

// Response
socket.on('definition:updated', (result) => {
  console.log('Definition updated:', result);
});
```

## 🏷️ Kind Operations

### Get Kind

**Event**: `kind:get`
**Response**: `kind:retrieved` | `kind:error`

```javascript
// Request
socket.emit('kind:get', {
  uid: 123456
});

// Response
socket.on('kind:retrieved', (kind) => {
  console.log('Kind details:', kind);
});
```

### List Kinds

**Event**: `kinds:list`
**Response**: `kinds:list` | `kind:error`

```javascript
// Request
socket.emit('kinds:list', {
  sortField: 'lh_object_name',
  sortOrder: 'ASC',
  skip: 0,
  pageSize: 20
});

// Response
socket.on('kinds:list', (result) => {
  console.log({
    data: result.data,
    total: result.total
  });
});
```

### Search Kinds

**Event**: `kinds:search`
**Response**: `kinds:search:results` | `kind:error`

```javascript
// Request
socket.emit('kinds:search', {
  query: 'vehicle',
  filters: {
    domain: 'transportation'
  }
});

// Response
socket.on('kinds:search:results', (results) => {
  console.log('Kind search results:', results);
});
```

## 📊 Submission Operations

### Submit Facts

**Event**: `submission:submit`
**Response**: `submission:completed` | `submission:error`

```javascript
// Request
socket.emit('submission:submit', {
  facts: [
    { /* fact 1 */ },
    { /* fact 2 */ }
  ],
  metadata: {
    source: 'user_input',
    timestamp: Date.now(),
    validation: true
  }
});

// Response
socket.on('submission:completed', (result) => {
  console.log('Submission completed:', result);
});
```

### Batch Submit Facts

**Event**: `submission:batch`
**Response**: `submission:batch:completed` | `submission:error`

```javascript
// Request
socket.emit('submission:batch', {
  facts: [/* large array of facts */],
  metadata: {
    batchSize: 100,
    source: 'bulk_import'
  }
});

// Response
socket.on('submission:batch:completed', (result) => {
  console.log('Batch submission completed:', result);
});
```

## 🔄 Transaction Operations

### Start Transaction

**Event**: `transaction:start`
**Response**: `transaction:started` | `transaction:error`

```javascript
// Request
socket.emit('transaction:start', {});

// Response
socket.on('transaction:started', (transaction) => {
  console.log('Transaction started:', transaction);
});
```

### Commit Transaction

**Event**: `transaction:commit`
**Response**: `transaction:committed` | `transaction:error`

```javascript
// Request
socket.emit('transaction:commit', {
  transaction_id: 'txn_123456'
});

// Response
socket.on('transaction:committed', (result) => {
  console.log('Transaction committed:', result);
});
```

### Rollback Transaction

**Event**: `transaction:rollback`
**Response**: `transaction:rolledback` | `transaction:error`

```javascript
// Request
socket.emit('transaction:rollback', {
  transaction_id: 'txn_123456'
});

// Response
socket.on('transaction:rolledback', (result) => {
  console.log('Transaction rolled back:', result);
});
```

### Get Transaction

**Event**: `transaction:get`
**Response**: `transaction:retrieved` | `transaction:error`

```javascript
// Request
socket.emit('transaction:get', {
  transaction_id: 'txn_123456'
});

// Response
socket.on('transaction:retrieved', (transaction) => {
  console.log('Transaction details:', transaction);
});
```

## 🔢 UID Operations

### Generate UID

**Event**: `uid:generate`
**Response**: `uid:generated` | `uid:error`

```javascript
// Request
socket.emit('uid:generate', {
  type: 'entity'
});

// Response
socket.on('uid:generated', (result) => {
  console.log('Generated UID:', result);
});
```

### Generate Batch UIDs

**Event**: `uid:batch`
**Response**: `uid:batch:generated` | `uid:error`

```javascript
// Request
socket.emit('uid:batch', {
  count: 10,
  type: 'fact'
});

// Response
socket.on('uid:batch:generated', (results) => {
  console.log('Batch UIDs:', results);
});
```

### Reserve UID Range

**Event**: `uid:reserve`
**Response**: `uid:range:reserved` | `uid:error`

```javascript
// Request
socket.emit('uid:reserve', {
  count: 100
});

// Response
socket.on('uid:range:reserved', (range) => {
  console.log('Reserved UID range:', range);
});
```

## 🚨 Error Handling

All handlers can return error responses in a consistent format:

```javascript
socket.on('[handler]:error', (error) => {
  console.error({
    event: error.event,        // Original event that failed
    message: error.message,    // Error description
    code: error.code,          // Error code (if available)
    details: error.details     // Additional error context
  });
});
```

### Common Error Codes

- `VALIDATION_ERROR`: Input data failed validation
- `NOT_FOUND`: Requested entity does not exist
- `PERMISSION_DENIED`: Insufficient permissions
- `DATABASE_ERROR`: Database operation failed
- `NETWORK_ERROR`: Network connectivity issue
- `TIMEOUT`: Operation exceeded time limit
- `MALFORMED_REQUEST`: Invalid message format

## 📊 Rate Limiting

The WebSocket API implements rate limiting to prevent abuse:

- **Connection limit**: 100 connections per IP per minute
- **Message limit**: 1000 messages per connection per minute
- **Query limit**: 100 complex queries per connection per minute

Rate limit headers are included in error responses:

```javascript
{
  event: 'rate_limit_exceeded',
  message: 'Rate limit exceeded',
  details: {
    limit: 1000,
    remaining: 0,
    resetTime: 1640995200000
  }
}
```

## 🔌 Connection Management

### Reconnection Strategy

```javascript
const socket = io('ws://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection failed:', error);
});
```

### Graceful Shutdown

```javascript
// Clean disconnect
socket.disconnect();

// Or with callback
socket.disconnect(() => {
  console.log('Disconnected gracefully');
});
```

---

**For more information, see the [Archivist Service Documentation](../README.md)**