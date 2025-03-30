# AODF/1.0 - COMPONENT: CLARITY SERVICE

## META
- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-03-29
- COMPONENT_TYPE: service
- DOCUMENTATION_SCOPE: orientation

## IDENTITY
- ID: clarity
- PATH: packages_clj/clarity/
- NAMESPACE: io.relica.clarity
- DESCRIPTION: "Semantic model service for managing and retrieving ontological data models"

## FUNCTION
- PRIMARY_ROLE: semantic_model_management
- PROTOCOLS: [websocket]
- DATA_HANDLED: [physical_objects, aspects, roles, relations, occurrences, states]
- PERSISTENCE_TYPE: external_archivist

## STRUCTURE
- ENTRY_POINT: {file: "src/io/relica/clarity/core.clj", function: "start"}
- COMPONENTS: {file: "src/io/relica/clarity/components.clj"}
- HANDLERS: {file: "src/io/relica/clarity/io/ws_handlers.clj"}
- SERVICES: {directory: "src/io/relica/clarity/services/"}
- SPECS: {directory: "src/io/relica/clarity/specs/"}

## RELATIONSHIPS
- PROVIDES_TO: [
    {component: "portal", interface: "websocket", data: "semantic_models"}
  ]
- CONSUMES_FROM: [
    {component: "archivist", interface: "archivist_client", data: "stored_records"}
  ]
- IMPLEMENTS: [
    {protocol: "websocket_server", specification: "src/io/relica/clarity/io/ws_server.clj"}
  ]

## EXECUTION_FLOW
- STARTUP: [
    {step: 1, file: "src/io/relica/clarity/core.clj", function: "-main"},
    {step: 2, file: "src/io/relica/clarity/components.clj", function: "start-system"},
    {step: 3, file: "src/io/relica/clarity/components.clj", function: "ws-server-component"},
    {step: 4, file: "src/io/relica/clarity/components.clj", function: "semantic-model-service-component"}
  ]
- MESSAGE_HANDLING: [
    {step: 1, file: "src/io/relica/clarity/io/ws_server.clj", function: "on-message"},
    {step: 2, file: "src/io/relica/clarity/io/ws_handlers.clj", function: "handle-ws-message"},
    {step: 3, file: "src/io/relica/clarity/services/semantic_model_service.clj", function: "retrieve-semantic-model"}
  ]

## OPERATIONS
- GET_MODEL: {file: "src/io/relica/clarity/io/ws_handlers.clj", function: "handle-ws-message :get/model"}
- GET_MODELS: {file: "src/io/relica/clarity/io/ws_handlers.clj", function: "handle-ws-message :get/models"}
- RETRIEVE_SEMANTIC_MODEL: {file: "src/io/relica/clarity/services/semantic_model_service.clj", function: "retrieve-semantic-model"}

## CLIENT_USAGE
- CLIENT_CONNECTION: {protocol: "websocket", endpoint: "/ws"}
- EXAMPLE_REQUEST: {
    type: ":get/model",
    data: {uid: "numeric-id-of-model"}
  }
- EXAMPLE_RESPONSE: {
    success: true,
    model: {
      uid: "numeric-id",
      type: "entity-type",
      attributes: {}
    }
  }

## TROUBLESHOOTING
- CONNECTION_ISSUES: {file: "src/io/relica/clarity/io/ws_server.clj"}
- MODEL_RETRIEVAL_FAILURES: {file: "src/io/relica/clarity/services/semantic_model_service.clj"}
- DATA_TRANSFORMATION_ERRORS: {file: "src/io/relica/clarity/services/*_model_service.clj"}

## DEPLOYMENT
- CONTAINER: "clarity"
- ENV_VARS: [
    {name: "WS_PORT", purpose: "websocket server port"},
    {name: "ARCHIVIST_HOST", purpose: "hostname for archivist service"},
    {name: "ARCHIVIST_PORT", purpose: "port for archivist service"}
  ]
- COMPOSE_SERVICE: {file: "docker-compose.yml", service: "clarity"}

## CONCEPTUAL_MODEL
- CENTRAL_ABSTRACTIONS: [
    {name: "physical-object", description: "Representation of a physical entity in the model"},
    {name: "aspect", description: "Characteristic or property of an entity"},
    {name: "role", description: "Function or purpose an entity can fulfill"},
    {name: "relation", description: "Connection between entities"},
    {name: "occurrence", description: "Event or happening involving entities"},
    {name: "state", description: "Condition of an entity at a point in time"}
  ]
- DATA_FLOW: "Client requests model by ID → Server retrieves model data from Archivist → Server transforms raw data into semantic model → Semantic model returned to client"
