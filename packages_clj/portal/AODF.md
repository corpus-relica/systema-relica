# AODF/1.0 - COMPONENT: PORTAL SERVICE

## META

- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-03-29
- COMPONENT_TYPE: service
- DOCUMENTATION_SCOPE: orientation

## IDENTITY

- ID: portal
- PATH: packages_clj/portal/
- NAMESPACE: io.relica.portal
- DESCRIPTION: "Gateway service that provides HTTP and WebSocket APIs for frontend clients to interact with the backend services"

## FUNCTION

- PRIMARY_ROLE: api_gateway
- PROTOCOLS: [http, websocket]
- DATA_HANDLED: [user_authentication, client_requests, service_responses]
- PERSISTENCE_TYPE: stateless

## STRUCTURE

- ENTRY_POINT: {file: "src/io/relica/portal/core.clj", function: "-main"}
- ROUTES: {file: "src/io/relica/portal/routes.clj"}
- HTTP_HANDLERS: {file: "src/io/relica/portal/handlers/http.clj"}
- WS_HANDLERS: {file: "src/io/relica/portal/handlers/websocket.clj"}
- MIDDLEWARE: {file: "src/io/relica/portal/middleware.clj"}
- AUTH: {directory: "src/io/relica/portal/auth/"}
- CLIENT_INSTANCES: {file: "src/io/relica/portal/io/client_instances.clj"}

## RELATIONSHIPS

- PROVIDES_TO: [
  {component: "frontend_clients", interface: "http_api", data: "system_data"},
  {component: "frontend_clients", interface: "websocket", data: "realtime_updates"}
  ]
- CONSUMES_FROM: [
  {component: "archivist", interface: "archivist_client", data: "stored_records"},
  {component: "clarity", interface: "clarity_client", data: "semantic_models"},
  {component: "aperture", interface: "aperture_client", data: "environment_data"},
  {component: "nous", interface: "nous_client", data: "ai_responses"}
  ]
- IMPLEMENTS: [
  {protocol: "http_server", specification: "src/io/relica/portal/routes.clj"},
  {protocol: "websocket_server", specification: "src/io/relica/portal/handlers/http.clj:ws-handler"}
  ]

## EXECUTION_FLOW

- STARTUP: [
  {step: 1, file: "src/io/relica/portal/core.clj", function: "-main"},
  {step: 2, file: "src/io/relica/portal/core.clj", function: "start!"},
  {step: 3, file: "src/io/relica/portal/io/client_instances.clj", function: "initialize-clients"}
  ]
- REQUEST_HANDLING: [
  {step: 1, file: "src/io/relica/portal/routes.clj", function: "app-routes"},
  {step: 2, file: "src/io/relica/portal/middleware.clj", function: "wrap-jwt-auth"},
  {step: 3, file: "src/io/relica/portal/handlers/http.clj", function: "handle-*"}
  ]
- WEBSOCKET_HANDLING: [
  {step: 1, file: "src/io/relica/portal/handlers/http.clj", function: "ws-handler"},
  {step: 2, file: "src/io/relica/portal/handlers/websocket.clj", function: "handle-ws-message"},
  {step: 3, file: "src/io/relica/portal/handlers/websocket.clj", function: "handle-*"}
  ]

## OPERATIONS

- AUTH: {file: "src/io/relica/portal/handlers/websocket.clj", function: "handle-auth"}
- GET_ENVIRONMENT: {file: "src/io/relica/portal/handlers/http.clj", function: "handle-get-environment"}
- GET_MODEL: {file: "src/io/relica/portal/handlers/http.clj", function: "handle-get-model"}
- SELECT_ENTITY: {file: "src/io/relica/portal/handlers/websocket.clj", function: "handle-select-entity"}
- LOAD_ENTITIES: {file: "src/io/relica/portal/handlers/websocket.clj", function: "handle-load-entities"}

## CLIENT_USAGE

- HTTP_API: {base_url: "/api", authentication: "JWT in Authorization header"}
- WEBSOCKET_CONNECTION: {endpoint: "/chsk", authentication: "token parameter"}
- EVENT_BROADCASTING: {mechanism: "WebSocket messages to clients in same environment"}

## TROUBLESHOOTING

- AUTH_ISSUES: {file: "src/io/relica/portal/auth/jwt.clj", function: "validate-jwt"}
- CONNECTION_ISSUES: {file: "src/io/relica/portal/handlers/http.clj", function: "ws-handler"}
- CLIENT_COMMUNICATION: {file: "src/io/relica/portal/io/client_instances.clj"}

## DEPLOYMENT

- CONTAINER: "portal"
- ENV_VARS: [
  {name: "PORT", purpose: "HTTP server port"},
  {name: "JWT_SECRET", purpose: "Secret for JWT token validation"},
  {name: "ARCHIVIST_HOST", purpose: "hostname for archivist service"},
  {name: "CLARITY_HOST", purpose: "hostname for clarity service"},
  {name: "APERTURE_HOST", purpose: "hostname for aperture service"}
  ]
- COMPOSE_SERVICE: {file: "docker-compose.yml", service: "portal"}

## CONCEPTUAL_MODEL

- CENTRAL_ABSTRACTIONS: [
  {name: "route", description: "HTTP endpoint that maps to a specific handler function"},
  {name: "handler", description: "Function that processes requests and returns responses"},
  {name: "middleware", description: "Function that intercepts and potentially modifies requests/responses"},
  {name: "client", description: "Connection to another service in the system"}
  ]
- DATA_FLOW: "Frontend client sends request → Portal authenticates request → Portal forwards request to appropriate backend service → Portal receives response → Portal transforms response if needed → Portal returns response to client"

## Socket Interfaces (Updated 2025-05-17)

Note: This documentation represents the latest socket interface analysis as of 2025-05-17. Earlier documentation in this file may contain historical/deprecated information that should be verified against current implementations.

### Central Hub Communication Role

- Acts as primary WebSocket gateway
- Manages client authentication
- Routes messages to appropriate services
- Handles service responses
- Maintains client session state
- Provides real-time event broadcasting

### Event Routing System

- Dynamic service discovery
- Message validation and transformation
- Error handling and recovery
- Load balancing across services
- Circuit breaking for service protection
- Response aggregation capabilities

### Connection State Management

- Authentication state tracking
- Session persistence
- Client capability mapping
- Service availability monitoring
- Connection health checks
- Reconnection handling

### Component Event Namespacing

- Service-specific event prefixes
- Standardized routing patterns
- Event priority levels
- Broadcast groups
- Client-specific channels
- System-wide notifications
