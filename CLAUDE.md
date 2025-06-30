# Systema Relica - Claude Development Guide

This document serves as comprehensive orientation for Claude development sessions, covering architecture, patterns, conventions, and the mental models needed to work effectively with this codebase.

## Project Identity & Mission

Systema Relica is a distributed knowledge management and AI ecosystem designed for real-time collaboration, intelligent data processing, and seamless information integration. Think of it as a "living knowledge graph" with AI-powered insights, real-time updates, and multi-modal data handling.

### Core Philosophy
- **Distributed but Coherent**: Microservices that feel like a unified system
- **Type-Safe by Default**: Contracts and schemas prevent runtime surprises  
- **Real-time First**: Live updates and collaborative features are core, not afterthoughts
- **AI-Augmented**: Intelligence woven throughout, not bolted on
- **Developer Experience**: Tools and patterns that make complex things simple

## Architecture Mental Model

### The Service Ecosystem

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Knowledge       │  │ Specialized     │               │
│  │ Integrator      │  │ UI Components   │               │
│  │ (React/Vite)    │  │ (3D, Search)    │               │
│  └─────────────────┘  └─────────────────┘               │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼──────────────────────────────────────────┐
│                 Gateway Layer                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Portal (2204)                      │       │
│  │        API Gateway + Auth Orchestration         │       │
│  └─────────────────────────────────────────────────┘       │
└─────┬─────────┬──────────┬──────────┬──────────┬─────────┬─┘
      │         │          │          │          │         │
┌─────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼───┐ ┌───▼───┐
│ Prism   │ │Archive │ │Aperture│ │Clarity │ │Shutter│ │ NOUS  │
│ (3005)  │ │(3002)  │ │(3003)  │ │(3001)  │ │(3004) │ │(3006) │
│ System  │ │ Data & │ │Environ.│ │Semantic│ │Auth & │ │  AI   │
│ Startup │ │ Graph  │ │Managmt │ │Object  │ │Secur. │ │       │
│         │ │        │ │        │ │Mapper  │ │       │ │       │
└─────────┘ └────────┘ └────────┘ └────────┘ └───────┘ └───────┘
     │         │           │          │          │         │
┌────▼─────────▼───────────▼──────────▼──────────▼─────────▼─┐
│                     Data Layer                             │
│   PostgreSQL   │   Neo4j   │   Redis   │   File Storage    │
│  users/state   │    main   │  semantic │    seed files     │
│                │ datastore │   cache   │                   │
└────────────────────────────────────────────────────────────┘
```

### Language & Technology Zones

**TypeScript Zone** (Primary):
- All NestJS backend services
- React frontend applications  
- Shared libraries and contracts
- Primary development focus

**Python Zone** (Specialized AI):
- NOUS service (Socket.IO based)
- Heavy ML/AI workloads
- Integrates via Socket.IO with TypeScript services

## Development Patterns & Conventions

### 1. Contract-First Communication

**🎯 The Golden Rule**: All inter-service communication uses shared contracts.

```typescript
// ✅ Contract-first approach
import { PrismActions, MessageRegistryUtils } from '@relica/websocket-contracts';

// Portal client:
const message = {
  action: PrismActions.GET_SETUP_STATUS,  // 'setup/get-status'
  // ... other fields
};

// Prism handler:
@SubscribeMessage(PrismActions.GET_SETUP_STATUS)
handleGetStatus() { /* ... */ }
```

### 2. Service Responsibility Patterns

Each service has a clear domain and responsibility:

**Archivist (The Librarian)**:
- Data persistence and retrieval
- Knowledge graph operations
- Long-term storage decisions
- Think: "Memory of the system"

**Portal (The Orchestrator)**:
- Routes external requests to internal services
- Handles authentication delegation
- Never contains business logic
- Think: "Smart proxy, thin layer"

**Clarity (The Semantic Layer)**:
- Object Semantic Mapper
- provides access to object based knowledge representation
- derives objects from archivist facts
- Think: "Interface between clients/agents and raw representation"


**Aperture (The Workin Memory)**:
- Media processing and analysis
- Computer vision tasks
- File handling and transformation
- Think: "Visual processing unit"

**NOUS (The Brain)**:
- AI/ML inference and reasoning
- Language processing
- Intelligent analysis
- Think: "Cognitive processing unit"

**Prism (The System Initializer)**:
- System initialization and health
- Cross-service coordination
- Setup flows and system state
- Think: "System nervous system"

**Shutter (The Gatekeeper)**:
- Authentication and authorization
- Security policies
- User management
- Think: "Security mechanism"

**Portal (The Gateway)**:
- System/Security boundary
- Main system API provider
- realtime socket based interface
- Think: "Security boundary"

**Knowledge Integrator/Viewfinder (The Interface)**:
- Administrative User Interface
- Knowledge Exploration
- Knowledge mangement workflows
- system configuration
- Think: "Admin User Interface"

### 3. Data Flow Patterns

**Request Flow** (typical):
```
Frontend → Portal → [Service] → Database
                ↓
           WebSocket Updates → All Connected Clients
```

**Real-time Updates**:
- Services broadcast state changes via WebSocket
- Frontend subscribes to relevant event streams
- Portal may aggregate/filter events for clients

**Authentication Flow**:
```
Client → Portal (check auth) → Shutter (validate) → [Business Service]
```

### 4. State Management Philosophy

**Backend**: Each service owns its domain state
- Archivist: Data entities, relationships
- Clarity: OSM/custom model configuratio(future)
- Aperture: User environments (collections of facts/objects)
- NOUS: AI model states, inference results
- Prism: System state, health, setup progress
- Shutter: user status, auth states
- Portal: no state
- No shared mutable state between services

**Frontend**: 
- Local UI state (React hooks)
- Server state (React Query/SWR patterns)
- Real-time state (WebSocket subscriptions)

### 5. Error Handling Patterns

**Service-to-Service**:
```typescript
// Standardized error responses
{
  success: false,
  error: "Human-readable message",
}
```

**Frontend Error Boundaries**:
- Component-level error boundaries
- Global error toast system
- Graceful degradation when services are unavailable

## File Organization Conventions

### Package Structure (TypeScript services)
```
packages/[service]/
├── src/
│   ├── [domain]/           # Business logic by domain
│   │   ├── [domain].service.ts
│   │   ├── [domain].controller.ts
│   │   └── [domain].module.ts
│   ├── websocket/          # WebSocket handlers (if applicable)
│   ├── types/              # Service-specific types
│   ├── config/             # Configuration logic
│   └── main.ts             # Entry point
├── test/                   # Tests mirror src structure
├── package.json
└── Dockerfile              # MUST include websocket-contracts
```

### Shared Libraries Structure
```
packages/types/                # Cross-service TypeScript types
packages/constants/            # Shared constants and enums
packages/websocket-clients/    # Shared websocket clients respective per module
packages/websocket-contracts/  # API contracts (THE source of truth)
packages/hsm-manager/          # State machine utilities
```

### Frontend Structure
```
packages/knowledge-integrator/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-level components
│   ├── services/           # API client logic
│   ├── hooks/              # Custom React hooks
│   ├── types/              # Frontend-specific types
│   └── utils/              # Helper functions
```

## Development Workflow Patterns

### Adding a New Feature (Typical Flow)

1. **Define the Contract** (if inter-service communication needed):
   ```typescript
   // packages/websocket-contracts/src/services/[service].ts
   export const ServiceActions = {
     NEW_FEATURE: 'domain/new-feature'
   } as const;
   ```

2. **Implement Backend Logic**:
   - Add to appropriate service domain
   - Follow existing controller/service patterns
   - Use contract constants for WebSocket handlers

3. **Update Frontend**:
   - Add API client methods
   - Create/update UI components
   - Handle real-time updates if applicable

4. **Test Integration**:
   - Unit tests for business logic
   - Integration tests for service communication
   - E2E tests for user workflows

### Adding a New Service

1. **Create Package Structure**: Follow existing service patterns
2. **Define Service Contracts**: Add to websocket-contracts
3. **Create Dockerfile**: Include all shared packages
4. **Add to docker-compose.yml**: With appropriate networking
5. **Update Portal**: Add routing if external access needed

### Debugging Service Issues

**Communication Problems**:
1. Check contract definitions match between services
2. Verify Docker networking (service discovery)
3. Check WebSocket connection status
4. Validate message schemas

**Data Problems**:
1. Check database connections (PostgreSQL, Neo4j, Redis)
2. Verify data migrations
3. Check service startup order

**Performance Issues**:
1. Review database query patterns
2. Check Redis caching effectiveness
3. Monitor WebSocket connection counts
4. Review AI/ML inference times

## 🛠️ Standard Development Commands

**Use these commands for all development tasks. They work consistently across the entire monorepo.**

### Essential Daily Commands
```bash
# Build all packages (run this first after git pull)
yarn build

# Type check all TypeScript (run before committing)
yarn type-check

# Lint and fix all packages
yarn lint
yarn lint:fix

# Run all tests
yarn test
yarn test:cov

# Start all services for development
yarn start:dev

# Start only databases (when running services individually)
yarn start:databases
```

### Docker Commands
```bash
# Start all services in containers
yarn docker:up
yarn docker:build    # with rebuild

# View logs from all services
yarn docker:logs

# Stop all containers
yarn docker:down
```

### Individual Service Commands
```bash
# Work with specific services
yarn workspace @relica/portal start:dev
yarn workspace @relica/archivist build
yarn workspace @relica/prism test
yarn workspace @relica/websocket-contracts type-check
```

### Common Development Workflows

**Starting Development Session:**
```bash
git pull origin main
yarn build                 # Build all packages
yarn type-check            # Verify no type errors
yarn start:databases       # Start databases
yarn start:dev             # Start all services
```

**Before Committing:**
```bash
yarn build                 # Ensure everything builds
yarn type-check            # Check for type errors
yarn lint                  # Fix linting issues
yarn test                  # Run tests
```

**When Adding New Features:**
1. Define WebSocket contracts first (`packages/websocket-contracts`)
2. Implement service logic
3. Update frontend if needed
4. Run `yarn type-check` and `yarn test`

**Quick Service Health Check:**
```bash
curl http://localhost:3000/health  # Archivist
curl http://localhost:3005/health  # Prism
curl http://localhost:2204/health  # Portal
```

## Key Configuration Patterns

### Environment Variables
- maintained in central .env file shared between all packages
- `NODE_ENV`: development/production
- `[SERVICE]_PORT`: Service-specific ports
- `DATABASE_URL`: Connection strings
- Service discovery via Docker container names

### Docker Networking
- All services in same Docker network
- Service discovery via container names
- Port mapping for external access (development)

### Database Patterns
- **PostgreSQL**: user data, environment data, modelling sesson management
- **Neo4j**: Knowledge graph, relationships
- **Redis**: Caching

## Testing Philosophy

### Unit Tests
- Business logic in isolation
- Mocked dependencies
- Fast feedback loop

### Integration Tests  
- Service-to-service communication
- Database interactions
- Contract validation

### Contract Tests
- Ensure message schemas are valid
- Verify service communication patterns
- Prevent breaking changes

### E2E Tests
- Full user workflows
- Cross-service functionality
- Real browser testing

## Security Patterns

### Authentication Flow
1. User authenticates via Portal
2. Portal delegates to Shutter service
3. JWT tokens for subsequent requests
4. Service-to-service communication trusted within Docker network

### Data Protection
- Input validation at service boundaries
- SQL injection prevention (parameterized queries)
- XSS protection in frontend
- CORS configuration

## Common Pitfalls & Solutions

### "Service Can't Find Each Other"
- Check Docker network configuration
- Verify service names in docker-compose.yml
- Ensure services start in correct order

### "WebSocket Messages Not Working"
- Verify contract constants match exactly
- Check message schema validation
- Confirm WebSocket connection established

### "Frontend Not Updating"
- Check WebSocket subscription setup
- Verify event emission from backend
- Review React state management

### "Database Connection Issues"
- Check connection strings
- Verify database containers are running
- Review migration status

## Quick Decision Framework

**Adding a new API endpoint?**
→ Define contract first, implement second

**Need real-time updates?**  
→ Use WebSocket with event emission patterns

**Storing relational data?**
→ PostgreSQL via Archivist

**Storing graph data?**
→ Neo4j via Archivist

**Need caching?**
→ Redis, consider expiration strategies

**Processing media/files?**
→ Route through Aperture service

**Need AI/ML inference?**
→ Route through Clarity service

**Authentication required?**
→ Use Portal → Shutter flow

## Future Claude: Start Here

1. **Read this document** - Get the mental model
2. **Check `CLAUDE.local.md`** - Session-specific context  
3. **Review `packages/websocket-contracts/README.md`** - Current API contracts
4. **Scan recent commits** - Understand recent changes
5. **Look at failing tests** - Identify immediate issues

**When in doubt**: Follow existing patterns, use shared contracts, ask about architectural decisions rather than implementing new patterns.

This codebase rewards consistency and punishes creativity in architecture. The patterns exist for good reasons - usually learned through past debugging sessions!