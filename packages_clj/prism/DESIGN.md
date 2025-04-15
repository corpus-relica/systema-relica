# Prism Package Design Document

## 1. Purpose

The `Prism` package is responsible for handling database initialization (seeding) and bulk data import/export operations for the Systema Relica application, primarily interacting with Neo4j. It consolidates logic previously handled by the TypeScript `Archivist` service.

## 2. Goals

- Provide reliable first-time database seeding.
- Offer robust bulk import functionality from XLS files.
- Offer bulk export functionality to XLS files (Future).
- Replace the seeding/import/export functionality of the `Archivist` TS package.
- Utilize Clojure and the JVM ecosystem.

## 3. Core Functionality

### 3.1. Database Seeding / Initial Import

- **Trigger:** Detects if the Neo4j database is empty on application startup.
- **Source:** Reads data from XLS files located in a configurable directory (e.g., `seed_xls`).
- **Processing:**
  - Reads XLS files (using `dk.ative/docjure` or similar).
  - Handles specific header/empty row removal logic from the source XLS.
  - Resolves temporary UIDs (< 1000) in specific columns (`lh_object_uid`, `rh_object_uid`, `rel_type_uid`, `fact_uid`) to permanent ranges, similar to the `resolveTempUIDs` logic in TS `XLSService`.
  - Parses and normalizes data types, especially dates (handling multiple formats like `yyyy-MM-dd`, `MM/dd/yyyy`, `dd-MMM-yy`).
  - Handles numeric strings containing commas.
- **Ingestion:**
  - Uses Neo4j's `LOAD CSV` for efficient bulk loading (requires APOC plugin for date parsing and relationship creation if kept in Cypher).
  - **Option 1 (Current plan):** Convert processed XLS data to intermediate CSV files (similar to current TS approach) placed in the Neo4j import directory. Then execute `LOAD CSV` Cypher queries.
  - **Option 2 (Alternative):** Load data more directly via the Neo4j driver (e.g., using `UNWIND` with batches of data maps), potentially bypassing intermediate CSV files. Requires careful transaction management.
  - Follows a two-step process:
    1.  Create/Merge `Entity` nodes (`LOAD CSV ... MERGE (lh:Entity ...) MERGE (rh:Entity ...)`).
    2.  Create `Fact` nodes and relationships (`LOAD CSV ... MATCH (lh)... MATCH (rh)... CREATE (f:Fact)... CALL apoc.create.relationship...`).
- **Cache Building:** After initial seeding, trigger necessary cache rebuilding processes (e.g., subtypes, lineage). This logic might reside here or be called in a downstream service (TBD).

### 3.2. Bulk XLS Import (Manual Trigger - Future)

- Similar processing and ingestion steps as seeding, but triggered manually via an API endpoint or other mechanism.
- Needs robust error handling and reporting.

### 3.3. Bulk XLS Export (Future)

- Query Neo4j for facts/entities based on specified criteria.
- Format data into the required XLS structure.
- Generate and provide the XLS file for download.

## 4. Design Considerations

- **Configuration:** Database connection details, file paths, UID ranges should be configurable.
- **Dependencies:** Requires Neo4j (with APOC potentially), Clojure XLS library.
- **Batching:**
  - Cache building should use batching for memory management and progress tracking.
  - `LOAD CSV` handles its own internal batching.
- **Concurrency:**
  - Initial XLS file processing (reading, cleaning, UID fixing) can likely be parallelized per file (e.g., using `pmap` or futures).
  - `LOAD CSV` ingestion steps (Node creation, Relationship creation) should likely remain sequential per file to avoid dependency issues, at least initially.
  - Cache building _processing_ steps might be parallelizable.
- **Error Handling:** Implement proper error handling, logging, and potential rollback mechanisms for failed imports.
- **Logging:** Use a structured logging library (e.g., Timbre) for clear progress indication and debugging.
- **Testing:** Develop unit and integration tests.
