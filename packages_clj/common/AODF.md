# AODF: Common Library

## 1. Overview
The `io.relica.common` library provides shared utilities, data structures, protocols, and client implementations used across multiple Relica backend services (Archivist, Clarity, Aperture, Portal). Its purpose is to promote code reuse and consistency.

## 2. Structure
- **Key Namespaces:**
    - `io.relica.common.protocols`: Core data/communication protocols.
    - `io.relica.common.client`: Base client logic (e.g., WebSocket handling).
    - `io.relica.common.utils`: General utility functions (data manipulation, logging, configuration).
    - `io.relica.common.io.archivist-client`: Specific client implementation for Archivist.
    - `io.relica.common.auth`: Shared authentication logic/utilities.
    - `io.relica.common.transit`: Data serialization/deserialization (e.g., using Transit).

## 3. Functionality
- **Protocols:** Defines standard ways components interact.
- **Clients:** Provides reusable implementations for connecting to services (primarily WebSocket).
- **Utilities:** Common functions for tasks like configuration loading, logging setup, data transformation.
- **Serialization:** Standardizes data formats for inter-service communication.

## 4. Relationships
- **Depends on:** Core Clojure libraries, Transit, WebSocket client libraries, etc.
- **Used by:** `io.relica.archivist`, `io.relica.clarity`, `io.relica.aperture`, `io.relica.portal`

## 5. Usage
Included as a dependency in the `project.clj` or `deps.edn` file of consuming services. Functions and protocols are required/imported as needed.

## 6. Troubleshooting
- Ensure compatible versions are used across all services.
- Check for dependency conflicts if issues arise in consuming projects.
- Verify configuration utilities load settings correctly.