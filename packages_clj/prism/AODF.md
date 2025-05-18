# AODF/1.0 - COMPONENT: PRISM SERVICE

## META

- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-05-17
- COMPONENT_TYPE: service
- DOCUMENTATION_SCOPE: orientation

## IDENTITY

- ID: prism
- PATH: packages_clj/prism/
- NAMESPACE: io.relica.prism
- DESCRIPTION: "System initialization and monitoring service for managing setup and operational states"

## FUNCTION

- PRIMARY_ROLE: system_management
- PROTOCOLS: [websocket]
- DATA_HANDLED: [system_state, setup_configuration, operational_status]
- PERSISTENCE_TYPE: stateful

## STRUCTURE

- ENTRY_POINT: {file: "src/io/relica/prism/core.clj", function: "-main"}
- COMPONENTS: {file: "src/io/relica/prism/setup.clj"}
- HANDLERS: {file: "src/io/relica/prism/io/ws_handlers.clj"}
- SERVICES: {directory: "src/io/relica/prism/services/"}
- CONFIG: {file: "src/io/relica/prism/config.clj"}

## RELATIONSHIPS

- PROVIDES_TO: [
  {component: "portal", interface: "websocket", data: "system_status"}
  ]
- CONSUMES_FROM: [
  {component: "archivist", interface: "archivist_client", data: "stored_records"}
  ]
- IMPLEMENTS: [
  {protocol: "websocket_server", specification: "src/io/relica/prism/io/ws_server.clj"}
  ]

## EXECUTION_FLOW

- STARTUP: [
  {step: 1, file: "src/io/relica/prism/core.clj", function: "-main"},
  {step: 2, file: "src/io/relica/prism/setup.clj", function: "initialize-system"},
  {step: 3, file: "src/io/relica/prism/io/ws_server.clj", function: "start-server"}
  ]
- MESSAGE_HANDLING: [
  {step: 1, file: "src/io/relica/prism/io/ws_server.clj", function: "on-message"},
  {step: 2, file: "src/io/relica/prism/io/ws_handlers.clj", function: "handle-ws-message"},
  {step: 3, file: "src/io/relica/prism/services/status_service.clj", function: "process-status"}
  ]

## OPERATIONS

- SYSTEM_INIT: {file: "src/io/relica/prism/setup.clj", function: "initialize-system"}
- STATUS_CHECK: {file: "src/io/relica/prism/services/status_service.clj", function: "check-status"}
- CONFIG_UPDATE: {file: "src/io/relica/prism/services/config_service.clj", function: "update-config"}

## CLIENT_USAGE

- CLIENT_CONNECTION: {protocol: "websocket", endpoint: "/ws"}
- EXAMPLE_REQUEST: {
  type: ":system/status",
  data: {component: "component-name"}
  }
- EXAMPLE_RESPONSE: {
  status: "operational",
  metrics: {},
  last_update: "timestamp"
  }

## TROUBLESHOOTING

- INITIALIZATION_ISSUES: {file: "src/io/relica/prism/setup.clj"}
- STATUS_MONITORING: {file: "src/io/relica/prism/services/status_service.clj"}
- CONFIGURATION_ERRORS: {file: "src/io/relica/prism/services/config_service.clj"}

## DEPLOYMENT

- CONTAINER: "prism"
- ENV_VARS: [
  {name: "WS_PORT", purpose: "websocket server port"},
  {name: "ARCHIVIST_HOST", purpose: "hostname for archivist service"},
  {name: "ARCHIVIST_PORT", purpose: "port for archivist service"}
  ]
- COMPOSE_SERVICE: {file: "docker-compose.yml", service: "prism"}

## CONCEPTUAL_MODEL

- CENTRAL_ABSTRACTIONS: [
  {name: "system", description: "Overall system state and configuration"},
  {name: "component", description: "Individual service or module in the system"},
  {name: "status", description: "Operational state and health metrics"},
  {name: "configuration", description: "System and component settings"}
  ]
- DATA_FLOW: "Client requests system status → Server checks component states → Server aggregates metrics → Status information returned to client"

## Socket Interfaces (Updated 2025-05-17)

Note: This documentation represents the latest socket interface analysis as of 2025-05-17. Earlier documentation in this file may contain historical/deprecated information that should be verified against current implementations.

### System Setup and Initialization

- System bootstrap sequence
- Component initialization order
- Dependency verification
- Configuration validation
- Resource allocation
- Service registration

### Status Monitoring Interface

- Real-time component status
- Health check endpoints
- Performance metrics
- Resource utilization
- Error rate tracking
- System alerts

### Message Format

- Standard format: :prism.<domain>/<action>
- Domains: system, component, config, status
- Actions: init, check, update, monitor
- Status response format includes:
  - Component state
  - Health metrics
  - Resource usage
  - Alert conditions

### Setup/Operations Separation

- Setup Phase:

  - System initialization
  - Component registration
  - Configuration loading
  - Resource allocation

- Operations Phase:
  - Status monitoring
  - Health checking
  - Metric collection
  - Alert management
