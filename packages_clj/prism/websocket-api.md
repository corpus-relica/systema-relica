# Prism WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Prism component of the Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `prism`)
- `resource` is the entity or concept being operated on (e.g., `setup`, `connection`)
- `command` is the action being performed (e.g., `get-status`, `start`, `create-user`)

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **Setup Operations**: Operations related to system setup and initialization
3. **System Operations**: Operations related to application status and connection management (common across modules)
4. **Broadcast Events**: Messages sent to all connected clients

## Message Reference Overview

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/get-status` | Get the current setup status |

### Setup Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/start` | Start the setup sequence |
| `:prism.setup/create-user` | Create an admin user |
| `:prism.setup/process-stage` | Process the current setup stage |

### System Operations (Common across modules)

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |
| `:relica.connection/open` | WebSocket connection opened |
| `:relica.connection/close` | WebSocket connection closed |

### Broadcast Events

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/event` | Setup status update event |

## Individual Message Documentation

Below is the detailed documentation for each message supported by the Prism component.

---

## `:prism.setup/get-status`

**Type:** Command

**Component:** Prism

**Resource:** Setup

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; No required fields
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :status string "Current setup status (e.g., 'not_started', 'in_progress', 'completed')"
    :stage string "Current setup stage (if in progress)"
    :progress number "Setup progress percentage (0-100)"
    :completed-stages [string] "List of completed setup stages"
    :remaining-stages [string] "List of remaining setup stages"
  }
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves the current status of the system setup process. This includes information about the setup progress, current stage, and remaining stages.

### Examples

```clojure
;; Example request
{:type :prism.setup/get-status
 :payload {}}

;; Example success response (setup not started)
{:success true
 :data {
   :status "not_started"
   :stage nil
   :progress 0
   :completed-stages []
   :remaining-stages ["initialize_system", "create_admin_user", "configure_services"]
 }}

;; Example success response (setup in progress)
{:success true
 :data {
   :status "in_progress"
   :stage "create_admin_user"
   :progress 33
   :completed-stages ["initialize_system"]
   :remaining-stages ["create_admin_user", "configure_services"]
 }}

;; Example success response (setup completed)
{:success true
 :data {
   :status "completed"
   :stage nil
   :progress 100
   :completed-stages ["initialize_system", "create_admin_user", "configure_services"]
   :remaining-stages []
 }}

;; Example error response
{:success false
 :error {
   :code "internal-error"
   :type "system-error"
   :message "Failed to retrieve setup status"
 }}
```

### Related Messages

- `:prism.setup/start` - Start the setup process
- `:prism.setup/event` - Broadcast event for setup status updates

---

## `:prism.setup/start`

**Type:** Command

**Component:** Prism

**Resource:** Setup

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; No required fields
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :status string "Updated setup status (should be 'in_progress')"
    :stage string "Initial setup stage"
    :message string "Status message"
  }
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Initiates the system setup process. This command will start the setup sequence and transition the system to the first setup stage.

### Examples

```clojure
;; Example request
{:type :prism.setup/start
 :payload {}}

;; Example success response
{:success true
 :data {
   :status "in_progress"
   :stage "initialize_system"
   :message "Setup process started"
 }}

;; Example error response (setup already in progress)
{:success false
 :error {
   :code "invalid-state"
   :type "business-rule-violation"
   :message "Setup is already in progress"
 }}

;; Example error response (setup already completed)
{:success false
 :error {
   :code "invalid-state"
   :type "business-rule-violation"
   :message "Setup is already completed"
 }}
```

### Related Messages

- `:prism.setup/get-status` - Get the current setup status
- `:prism.setup/event` - Broadcast event for setup status updates
- `:prism.setup/process-stage` - Process the current setup stage

---

## `:prism.setup/create-user`

**Type:** Command

**Component:** Prism

**Resource:** Setup

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :username string "Username for the admin user"
  :password string "Password for the admin user"
  :confirmPassword string "Password confirmation (must match password)"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :user {
      :id string "User ID"
      :username string "Username"
      :created-at string "Creation timestamp"
      :role string "User role (should be 'admin')"
    }
    :setup-status {
      :status string "Updated setup status"
      :stage string "Current setup stage"
      :progress number "Updated setup progress percentage"
    }
  }
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Creates an administrator user during the system setup process. This command is typically used in the "create_admin_user" stage of the setup process.

### Examples

```clojure
;; Example request
{:type :prism.setup/create-user
 :payload {
   :username "admin"
   :password "securePassword123"
   :confirmPassword "securePassword123"
 }}

;; Example success response
{:success true
 :data {
   :user {
     :id "user-123"
     :username "admin"
     :created-at "2025-05-18T21:45:00Z"
     :role "admin"
   }
   :setup-status {
     :status "in_progress"
     :stage "configure_services"
     :progress 66
   }
 }}

;; Example error response (passwords don't match)
{:success false
 :error {
   :code "validation-error"
   :type "input-validation"
   :message "Passwords do not match"
 }}

;; Example error response (invalid setup stage)
{:success false
 :error {
   :code "invalid-state"
   :type "business-rule-violation"
   :message "Cannot create user in current setup stage"
 }}
```

### Related Messages

- `:prism.setup/get-status` - Get the current setup status
- `:prism.setup/event` - Broadcast event for setup status updates

---

## `:prism.setup/process-stage`

**Type:** Command

**Component:** Prism

**Resource:** Setup

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; No required fields
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :status string "Updated setup status"
    :stage string "Current or next setup stage"
    :progress number "Updated setup progress percentage"
    :message string "Status message"
    :completed-stages [string] "Updated list of completed stages"
    :remaining-stages [string] "Updated list of remaining stages"
  }
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Processes the current setup stage and advances to the next stage if the current stage is completed successfully. This command is used to progress through the setup sequence.

### Examples

```clojure
;; Example request
{:type :prism.setup/process-stage
 :payload {}}

;; Example success response (stage completed, moving to next)
{:success true
 :data {
   :status "in_progress"
   :stage "configure_services"
   :progress 66
   :message "Initialized system successfully, moving to service configuration"
   :completed-stages ["initialize_system", "create_admin_user"]
   :remaining-stages ["configure_services"]
 }}

;; Example success response (all stages completed)
{:success true
 :data {
   :status "completed"
   :stage nil
   :progress 100
   :message "Setup completed successfully"
   :completed-stages ["initialize_system", "create_admin_user", "configure_services"]
   :remaining-stages []
 }}

;; Example error response (stage processing failed)
{:success false
 :error {
   :code "processing-error"
   :type "system-error"
   :message "Failed to process current stage"
   :details {
     :stage "configure_services"
     :reason "Database connection failed"
   }
 }}
```

### Related Messages

- `:prism.setup/get-status` - Get the current setup status
- `:prism.setup/start` - Start the setup process
- `:prism.setup/event` - Broadcast event for setup status updates

---

## `:relica.app/heartbeat`

**Type:** Command

**Component:** Relica (Common)

**Resource:** App

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :timestamp long "Current timestamp in milliseconds"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :received-at long "Server timestamp when heartbeat was received"
    :server-time string "Formatted server time"
  }
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
  }
}
```

### Description

Sends a heartbeat message to maintain the WebSocket connection and verify that both client and server are still active. Clients should send heartbeats periodically (typically every 30 seconds).

### Examples

```clojure
;; Example request
{:type :relica.app/heartbeat
 :payload {
   :timestamp 1716183600000
 }}

;; Example success response
{:success true
 :data {
   :received-at 1716183600050
   :server-time "2025-05-18T21:46:40Z"
 }}
```

### Related Messages

- `:relica.connection/open` - WebSocket connection opened
- `:relica.connection/close` - WebSocket connection closed

---

## `:relica.connection/open`

**Type:** Event

**Component:** Relica (Common)

**Resource:** Connection

**Direction:** Server→Client

### Payload Schema

```clojure
{
  :connection-id string "Unique identifier for the connection"
  :connected-at long "Timestamp when connection was established"
  :client-info {
    :ip string "Client IP address"
    :user-agent string "Client user agent string"
  }
}
```

### Description

Event sent by the server when a WebSocket connection is successfully established. This is typically the first message received by the client after connecting.

### Examples

```clojure
;; Example event
{:type :relica.connection/open
 :payload {
   :connection-id "conn-123456"
   :connected-at 1716183600000
   :client-info {
     :ip "192.168.1.100"
     :user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
   }
 }}
```

### Related Messages

- `:relica.connection/close` - WebSocket connection closed
- `:relica.app/heartbeat` - Client heartbeat to maintain connection

---

## `:relica.connection/close`

**Type:** Event

**Component:** Relica (Common)

**Resource:** Connection

**Direction:** Server→Client

### Payload Schema

```clojure
{
  :connection-id string "Unique identifier for the connection"
  :connected-at long "Timestamp when connection was established"
  :disconnected-at long "Timestamp when connection was closed"
  :duration long "Connection duration in milliseconds"
  :reason string "Reason for connection closure"
}
```

### Description

Event sent by the server when a WebSocket connection is closed. This may be due to a client disconnect request, server shutdown, or connection timeout.

### Examples

```clojure
;; Example event
{:type :relica.connection/close
 :payload {
   :connection-id "conn-123456"
   :connected-at 1716183600000
   :disconnected-at 1716183900000
   :duration 300000
   :reason "Client requested disconnect"
 }}
```

### Related Messages

- `:relica.connection/open` - WebSocket connection opened
- `:relica.app/heartbeat` - Client heartbeat to maintain connection

---

## `:prism.setup/event`

**Type:** Event

**Component:** Prism

**Resource:** Setup

**Direction:** Broadcast

### Payload Schema

```clojure
{
  :status string "Current setup status"
  :stage string "Current setup stage (if in progress)"
  :progress number "Setup progress percentage (0-100)"
  :message string "Status message"
  :timestamp long "Timestamp when the event was generated"
  :completed-stages [string] "List of completed setup stages"
  :remaining-stages [string] "List of remaining setup stages"
}
```

### Description

Broadcast event sent to all connected clients when the setup status changes. This allows clients to receive real-time updates about the setup process without polling.

### Examples

```clojure
;; Example event (setup started)
{:type :prism.setup/event
 :payload {
   :status "in_progress"
   :stage "initialize_system"
   :progress 0
   :message "Setup process started"
   :timestamp 1716183600000
   :completed-stages []
   :remaining-stages ["initialize_system", "create_admin_user", "configure_services"]
 }}

;; Example event (stage completed)
{:type :prism.setup/event
 :payload {
   :status "in_progress"
   :stage "create_admin_user"
   :progress 33
   :message "System initialization completed"
   :timestamp 1716183660000
   :completed-stages ["initialize_system"]
   :remaining-stages ["create_admin_user", "configure_services"]
 }}

;; Example event (setup completed)
{:type :prism.setup/event
 :payload {
   :status "completed"
   :stage nil
   :progress 100
   :message "Setup completed successfully"
   :timestamp 1716183900000
   :completed-stages ["initialize_system", "create_admin_user", "configure_services"]
   :remaining-stages []
 }}
```

### Related Messages

- `:prism.setup/get-status` - Get the current setup status
- `:prism.setup/start` - Start the setup process
- `:prism.setup/process-stage` - Process the current setup stage

## Implementation Notes

### Message Handling

All messages follow a standard request-response pattern, where the client sends a message with a specific type and payload, and the server responds with a result. Broadcast events are sent by the server to all connected clients without a specific request.

### Error Handling

When an operation fails, the server will respond with an error object containing:
- `code`: A machine-readable error code
- `type`: The category of error
- `message`: A human-readable error message
- `details`: Additional error details (optional)

Common error types include:
- `input-validation`: Invalid input data
- `business-rule-violation`: Operation violates business rules
- `system-error`: Internal system error
- `not-found`: Requested resource not found
- `unauthorized`: User not authorized for the operation

### Response Format

All responses follow a standard format:

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {...} "Response data (only present if success is true)"
  :error {...} "Error information (only present if success is false)"
}
```

### Performance Considerations

- The heartbeat interval should be set to 30 seconds to maintain the connection without excessive network traffic
- For long-running operations like setup stages, the client should implement appropriate timeout handling