# Relica Development Guide

## Build & Run Commands
- **TypeScript (packages_ts):**
  - Build all: `yarn build`
  - Lint: `yarn lint`
  - Test: `yarn test`
  - Single test: `cd packages_ts/<package> && yarn test -t "test name"`
  - Dev server: `cd packages_ts/frontend/knowledge-integrator && yarn dev`
  - Type check: `yarn workspaces run type-check`

- **Clojure (packages_clj):**
  - Run REPL: `cd packages_clj/<package> && clj -M:dev`
  - Run tests: `cd packages_clj/<package> && clj -M:test`
  - Single test: `cd packages_clj/<package> && clj -M:test -v <test-ns>/<test-name>`

## Code Style Guidelines
- **TypeScript:**
  - Use TypeScript types for all code
  - Follow ESLint & Prettier configuration
  - Prefer functional components with hooks
  - Import order: React, external libs, internal modules
  - Use MobX for state management

- **Clojure:**
  - Follow idiomatic Clojure style
  - Use namespaced keywords
  - Prefer pure functions
  - Use maps for data structures
  - Handle errors with appropriate exception handling

## System Architecture
```
flowchart TB
    subgraph Frontend["Frontend Layer"]
        KI["Knowledge Integrator\n(React-admin + Vite)\nAdmin UI"]
    end

    subgraph Gateway["API Gateway & Real-time"]
        Portal["Portal\n(Clojure)\nWebSocket/REST Gateway"]
    end

    subgraph Auth["Authentication Layer"]
        Shutter["Shutter\n(Clojure)\nAuth Service"]
    end

    subgraph Session["Session Management"]
        Aperture["Aperture\n(Clojure)\nSession & Environment"]
    end

    subgraph Semantic["Semantic Processing"]
        Clarity["Clarity\n(Clojure)\nObject-Semantic Mapping Layer"]
    end

    subgraph Foundation["Foundation Layer"]
        Archivist["Archivist\n(Clojure)\nData Persistence"]
        Neo4j["Neo4j\nGraph Database"]
        Postgres["PostgreSQL\nRelational Storage"]
        Redis["Redis\nCaching Layer"]
    end
        
    %% Frontend connections
    KI <--> |"WebSocket/REST"| Portal
    KI <--> |"Auth"| Shutter

    %% Gateway connections
    Portal <--> |"Token Validation"| Shutter
    Portal <--> |"Session Management"| Aperture
    Portal <--> |"Data Operations"| Clarity
    Portal <-.-> |"Grounding"| Archivist

    %% Auth connections
    Shutter <--> |"User Auth"| Postgres

    %% Session connections
    Aperture <--> |"Context"| Clarity
    Aperture <-.-> |"Grounding"| Archivist

    %% Semantic layer connections
    Clarity <--> |"Persistence"| Archivist

    %% Foundation layer connections
    Archivist <--> Neo4j
    Archivist <--> Postgres
    Archivist <--> Redis
```