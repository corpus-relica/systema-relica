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

## Socket Interfaces (Updated 2025-05-17)

Note: This documentation represents the latest socket interface analysis as of 2025-05-17. Earlier documentation in this file may contain historical/deprecated information that should be verified against current implementations.

### Socket Interface Characteristics

- Primary focus on environment operations and state management
- Stateful connections maintaining environment context
- Asynchronous event notifications for environment changes
- Secure websocket transport layer

### Operation Types

1. Get Operations

   - :aperture.environment/get - Retrieve environment details
   - :aperture.entity/get - Retrieve entity information
   - :aperture.relationship/get - Retrieve relationship data

2. Load Operations

   - :aperture.entity/load - Load entity into environment
   - :aperture.relationship/load - Load relationship connections
   - :aperture.composition/load - Load compositional structure

3. Unload Operations

   - :aperture.entity/unload - Remove entity from environment
   - :aperture.relationship/unload - Remove relationship from environment
   - :aperture.composition/unload - Remove compositional structure

4. Other Operations
   - :aperture.environment/create - Create new environment
   - :aperture.environment/delete - Delete existing environment
   - :aperture.environment/update - Update environment settings

### Message Format

- Standard format: :aperture.<domain>/<action>
- Domains: environment, entity, relationship, composition
- Actions: get, load, unload, create, delete, update
- Payload structure: {id: String, data: Map, options: Map}

### State Management Architecture

- Environment state tracking
- Entity loading states
- Relationship caching
- Change notification system
- Conflict resolution handling
