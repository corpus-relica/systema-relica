# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & GitHub Operations
- **Use MCP GitHub tools where available** instead of direct git commands
- Always use SSH for GitHub operations when MCP is not available: `git@github.com:corpus-relica/systema-relica.git`
- Example push command: `git push git@github.com:corpus-relica/systema-relica.git <branch>`

## Git Workflow
- **GitFlow workflow**: Always create new branches off `develop`
- **Branch naming**: Use Linear's branch naming conventions for automated status management
  - Ask for branch name if not provided
- **Commits**: 
  - Use conventional commits style with maximum expressive emoji 🚀✨🎉🔥
  - Be narrative and hieroglyphic in commit messages
  - Commit often at appropriate increments of completed work
  - NO "Generated with Claude Code" attribution
- **Pull Requests**:
  - Squash and merge style on GitHub
  - NO "Generated with Claude Code" attribution in PR messages

## Build & Run Commands
- **TypeScript (packages_ts):**
  - Build all: `yarn build`
  - Lint: `yarn lint`
  - Test all: `yarn test`
  - Single test: `cd packages_ts/<package> && yarn test -t "test name"`
  - Test with watch: `yarn test:watch`
  - Type check: `yarn workspaces run type-check`
  - NestJS start dev: `cd packages_ts/backend/<service> && yarn start:dev`

- **Clojure (packages_clj):**
  - REPL: `cd packages_clj/<package> && clj -M:dev`
  - Run tests: `cd packages_clj/<package> && clj -M:test`
  - Single test: `cd packages_clj/<package> && clj -M:test -v <test-ns>/<test-name>`
  - Run service: `cd packages_clj/<package> && clj -M:run`

- **Python (packages_py):**
  - **NOUS Service Setup:**
    - Conda environment: `conda activate systema-relica-nous`
    - Install deps: `cd packages_py/nous && pip install -r requirements.txt`
    - Run tests: `pytest` or `pytest --cov=src --cov-report=html` for coverage
    - Start service: `python main.py` (runs on port 2204)
    - Dev mode with auto-reload: `./watchdog.sh`
  - **Environment Configuration:**
    - Requires `.env` file with API keys (OpenAI, Anthropic, Groq, Fireworks)
    - Configure service endpoints for Aperture, Clarity, Portal
    - Python 3.11 required

## Project Overview
Systema Relica is a semantic data modeling platform implementing the Gellish methodology for cognitive applications. It provides:
- **Semantic fact tuple storage** using Neo4j graph database
- **Object-semantic mapping layer** for translating between raw facts and domain objects
- **AI-enhanced data processing** through NOUS service with LangChain integration
- **Real-time communication** via WebSocket-first architecture
- **Multi-language microservices** (Clojure, TypeScript, Python)

The system enables knowledge representation and reasoning through semantic relationships, supporting both human and AI understanding of complex data models.

## Service Architecture & Responsibilities
Each service has a specific role in the semantic data pipeline:

### Core Services (Clojure)
- **Archivist**: Raw tuple/fact management, cache coordination, Neo4j database operations
  - Manages fact storage, retrieval, and validation
  - Coordinates Redis cache updates
  - Provides WebSocket API for fact operations
  
- **Clarity**: Object-semantic mapping, query transformation, semantic interpretation
  - Transforms between fact tuples and domain objects
  - Manages semantic modeling sessions
  - Provides REPL interface for interactive exploration
  
- **Aperture**: User sessions, environment management, context handling
  - Manages user environments and perspectives
  - Handles session state and context switching
  - Coordinates multi-tenant data isolation

### Gateway & Security (Clojure)
- **Portal**: API gateway, request routing, protocol translation
  - Routes requests to appropriate services
  - Translates between REST and WebSocket protocols
  - Handles cross-service communication
  
- **Shutter**: Authentication, access control, token management
  - Manages API tokens and user authentication
  - Enforces access control policies
  - Provides security middleware

### Specialized Services
- **Prism** (Clojure): System initialization, batch data import/export
  - Imports Gellish dictionaries from XLS files
  - Manages system bootstrapping
  - Handles bulk data operations
  
- **NOUS** (Python): AI agent functionality, LLM integration
  - Provides semantic AI capabilities
  - Integrates with LangChain for reasoning
  - Offers natural language understanding of facts

### UI & Legacy
- **Viewfinder** (TypeScript/React): Admin interface
  - Provides system visualization
  - Offers administrative controls
  - Real-time monitoring dashboard

## Key Technologies & Patterns
- **Communication**: WebSockets (primary), REST (secondary)
- **Data Formats**: 
  - EDN (Extensible Data Notation) for Clojure services
  - JSON for TypeScript/Python services
  - Gellish semantic tuples for knowledge representation
- **Databases**: 
  - Neo4j (semantic facts and relationships)
  - Redis (distributed cache)
  - PostgreSQL (application data, user management)
- **Testing Frameworks**:
  - Kaocha for Clojure (with clojure.test)
  - Jest for TypeScript
  - pytest for Python
- **Container Orchestration**: Docker Compose for development

## Development Workflow
### System Startup
```bash
# Full system startup
docker-compose up --build -d

# Individual service development (with hot-reload)
cd packages_clj/<service>
clj -M:dev  # Starts REPL with development profile
```

### Service Development
- Services can be developed individually with hot-reload capabilities
- Each service exposes health check endpoints
- WebSocket connections auto-reconnect on service restart
- Use service-specific REPL for interactive development (Clojure)

### Database Access
- Neo4j Browser: http://localhost:7474 (no auth in dev)
- Redis CLI: `docker exec -it systema-relica-redis-1 redis-cli`
- PostgreSQL: `docker exec -it systema-relica-postgres-1 psql -U postgres`

## Code Style Guidelines
- **TypeScript:**
  - Use strict TypeScript types for all code
  - Follow ESLint & Prettier configuration
  - NestJS for backend, React for frontend
  - Prefer functional React components with hooks
  - Import order: React/NestJS, external libs, internal modules
  - Error handling: Use try/catch and proper error objects
  - State management: MobX or XState for complex state

- **Clojure:**
  - Follow idiomatic Clojure style
  - Use namespaced keywords (:io.relica/key)
  - Prefer pure functions and immutable data structures
  - Use spec for validations where possible
  - Mount for component lifecycle management
  - Handle errors with appropriate exception handling or monadic patterns

## Important Patterns & Conventions
### Service Documentation
- **AODF Specification**: Each service has an `AODF.md` file describing its data format
- **WebSocket APIs**: Each service documents its protocol in `websocket-api.md`
- **REST APIs**: REST endpoints documented in `rest-api.md` where applicable

### Communication Patterns
- **WebSocket Message Format**: EDN for Clojure services, JSON for others
- **Service Discovery**: Services connect via hardcoded ports (see each service's config)
- **Error Handling**: Consistent error response format across services
- **Health Checks**: All services expose `/health` or similar endpoints

### Data Flow
1. **Facts enter via Archivist** → stored in Neo4j
2. **Clarity interprets facts** → creates semantic objects
3. **Aperture manages context** → user environments and perspectives
4. **Portal routes requests** → appropriate service handling
5. **NOUS provides AI layer** → natural language understanding

## Testing Guidelines
### Coverage Goals
- **Target**: Minimum 80% coverage per service
- **Focus Areas**: Critical paths, API boundaries, data transformations

### Test Organization
- **Clojure Tests**:
  - Location: `test/io/relica/<service>/*_test.clj`
  - Fixtures: `test_helpers.clj` and `test_fixtures.clj`
  - Run all: `clj -M:test`
  - Run specific: `clj -M:test -v <namespace>/<test-name>`
  
- **TypeScript Tests**:
  - Location: `*.spec.ts` or `*.test.ts` alongside source files
  - Config: `jest.config.js` in each package
  - Run all: `yarn test`
  - Watch mode: `yarn test:watch`
  
- **Python Tests**:
  - Location: `tests/unit/` and `tests/integration/`
  - Config: `pytest.ini` in package root
  - Run all: `pytest`
  - With coverage: `pytest --cov=src --cov-report=html`

### Test Data
- Use provided fixtures and factories
- Mock external service calls
- Test WebSocket connections with test utilities
- Isolate database operations in tests

## Common Tasks & Commands
### Service Management
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f <service-name>

# Restart a service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up --build -d <service-name>

# Stop all services
docker-compose down

# Clean restart (removes volumes)
docker-compose down -v && docker-compose up --build -d
```

### Database Operations
```bash
# Neo4j Browser UI
open http://localhost:7474

# Redis CLI
docker exec -it systema-relica-redis-1 redis-cli

# PostgreSQL
docker exec -it systema-relica-postgres-1 psql -U postgres -d systema_relica

# Clear Redis cache
docker exec -it systema-relica-redis-1 redis-cli FLUSHALL

# Neo4j Cypher shell
docker exec -it systema-relica-neo4j-1 cypher-shell
```

### Development Tasks
```bash
# Watch TypeScript compilation
cd packages_ts && yarn build:watch

# Format all code
yarn format

# Check for dependency updates
yarn outdated

# Clean and reinstall dependencies
rm -rf node_modules yarn.lock && yarn install
```

## Architecture Notes
### Migration Status
- **Active Migration**: TypeScript Archivist → Clojure Archivist
- **Completed**: Common utilities moved to Clojure
- **Future**: Consideration for consolidating TypeScript services to Clojure

### Design Decisions
- **WebSocket-First**: Chosen for real-time semantic updates
- **EDN Format**: Native Clojure data format, efficient for fact representation
- **Microservices**: Enables independent scaling and development
- **Neo4j**: Graph database ideal for semantic relationships

### Service Dependencies
- All services depend on **Portal** for routing
- **Clarity** depends on **Archivist** for fact storage
- **NOUS** depends on **Clarity**, **Archivist**, and **Aperture**
- **Viewfinder** connects to all services for monitoring

## Debugging Tips
### Connection Issues
- **Check WebSocket connections first** - most common issue
- Verify service is running: `docker-compose ps`
- Check service logs for connection errors
- Ensure correct ports in configuration files

### Performance Issues
- **Redis cache**: Clear with `FLUSHALL` if stale
- **Neo4j queries**: Use `EXPLAIN` to analyze query plans
- **Service memory**: Check Docker stats with `docker stats`

### Data Issues
- **Fact validation errors**: Check Archivist logs
- **Missing data**: Verify Redis cache synchronization
- **Import failures**: Check Prism logs for XLS parsing errors

### Development Workflow
- **Service won't start**: Check for port conflicts
- **REPL issues**: Ensure correct profile (`:dev`) is loaded
- **Test failures**: Clear test databases between runs
- **Hot reload not working**: Restart the service manually