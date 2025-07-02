# Systema Relica Services Overview

This directory contains all the microservices and shared packages that make up the Systema Relica ecosystem. Each service has a specific responsibility and communicates via WebSocket contracts.

## 🌐 Service Architecture

### Core Services (Backend)

| Service | Port | Purpose | WebSocket Namespace |
|---------|------|---------|-------------------|
| **Portal** | 2204 | API Gateway & Auth Router | `/portal` |
| **Archivist** | 3000 | Data Persistence & Knowledge Graph | `/archivist` |
| **Clarity** | 3001 | Semantic Object Mapper | `/clarity` |
| **Aperture** | 3002 | Environment & Media Processing | `/aperture` |
| **Shutter** | 3004 | Authentication & Security | `/shutter` |
| **Prism** | 3005 | System Initialization & Health | `/prism` |

### AI Services

| Service | Port | Purpose | Technology |
|---------|------|---------|------------|
| **NOUS** | 3006 | AI/ML Inference & Reasoning | Python + Socket.IO |

### Frontend Applications

| Service | Port | Purpose | Framework |
|---------|------|---------|-----------|
| **Knowledge Integrator** | 5173 | Main Admin UI | React + Vite |
| **3D Graph UI** | - | 3D Graph Component | React + Three.js |
| **Fact Search UI** | - | Search Interface | React |

### Shared Libraries

| Package | Purpose | Used By |
|---------|---------|---------|
| **websocket-contracts** | API contracts & validation | All services |
| **websocket-clients** | WebSocket client implementations | Portal, frontend |
| **types** | Shared TypeScript definitions | All TypeScript services |
| **constants** | Shared constants & enums | All services |
| **hsm-manager** | State machine utilities | Services with complex state |

## 🔗 Service Communication Patterns

### WebSocket Message Flow
```
Frontend → Portal → [Target Service] → Database
                ↓
           Real-time Updates → All Connected Clients
```

### Authentication Flow
```
Client → Portal → Shutter (auth validation) → [Business Service]
```

### Data Flow
```
Write Operations: Frontend → Portal → Archivist → Neo4j/PostgreSQL
Read Operations: Frontend → Portal → Clarity → Archivist → Database
Real-time: Any Service → Portal → Frontend (via WebSocket events)
```

## 🛠️ Development Quick Start

### Essential Commands
```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run type checking across all packages
yarn type-check

# Run tests across all packages
yarn test

# Start all services for development
yarn start:dev

# Start only databases
yarn start:databases
```

### Individual Service Commands
```bash
# Start a specific service
yarn workspace @relica/portal start:dev
yarn workspace @relica/archivist start:dev
yarn workspace @relica/prism start:dev

# Build a specific package
yarn workspace @relica/websocket-contracts build

# Test a specific service
yarn workspace @relica/prism test
```

## 📊 Database Configuration

| Database | Port | Purpose | Services |
|----------|------|---------|----------|
| **PostgreSQL** | 5432 | User data, environments, sessions | Prism, Shutter, Aperture |
| **Neo4j** | 7687/7474 | Knowledge graph, relationships | Archivist, Clarity |
| **Redis** | 6379 | Caching, session storage | Prism, Portal |

## 🔧 Service Responsibilities

### Portal (API Gateway)
- Routes external requests to internal services
- Handles WebSocket connection management
- Aggregates responses from multiple services
- **No business logic** - pure routing layer

### Archivist (Data Layer)
- Manages all data persistence (PostgreSQL + Neo4j)
- Handles CRUD operations for facts, entities, concepts
- Manages knowledge graph relationships
- Provides search and query capabilities

### Clarity (Semantic Layer)
- Object Semantic Mapper for knowledge representation
- Transforms raw data into semantic objects
- Provides abstraction over Archivist's data model
- Handles model derivation and object relationships

### Aperture (Working Memory)
- Manages user environments and collections
- Handles media processing and file operations
- Computer vision and analysis tasks
- Environment-specific fact loading/unloading

### Prism (System Controller)
- System initialization and setup workflows
- Health monitoring and system status
- Batch operations and data processing
- Cross-service coordination

### Shutter (Security)
- User authentication and authorization
- JWT token management
- Security policies and access control
- User account management

### NOUS (AI Brain)
- AI/ML inference and reasoning
- Natural language processing
- Intelligent analysis and insights
- Integration with external AI APIs

### Knowledge Integrator (Frontend)
- Administrative user interface
- Knowledge exploration and visualization
- System configuration and management
- Real-time collaboration features

## 🔌 WebSocket Contract System

All inter-service communication uses shared contracts defined in `@relica/websocket-contracts`:

### Action Pattern
- Format: `{domain}/{action}` (e.g., `setup/get-status`, `fact/create`)
- Actions are used directly as WebSocket topics
- Type-safe message schemas with Zod validation

### Service Namespaces
- `PrismActions` - System setup and health
- `FactActions` - Data operations
- `SearchActions` - Search and query
- `ApertureActions` - Environment management
- `ClarityActions` - Semantic operations

### Message Types
- **Request**: Client → Service
- **Response**: Service → Client  
- **Event**: Broadcast updates to all clients

## 🚀 Docker & Development

### Development Mode (CLI)
- Services run locally via yarn scripts
- Databases run in Docker containers
- Hot reloading enabled for all services

### Production Mode
- All services containerized
- Service discovery via Docker networking
- Load balancing and scaling capabilities

### Useful Docker Commands
```bash
# Start all services in containers
yarn docker:up

# View logs from all services
yarn docker:logs

# Stop all containers
yarn docker:down
```

## 🧪 Testing Strategy

### Unit Tests
- Each service has isolated unit tests
- Mock external dependencies
- Focus on business logic validation

### Integration Tests
- Test service-to-service communication
- Validate WebSocket contract compliance
- Database integration testing

### E2E Tests
- Full user workflow testing
- Cross-service functionality
- Real browser automation

## 📁 Package Structure

### Backend Services (NestJS)
```
packages/[service]/
├── src/
│   ├── [domain]/           # Business logic by domain
│   ├── websocket/          # WebSocket handlers
│   ├── types/              # Service-specific types
│   └── main.ts             # Entry point
├── test/                   # Tests mirror src structure
└── package.json            # Standard scripts: build, test, lint, type-check
```

### Frontend Applications (React/Vite)
```
packages/[app]/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-level components
│   ├── services/           # API client logic
│   └── stores/             # State management
└── package.json
```

### Shared Libraries
```
packages/[lib]/
├── src/                    # Source code
├── dist/                   # Compiled output
└── package.json            # Build and export scripts
```

## 🔍 Troubleshooting

### Common Issues
1. **Service can't find each other**: Check Docker network configuration
2. **WebSocket messages not working**: Verify contract constants match
3. **Database connection issues**: Ensure containers are running
4. **Frontend not updating**: Check WebSocket subscription setup

### Debug Commands
```bash
# Check service health
curl http://localhost:3000/health  # Archivist
curl http://localhost:3005/health  # Prism

# View WebSocket connections
# Available in browser dev tools → Network → WS

# Check database connections
docker logs systema-relica-postgres-1
docker logs systema-relica-neo4j-1
```

## 📚 Additional Documentation

- [`websocket-contracts/README.md`](./websocket-contracts/README.md) - WebSocket API contracts
- [`websocket-contracts/QUICK_REFERENCE.md`](./websocket-contracts/QUICK_REFERENCE.md) - Contract usage examples
- [Root `CLAUDE.md`](../CLAUDE.md) - Complete development guide
- Individual service READMEs for specific implementation details

---

**💡 Pro Tip**: When adding new features, always start by defining the WebSocket contract first, then implement the service logic. This ensures consistent communication patterns across the entire system.