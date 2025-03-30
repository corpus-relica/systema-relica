# AODF: Archivist Service

## 1. Overview
The Archivist service is responsible for managing persistent storage and data retrieval for the Relica system. It interacts with various data sources and provides a unified interface for data access.

## 2. Structure
- **Core Namespace:** `io.relica.archivist.core`
- **Key Modules:** `io.relica.archivist.protocols`, `io.relica.archivist.db`

## 3. Operations
- `store-data`: Persists data records.
- `retrieve-data`: Fetches data based on queries.
- `delete-data`: Removes data records.

## 4. Relationships
- **Depends on:** `io.relica.common`
- **Used by:** `io.relica.portal`, `io.relica.clarity`

## 5. Environment Variables
- `ARCHIVIST_DB_URL`: Database connection string.
- `ARCHIVIST_PORT`: Service port.

## 6. Deployment
Deployed as a standalone service, typically containerized.

## 7. Troubleshooting
- Check database connectivity.
- Review service logs for errors during operations.