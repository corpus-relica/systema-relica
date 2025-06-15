# 🗃️ Archivist Service

**Core fact storage and graph operations service for the Systema Relica ecosystem**

Archivist is a specialized WebSocket-only service that focuses exclusively on fact storage, Neo4j graph operations, and semantic modeling using the Gellish language. It serves as the foundational data layer for knowledge representation and retrieval.

## 🎯 Purpose

The Archivist service is responsible for:

- **Fact Storage**: Core CRUD operations for Gellish facts in Neo4j
- **Graph Traversal**: Semantic graph navigation and relationship queries  
- **Search & Query**: Text-based and UID-based fact discovery
- **Validation**: Semantic validation of facts and relationships
- **Caching**: Redis-backed performance optimization
- **Real-time Communication**: WebSocket-only API for all operations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Archivist Service                        │
│                   (WebSocket Only)                          │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Gateway (39 Handlers)                           │
│  ├── Fact Operations    ├── Search & Discovery             │
│  ├── Query Processing   ├── Validation & Completion        │
│  ├── Transaction Mgmt   └── UID Management                 │
├─────────────────────────────────────────────────────────────┤
│  Basis Namespace (Graph Traversal)                         │
│  ├── Core: Relations & Type Expansion                      │
│  ├── Cone: Descendant Hierarchies                          │
│  ├── Lineage: Ancestor Inheritance                         │
│  └── Relation: Role-based Semantics                        │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                              │
│  ├── GraphService (Neo4j)  ├── CacheService (Redis)        │
│  ├── FactService (CRUD)    ├── ValidationService           │
│  └── QueryService (Gellish) └── LinearizationService       │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── Neo4j Graph Database  └── Redis Cache                 │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Neo4j 5.x
- Redis 6+
- yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configurations
```

### Configuration

Create a `.env` file with the following configuration:

```env
# Neo4j Configuration
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Redis Configuration  
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# PostgreSQL Configuration (for auxiliary data)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=archivist

# Service Configuration
PORT=3000
NODE_ENV=development
```

### Running the Service

```bash
# Development mode with hot reload
yarn start:dev

# Production mode
yarn build
yarn start:prod

# Debug mode
yarn start:debug
```

## 📡 WebSocket API

The Archivist service exposes a WebSocket-only API with 39 different handlers organized by domain:

### Connection & Health

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000');

// Health check
socket.emit('health');
socket.on('health:status', (data) => {
  console.log('Service status:', data.status);
  console.log('Available handlers:', data.handlers);
});

// Ping/pong
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Latency:', Date.now() - data.timestamp);
});
```

### Fact Operations

```javascript
// Create a fact
socket.emit('fact:create', {
  lh_object_uid: 123456,
  lh_object_name: 'Car',
  rel_type_uid: 1146,
  rel_type_name: 'is a specialization of',
  rh_object_uid: 789012,
  rh_object_name: 'Vehicle',
  partial_definition: 'A car is a vehicle...',
  full_definition: 'A car is a motor vehicle with four wheels...'
});

socket.on('fact:created', (result) => {
  console.log('Fact created:', result);
});

// Query facts
socket.emit('fact:get', { uid: 123456 });
socket.on('fact:retrieved', (facts) => {
  console.log('Retrieved facts:', facts);
});

// Delete fact
socket.emit('fact:delete', { fact_uid: 789012 });
socket.on('fact:deleted', (result) => {
  console.log('Fact deleted:', result);
});
```

### Search Operations

```javascript
// General text search
socket.emit('search:general', {
  query: 'automobile',
  page: 1,
  limit: 20
});

socket.on('search:general:results', (results) => {
  console.log('Search results:', results);
});

// UID search
socket.emit('search:uid', { uid: 123456 });
socket.on('search:uid:results', (results) => {
  console.log('UID search results:', results);
});

// Kind search
socket.emit('search:kind', {
  query: 'vehicle',
  page: 1,
  limit: 10
});

socket.on('search:kind:results', (results) => {
  console.log('Kind search results:', results);
});
```

### Query Processing

```javascript
// Execute Gellish query
socket.emit('query:execute', {
  query: [
    {
      lh_object_uid: 1,
      lh_object_name: '?entity',
      rel_type_uid: 1146,
      rel_type_name: 'is a specialization of',
      rh_object_uid: 123456,
      rh_object_name: 'Vehicle'
    }
  ]
});

socket.on('query:results', (results) => {
  console.log('Query results:', results.facts);
  console.log('Variables:', results.vars);
  console.log('Total count:', results.totalCount);
});

// Validate query
socket.emit('query:validate', {
  query: [/* query facts */]
});

socket.on('query:validated', (result) => {
  console.log('Query valid:', result.valid);
});
```

### Validation

```javascript
// Validate a fact
socket.emit('validation:validate', {
  fact: {
    lh_object_uid: 123456,
    rel_type_uid: 1146,
    rh_object_uid: 789012
  }
});

socket.on('validation:result', (result) => {
  console.log('Validation result:', result);
});

// Batch validation
socket.emit('validation:collection', {
  facts: [/* array of facts to validate */]
});

socket.on('validation:collection:result', (results) => {
  console.log('Batch validation results:', results);
});
```

### UID Management

```javascript
// Generate new UID
socket.emit('uid:generate', { type: 'entity' });
socket.on('uid:generated', (result) => {
  console.log('New UID:', result);
});

// Generate batch UIDs
socket.emit('uid:batch', { count: 10, type: 'fact' });
socket.on('uid:batch:generated', (results) => {
  console.log('Batch UIDs:', results);
});

// Reserve UID range
socket.emit('uid:reserve', { count: 100 });
socket.on('uid:range:reserved', (range) => {
  console.log('Reserved UIDs:', range);
});
```

### Transaction Management

```javascript
// Start transaction
socket.emit('transaction:start', {});
socket.on('transaction:started', (transaction) => {
  console.log('Transaction started:', transaction);
});

// Commit transaction
socket.emit('transaction:commit', { 
  transaction_id: 'txn_123' 
});
socket.on('transaction:committed', (result) => {
  console.log('Transaction committed:', result);
});

// Rollback transaction
socket.emit('transaction:rollback', { 
  transaction_id: 'txn_123' 
});
socket.on('transaction:rolledback', (result) => {
  console.log('Transaction rolled back:', result);
});
```

## 🧠 Basis Namespace

The Basis namespace provides advanced graph traversal and semantic operations, ported from the Clojure reference implementation:

### Core Operations

- **`getRelations(uid, options)`**: Get direct relations with direction control
- **`getRelationsRecursive(uid, options)`**: Recursive traversal with cycle detection
- **`expandTypes(types)`**: Include subtypes in type collections
- **`factSetOperation(ops, collections)`**: Set operations on fact collections

### Cone Operations (Descendants)

- **`getSubtypes(uid)`**: Get direct subtype concepts
- **`getSubtypesRecursive(uid, depth)`**: Get subtype hierarchy to specified depth
- **`calculateCone(uid)`**: Compute all descendants from input node
- **`getCone(uid)`**: Get cached descendant set

### Lineage Operations (Ancestors)

- **`getSupertypes(uid)`**: Get direct supertype concepts
- **`getSupertypesRecursive(uid, depth)`**: Get supertype hierarchy
- **`calculateLineage(uid)`**: Calculate complete paths to root
- **`findCommonAncestor(uid1, uid2)`**: Find shared ancestor

### Relation Operations

- **Role-based semantics**: Advanced relationship constraints and validation
- **Constraint checking**: Verify relationship validity
- **Semantic validation**: Context-aware fact validation

## 🔧 Core Services

### GraphService

Handles all Neo4j database operations with optimized read/write session management:

```typescript
// Read operations (optimized routing)
const facts = await graphService.execQuery(query, params);

// Write operations (transaction management)
const result = await graphService.execWriteQuery(query, params);

// Fact management
await graphService.addFact(fact);
await graphService.remFact(factUid);
```

### FactService

Core fact operations with semantic awareness:

```typescript
// CRUD operations
const facts = await factService.getSubtypes(uid);
const classified = await factService.getClassified(uid, recursive);
const related = await factService.getAllRelatedFacts(uid);

// Validation and submission
const isValid = await factService.confirmFact(fact);
await factService.submitBinaryFact(fact);
await factService.submitBinaryFacts(facts);
```

### CacheService

Redis-backed caching for performance optimization:

```typescript
// Descendant caching
const descendants = await cacheService.allDescendantsOf(uid);
await cacheService.updateDescendantsInDB(nodeToDescendants);

// Lineage caching
const lineage = await cacheService.getEntityLineageCache(uid);
await cacheService.addToEntityLineageCache(uid, lineage);

// Fact caching
await cacheService.addToEntityFactsCache(uid, factUid);
```

### ValidationService

Semantic validation with Gellish rule enforcement:

```typescript
// Role validation
const canPlay = await validationService.canPlayRoleP(entityUid, roleUid);

// Classification validation
const isClassified = await validationService.isClassifiedAsP(indvUid, kindUid);

// Fact validation
const isValid = await validationService.simpleValidateBinaryFact(fact);
```

## 📁 Project Structure

```
src/
├── basis/                 # Graph traversal namespace
│   ├── core.service.ts    # Core graph operations
│   ├── cone.service.ts    # Descendant operations
│   ├── lineage.service.ts # Ancestor operations
│   ├── relation.service.ts# Relationship semantics
│   └── types.ts          # Type definitions
├── websocket/            # WebSocket communication
│   ├── archivist.gateway.ts # Main WebSocket gateway
│   ├── handlers/         # Domain-specific handlers
│   └── types/           # WebSocket message types
├── graph/               # Neo4j integration
│   ├── graph.service.ts # Database operations
│   └── queries.ts       # Cypher query library
├── cache/               # Redis caching
├── fact/                # Core fact operations
├── validation/          # Semantic validation
├── query/               # Gellish query processing
├── search/              # Search services
│   ├── general-search/  # Text search
│   ├── kind-search/     # Type-specific search
│   └── individual-search/ # Instance search
└── transaction/         # State management
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:cov

# Run e2e tests
yarn test:e2e
```

### Test Categories

- **Unit Tests**: Individual service testing
- **Integration Tests**: Database interaction testing
- **WebSocket Tests**: Real-time communication testing
- **Performance Tests**: Load and latency testing

## 📊 Monitoring & Observability

The service provides comprehensive logging and monitoring:

### Health Checks

```javascript
// WebSocket health check
socket.emit('health');
socket.on('health:status', (status) => {
  // Check service health, registered handlers, database connectivity
});
```

### Logging Levels

- **Error**: Critical failures and exceptions
- **Warn**: Performance issues and degradation warnings
- **Info**: Service lifecycle and major operations
- **Debug**: Detailed operation tracing
- **Verbose**: Fine-grained debugging information

### Metrics

- WebSocket connection count and handler usage
- Neo4j query performance and connection pool status
- Redis cache hit/miss ratios
- Fact creation and validation rates

## 🔒 Security

### Authentication & Authorization

The Archivist service relies on upstream authentication from the Shutter service. All requests should be pre-authenticated.

### Data Validation

- Input sanitization for all WebSocket messages
- Semantic validation using Gellish constraints
- Type checking and schema validation
- SQL injection prevention in Cypher queries

### Network Security

- WebSocket-only communication (no REST endpoints)
- CORS configuration for WebSocket connections
- Rate limiting on WebSocket handlers
- Connection management and cleanup

## 🔄 Integration

### Upstream Services

- **Clarity**: Semantic model definitions and ontology management
- **Shutter**: Authentication and authorization services

### Downstream Services

- **Prism**: File processing and document management
- **Aperture**: User interface and visualization

### External Dependencies

- **Neo4j**: Primary graph database for fact storage
- **Redis**: Caching layer for performance optimization
- **PostgreSQL**: Auxiliary relational data storage

## 📈 Performance

### Optimization Strategies

- **Read/Write Session Separation**: Optimal Neo4j cluster utilization
- **Intelligent Caching**: Redis-backed descendant and lineage caches
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Indexed Cypher queries and prepared statements

### Scaling Considerations

- Horizontal scaling through WebSocket gateway clustering
- Neo4j cluster configuration for high availability
- Redis sentinel for cache failover
- Connection load balancing

## 🛠️ Development

### Code Style

The project follows strict TypeScript and NestJS conventions:

```bash
# Lint code
yarn lint

# Format code
yarn format

# Type checking
yarn build
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes with proper tests and documentation
4. Ensure all tests pass: `yarn test`
5. Submit a pull request with detailed description

### Debugging

```bash
# Debug mode with inspector
yarn start:debug

# Then connect debugger to localhost:9229
```

## 📝 API Reference

For detailed API documentation, see:

- [WebSocket API Reference](./docs/websocket-api.md)
- [Basis Namespace Guide](./docs/basis-namespace.md)
- [Service Integration Guide](./docs/integration.md)
- [Performance Tuning Guide](./docs/performance.md)

## 🔗 Related Documentation

- [Systema Relica Architecture Overview](../../docs/architecture.md)
- [Gellish Language Specification](../../docs/gellish.md)
- [Neo4j Schema Design](../../docs/neo4j-schema.md)
- [Development Guidelines](../../docs/development.md)

## 📄 License

This project is part of the Systema Relica ecosystem. See the root [LICENSE](../../LICENSE) file for details.

---

**Built with ❤️ for semantic knowledge representation and graph-based reasoning**