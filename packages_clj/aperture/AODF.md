# AODF: Aperture Service

## 1. Overview
The Aperture service provides data visualization capabilities and potentially UI components for the Relica system. It fetches data and renders it in various formats for user interfaces or reports.

## 2. Structure
- **Core Namespace:** `io.relica.aperture.core`
- **Key Modules:** `io.relica.aperture.viz`, `io.relica.aperture.data`, `io.relica.aperture.endpoints`

## 3. Client Usage
Clients (typically the Portal service or direct frontend calls) request visualizations via defined API endpoints, specifying data sources and desired chart types or formats.

## 4. Operations
- `generate-visualization`: Creates a specific chart/graph based on input parameters.
- `get-data-summary`: Provides aggregated data summaries suitable for dashboards.

## 5. Relationships
- **Depends on:** `io.relica.common`, `io.relica.archivist` (for data fetching)
- **Used by:** `io.relica.portal`, Frontend applications

## 6. Environment Variables
- `APERTURE_API_ENDPOINT`: Base URL for the Aperture API.
- `APERTURE_PORT`: Service port.
- `ARCHIVIST_API_URL`: Endpoint for fetching data from Archivist.

## 7. Deployment
Deployed as a web service, often containerized.

## 8. Troubleshooting
- Check connectivity to data sources (Archivist).
- Validate input parameters for visualization requests.
- Review logs for rendering errors.