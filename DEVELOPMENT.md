# Development Workflow

This document describes the development workflow for the Relica system, focusing on the Docker setup and how to work efficiently with it.

## Table of Contents
- [Setup](#setup)
- [Development Environment](#development-environment)
- [Helper Script](#helper-script)
- [Common Development Scenarios](#common-development-scenarios)
- [Troubleshooting](#troubleshooting)

## Setup

Before starting development, make sure you have the following prerequisites:

1. Docker and Docker Compose installed
2. Git repository cloned locally
3. Required environment variables set (see [Environment Variables](#environment-variables))

## Development Environment

The development environment is configured in `docker-compose.dev.yml`. This configuration is optimized for local development with these key features:

- **Localhost Networking**: All services communicate via localhost instead of container networks
- **Volume Mounting**: Code directories are mounted as volumes for hot-reloading
- **Hot Reloading**: Changes to code are reflected immediately without container restarts
- **Independent Services**: Services can be started/stopped individually

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
# API Keys for LLM services (needed for nous service)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# For local development
ENV=development
```

## Helper Script

The `dev.sh` script provides a convenient way to manage the development environment:

```bash
# Start all services
./dev.sh start

# Start only specific services
./dev.sh start redis postgres neo4j

# Stop all services
./dev.sh stop

# Show logs for a specific service
./dev.sh logs archivist

# Show status of all services
./dev.sh status

# Show help
./dev.sh help
```

## Common Development Scenarios

### Scenario 1: Working on a Clojure Service (e.g., Archivist)

1. Start the data services:
   ```bash
   ./dev.sh start redis postgres neo4j
   ```

2. Start the archivist service:
   ```bash
   ./dev.sh start archivist
   ```

3. Make changes to the code in `packages_clj/archivist` - they will be hot-reloaded

4. View logs to see the effect of your changes:
   ```bash
   ./dev.sh logs archivist
   ```

### Scenario 2: Working on the Frontend (Viewfinder)

1. Start the backend services:
   ```bash
   ./dev.sh start redis postgres neo4j archivist clarity
   ```

2. Start the viewfinder service:
   ```bash
   ./dev.sh start viewfinder
   ```

3. Access the UI at http://localhost:5173

4. Edit files in `packages_ts/frontend/viewfinder` - changes will be reflected immediately

### Scenario 3: Running a Specific Service Outside Docker

Sometimes you may want to run a service directly on your host machine for debugging:

1. Start dependencies in Docker:
   ```bash
   ./dev.sh start redis postgres neo4j
   ```

2. Run the service locally (example for a Clojure service):
   ```bash
   cd packages_clj/archivist
   clj -M:dev
   ```

3. The service will connect to the containerized dependencies via localhost

### Scenario 4: Full-stack Development

1. Start all services:
   ```bash
   ./dev.sh start
   ```

2. Access the different components:
   - Frontend UI: http://localhost:5173
   - Archivist API: http://localhost:3000
   - Neo4j Browser: http://localhost:7474
   - Prism API: http://localhost:3333

## Troubleshooting

### Common Issues

1. **Port conflicts**: If a port is already in use, modify the port mapping in docker-compose.dev.yml

2. **Connection issues between services**: Ensure all services are using localhost in their environment variables

3. **Changes not reflecting**: Some services may need a full restart to pick up changes:
   ```bash
   ./dev.sh restart service_name
   ```

4. **Database issues**: Reset the database containers if needed:
   ```bash
   ./dev.sh stop postgres neo4j redis
   rm -rf packages_ts/core/dataplex/data/{postgres,neo4j,redis}/*
   ./dev.sh start postgres neo4j redis
   ```

### Logs

Always check the logs when troubleshooting:

```bash
# View all logs
./dev.sh logs

# View logs for a specific service
./dev.sh logs service_name
```