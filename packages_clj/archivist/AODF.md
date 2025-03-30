# AODF/1.0 - COMPONENT: ARCHIVIST SERVICE

## META
- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-03-29
- COMPONENT_TYPE: service
- DOCUMENTATION_SCOPE: orientation

## IDENTITY
- ID: archivist
- PATH: packages_clj/archivist/
- NAMESPACE: io.relica.archivist
- DESCRIPTION: "Persistent data storage service for simulation results and application state"

## FUNCTION
- PRIMARY_ROLE: data_persistence
- PROTOCOLS: [websocket]
- DATA_HANDLED: [simulation_results, configurations, application_state]
- PERSISTENCE_TYPE: database

## STRUCTURE
- ENTRY_POINT: {file: "src/io/relica/archivist/core.clj", function: "start"}
- COMPONENTS: {file: "src/io/relica/archivist/components.clj"}
- HANDLERS: {directory: "src/io/relica/archivist/io/ws_handlers/"}
- DATABASE: {directory: "src/io/relica/archivist/db/"}
- SPECS: {directory: "src/io/relica/archivist/specs/"}

## RELATIONSHIPS
- PROVIDES_TO: [
    {component: "portal", interface: "archivist_client", data: "stored_records"},
    {component: "clarity", interface: "archivist_client", data: "stored_records"},
    {component: "aperture", interface: "archivist_client", data: "stored_records"}
  ]
- CONSUMES_FROM: [
    {component: "aperture", interface: "websocket", data: "simulation_results"}
  ]
- IMPLEMENTS: [
    {protocol: "websocket_server", specification: "src/io/relica/archivist/specs/ws_protocol.clj"}
  ]

## EXECUTION_FLOW
- STARTUP: [
    {step: 1, file: "src/io/relica/archivist/core.clj", function: "start"},
    {step: 2, file: "src/io/relica/archivist/components.clj", function: "start-components"},
    {step: 3, file: "src/io/relica/archivist/io/ws_server.clj", function: "start-server"}
  ]
- MESSAGE_HANDLING: [
    {step: 1, file: "src/io/relica/archivist/io/ws_server.clj", function: "on-message"},
    {step: 2, file: "src/io/relica/archivist/io/ws_handlers.clj", function: "handle-message"},
    {step: 3, file: "src/io/relica/archivist/io/ws_handlers/*.clj", function: "handle-*"}
  ]

## OPERATIONS
- STORE_DATA: {file: "src/io/relica/archivist/io/ws_handlers/storage.clj", function: "handle-store"}
- QUERY_DATA: {file: "src/io/relica/archivist/io/ws_handlers/query.clj", function: "handle-query"}
- RETRIEVE_ENTRY: {file: "src/io/relica/archivist/io/ws_handlers/retrieval.clj", function: "handle-get"}

## CLIENT_USAGE
- CLIENT_IMPLEMENTATION: {file: "packages_clj/common/src/io/relica/common/io/archivist_client.clj"}
- EXAMPLES: [
    {file: "packages_clj/portal/src/io/relica/portal/io/client_instances.clj", function: "init-archivist-client"},
    {file: "packages_clj/aperture/src/io/relica/aperture/services/environment.clj", function: "store-simulation-results"}
  ]

## TROUBLESHOOTING
- CONNECTION_ISSUES: {file: "src/io/relica/archivist/io/ws_server.clj"}
- DATA_PERSISTENCE_FAILURES: {file: "src/io/relica/archivist/db/operations.clj"}
- MESSAGE_HANDLING_ERRORS: {file: "src/io/relica/archivist/io/ws_handlers/*.clj"}

## DEPLOYMENT
- CONTAINER: "archivist"
- ENV_VARS: [
    {name: "DB_HOST", purpose: "database connection hostname"},
    {name: "DB_PORT", purpose: "database connection port"},
    {name: "WS_PORT", purpose: "websocket server port"}
  ]
- COMPOSE_SERVICE: {file: "docker-compose.yml", service: "archivist"}

## CONCEPTUAL_MODEL
- CENTRAL_ABSTRACTIONS: [
    {name: "record", description: "A stored data entity with metadata"},
    {name: "query", description: "A specification for filtering stored records"},
    {name: "websocket-message", description: "Protocol message for client-server communication"}
  ]
- DATA_FLOW: "Clients connect via WebSocket → Send request messages → Server processes requests → Database operations occur → Response messages returned"
