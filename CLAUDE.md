# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## GitHub Operations
- Always use SSH for GitHub operations: `git@github.com:corpus-relica/systema-relica.git`
- Example push command: `git push git@github.com:corpus-relica/systema-relica.git <branch>`

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