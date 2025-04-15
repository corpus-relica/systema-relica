# Relica Development Guide

## Build & Run Commands
- **TypeScript (packages_ts):**
  - Build all: `yarn build`
  - Lint: `yarn lint`
  - Test: `yarn test`
  - Single test: `cd packages_ts/<package> && yarn test -t "test name"`
  - Dev server: `cd packages_ts/frontend/viewfinder && yarn dev`
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
