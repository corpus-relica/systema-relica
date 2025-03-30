# AODF/1.0 - COMPONENT: APERTURE SERVICE

## META
- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-03-29
- COMPONENT_TYPE: service
- DOCUMENTATION_SCOPE: orientation

## IDENTITY
- ID: aperture
- PATH: packages_clj/aperture/
- NAMESPACE: io.relica.aperture
- DESCRIPTION: "Environment management service for handling user environments and entity relationships"

## FUNCTION
- PRIMARY_ROLE: environment_management
- PROTOCOLS: [websocket]
- DATA_HANDLED: [user_environments, entities, facts, relationships]
- PERSISTENCE_TYPE: external_archivist

## STRUCTURE
- ENTRY_POINT: {file: "src/io/relica/aperture/core.clj", function: "-main"}
- COMPONENTS: {file: "src/io/relica/aperture/components.clj"}
- HANDLERS: {file: "src/io/relica/aperture/io/ws_handlers.clj"}
- SERVICES: {directory: "src/io/relica/aperture/services/"}
- CONFIG: {file: "src/io/relica/aperture/config.clj"}

## RELATIONSHIPS
- PROVIDES_TO: [
    {component: "portal", interface: "websocket", data: "environment_data"}
  ]
- CONSUMES_FROM: [
    {component: "archivist", interface: "archivist_client", data: "stored_records"}
  ]
- IMPLEMENTS: [
    {protocol: "websocket_server", specification: "src/io/relica/aperture/io/ws_server.clj"}
  ]

## EXECUTION_FLOW
- STARTUP: [
    {step: 1, file: "src/io/relica/aperture/core.clj", function: "-main"},
    {step: 2, file: "src/io/relica/aperture/components.clj", function: "start-system"},
    {step: 3, file: "src/io/relica/aperture/components.clj", function: "websocket-server"},
    {step: 4, file: "src/io/relica/aperture/components.clj", function: "environment-service"}
  ]
- MESSAGE_HANDLING: [
    {step: 1, file: "src/io/relica/aperture/io/ws_server.clj", function: "on-message"},
    {step: 2, file: "src/io/relica/aperture/io/ws_handlers.clj", function: "handle-ws-message"},
    {step: 3, file: "src/io/relica/aperture/services/environment_service.clj", function: "various-operations"}
  ]

## OPERATIONS
- ENVIRONMENT_GET: {file: "src/io/relica/aperture/io/ws_handlers.clj", function: "handle-ws-message :environment/get"}
- ENVIRONMENT_LIST: {file: "src/io/relica/aperture/io/ws_handlers.clj", function: "handle-ws-message :environment/list"}
- ENVIRONMENT_CREATE: {file: "src/io/relica/aperture/io/ws_handlers.clj", function: "handle-ws-message :environment/create"}
- LOAD_ENTITY: {file: "src/io/relica/aperture/services/environment_service.clj", function: "load-entity"}
- UNLOAD_ENTITY: {file: "src/io/relica/aperture/services/environment_service.clj", function: "unload-entity"}
- LOAD_CONNECTIONS: {file: "src/io/relica/aperture/services/environment_service.clj", function: "load-connections"}

## CLIENT_USAGE
- CLIENT_CONNECTION: {protocol: "websocket", endpoint: "/ws"}
- EXAMPLE_REQUEST: {
    type: ":environment/get",
    data: {user-id: "user-identifier", environment-id: "env-id"}
  }
- EXAMPLE_RESPONSE: {
    id: "env-id",
    name: "Environment Name",
    facts: [],
    selected_entity: null
  }

## TROUBLESHOOTING
- CONNECTION_ISSUES: {file: "src/io/relica/aperture/io/ws_server.clj"}
- ENVIRONMENT_LOADING_FAILURES: {file: "src/io/relica/aperture/services/environment_service.clj"}
- ENTITY_RELATIONSHIP_ERRORS: {file: "src/io/relica/aperture/services/environment_service.clj", functions: ["load-connections", "load-composition"]}

## DEPLOYMENT
- CONTAINER: "aperture"
- ENV_VARS: [
    {name: "WS_PORT", purpose: "websocket server port"},
    {name: "ARCHIVIST_HOST", purpose: "hostname for archivist service"},
    {name: "ARCHIVIST_PORT", purpose: "port for archivist service"}
  ]
- COMPOSE_SERVICE: {file: "docker-compose.yml", service: "aperture"}

## CONCEPTUAL_MODEL
- CENTRAL_ABSTRACTIONS: [
    {name: "environment", description: "A user workspace containing loaded entities and their relationships"},
    {name: "entity", description: "A semantic object with properties and relationships"},
    {name: "fact", description: "A piece of information about an entity or relationship"},
    {name: "connection", description: "A relationship between entities"}
  ]
- DATA_FLOW: "Client requests environment data → Server loads entities and relationships from Archivist → Server transforms data into environment model → Environment data returned to client"
