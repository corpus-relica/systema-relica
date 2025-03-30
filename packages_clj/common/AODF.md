# AODF/1.0 - COMPONENT: COMMON LIBRARY

## META
- FORMAT_VERSION: 1.0
- CREATION_DATE: 2025-03-29
- COMPONENT_TYPE: library
- DOCUMENTATION_SCOPE: orientation

## IDENTITY
- ID: common
- PATH: packages_clj/common/
- NAMESPACE: io.relica.common
- DESCRIPTION: "Shared library providing common functionality and client implementations for inter-service communication"

## FUNCTION
- PRIMARY_ROLE: shared_utilities
- PROTOCOLS: [websocket]
- DATA_HANDLED: [client_requests, service_responses, events]
- PERSISTENCE_TYPE: stateless

## STRUCTURE
- CLIENT_IMPLEMENTATIONS: {directory: "src/io/relica/common/io/"}
- WEBSOCKET_FRAMEWORK: {directory: "src/io/relica/common/websocket/"}
- EVENT_SYSTEM: {directory: "src/io/relica/common/events/"}

## RELATIONSHIPS
- PROVIDES_TO: [
    {component: "portal", interface: "client_libraries", data: "service_communication"},
    {component: "clarity", interface: "client_libraries", data: "service_communication"},
    {component: "aperture", interface: "client_libraries", data: "service_communication"}
  ]
- CONSUMES_FROM: []
- IMPLEMENTS: [
    {protocol: "websocket_client", specification: "src/io/relica/common/websocket/client.clj"},
    {protocol: "websocket_server", specification: "src/io/relica/common/websocket/server.clj"}
  ]

## EXECUTION_FLOW
- CLIENT_USAGE: [
    {step: 1, file: "src/io/relica/common/io/*_client.clj", function: "create-client"},
    {step: 2, file: "src/io/relica/common/io/*_client.clj", function: "connect!"},
    {step: 3, file: "src/io/relica/common/io/*_client.clj", function: "operation-method"}
  ]
- SERVER_USAGE: [
    {step: 1, file: "src/io/relica/common/websocket/server.clj", function: "create-server"},
    {step: 2, file: "src/io/relica/common/websocket/server.clj", function: "start!"},
    {step: 3, file: "src/io/relica/common/websocket/server.clj", function: "handle-ws-message"}
  ]

## OPERATIONS
- ARCHIVIST_CLIENT: {file: "src/io/relica/common/io/archivist_client.clj", protocol: "ArchivistOperations"}
- CLARITY_CLIENT: {file: "src/io/relica/common/io/clarity_client.clj", protocol: "ClarityOperations"}
- APERTURE_CLIENT: {file: "src/io/relica/common/io/aperture_client.clj", protocol: "ApertureOperations"}
- NOUS_CLIENT: {file: "src/io/relica/common/io/nous_client.clj", protocol: "NousOperations"}
- WEBSOCKET_CLIENT: {file: "src/io/relica/common/websocket/client.clj", protocol: "WebSocketClientProtocol"}
- WEBSOCKET_SERVER: {file: "src/io/relica/common/websocket/server.clj", protocol: "WebSocketServerProtocol"}

## CLIENT_USAGE
- ARCHIVIST_EXAMPLE: {
    code: "
    (def client (archivist/create-client))
    (archivist/connect! client)
    (archivist/execute-query client query params)
    "
  }
- WEBSOCKET_SERVER_EXAMPLE: {
    code: "
    (defmethod handle-ws-message :my-message-type [{:keys [?data ?reply-fn]}]
      (when ?reply-fn
        (?reply-fn {:success true :data processed-data})))
    "
  }

## TROUBLESHOOTING
- CONNECTION_ISSUES: {file: "src/io/relica/common/websocket/client.clj", function: "connect!"}
- MESSAGE_HANDLING_ERRORS: {file: "src/io/relica/common/websocket/server.clj", function: "ws-handler"}
- CLIENT_OPERATION_FAILURES: {file: "src/io/relica/common/io/*_client.clj", functions: ["execute-*", "get-*"]}

## DEPLOYMENT
- CONTAINER: "N/A - Library dependency"
- ENV_VARS: [
    {name: "ARCHIVIST_WS_URL", purpose: "WebSocket URL for archivist service"},
    {name: "CLARITY_WS_URL", purpose: "WebSocket URL for clarity service"},
    {name: "APERTURE_WS_URL", purpose: "WebSocket URL for aperture service"}
  ]

## CONCEPTUAL_MODEL
- CENTRAL_ABSTRACTIONS: [
    {name: "client", description: "A connection to a service with operations to interact with it"},
    {name: "protocol", description: "A set of operations that a client or server must implement"},
    {name: "message", description: "A structured data packet for communication between services"},
    {name: "handler", description: "A function that processes a specific type of message"}
  ]
- DATA_FLOW: "Service creates client → Client connects to target service → Client sends request message → Target service processes request → Target service sends response → Client receives and processes response"
