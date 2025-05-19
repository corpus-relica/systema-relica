# Clarity WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Clarity component of the Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `clarity`)
- `resource` is the entity or concept being operated on (e.g., `model`, `kind`, `individual`)
- `command` is the action being performed (e.g., `get`, `get-batch`)

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **System Operations**: Operations related to application status and connection management (common across modules)
3. **Broadcast Events**: Messages sent to all connected clients

## Message Reference Overview

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:clarity.model/get` | Get a semantic model by ID |
| `:clarity.model/get-batch` | Get multiple semantic models |
| `:clarity.kind/get` | Get a kind model by ID |
| `:clarity.individual/get` | Get an individual model by ID |

### System Operations (Common across modules)

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/status-request` | Request application status |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |
| `:relica.connection/open` | WebSocket connection opened |
| `:relica.connection/close` | WebSocket connection closed |

### Broadcast Events

| Identifier | Description |
| ---------- | ----------- |
| `:clarity.individual/event` | Individual model response event |

## Individual Message Documentation

Below is the detailed documentation for each message supported by the Clarity component.

---

## `:clarity.model/get`

**Type:** Command

**Component:** Clarity

**Resource:** Model

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the semantic model to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :model {
    ;; Semantic model data structure
    ;; Structure depends on the specific model type
  }
  :error {
    :code string "Error code (e.g., resource-not-found, internal-error)"
    :message string "Error message"
    :details map "Additional error details (optional)"
  }
}
```

### Description

Retrieves a semantic model by its unique identifier. The model contains the complete semantic model data structure.

### Examples

```clojure
;; Example request
{:type :clarity.model/get
 :payload {:uid "model-123"}}

;; Example success response
{:success true
 :model {
   :uid "model-123"
   :name "Pump System Model"
   :type "semantic-model"
   :created-at "2025-01-15T10:30:00Z"
   :updated-at "2025-05-10T14:22:15Z"
   ;; Additional model-specific data
 }}

;; Example error response
{:success false
 :error {
   :code "resource-not-found"
   :message "Model not found"
 }}
```

### Related Messages

- `:clarity.model/get-batch` - Get multiple semantic models

---

## `:clarity.model/get-batch`

**Type:** Command

**Component:** Clarity

**Resource:** Model

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [string] "Array of unique identifiers of the semantic models to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :models [
    {
      ;; Semantic model data structure
      ;; Structure depends on the specific model type
    }
    ;; More models...
  ]
  :error {
    :code string "Error code (e.g., resource-not-found, internal-error)"
    :message string "Error message"
    :details map "Additional error details (optional)"
  }
}
```

### Description

Retrieves multiple semantic models by their unique identifiers. Returns an array of model data structures.

### Examples

```clojure
;; Example request
{:type :clarity.model/get-batch
 :payload {:uids ["model-123", "model-456", "model-789"]}}

;; Example success response
{:success true
 :models [
   {:uid "model-123"
    :name "Pump System Model"
    :type "semantic-model"
    :created-at "2025-01-15T10:30:00Z"
    :updated-at "2025-05-10T14:22:15Z"
    ;; Additional model-specific data
   },
   {:uid "model-456"
    :name "Valve System Model"
    :type "semantic-model"
    :created-at "2025-02-20T09:15:00Z"
    :updated-at "2025-04-05T11:30:45Z"
    ;; Additional model-specific data
   }
   ;; Note: If a model is not found, it will be omitted from the results
 ]}

;; Example error response (when no models are found)
{:success false
 :error {
   :code "resource-not-found"
   :message "Models not found"
 }}
```

### Related Messages

- `:clarity.model/get` - Get a single semantic model

---

## `:clarity.kind/get`

**Type:** Command

**Component:** Clarity

**Resource:** Kind

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :kind-id string "Unique identifier of the kind model to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :model {
    ;; Kind model data structure
    ;; Contains kind-specific properties and relationships
  }
  :error {
    :code string "Error code (e.g., resource-not-found, internal-error)"
    :message string "Error message"
    :details map "Additional error details (optional)"
  }
}
```

### Description

Retrieves a kind model by its unique identifier. Kind models represent types or classes in the semantic model.

### Examples

```clojure
;; Example request
{:type :clarity.kind/get
 :payload {:kind-id "kind-123"}}

;; Example success response
{:success true
 :model {
   :uid "kind-123"
   :name "Pump"
   :type "kind"
   :created-at "2025-01-15T10:30:00Z"
   :updated-at "2025-05-10T14:22:15Z"
   :properties [
     {:name "flow-rate", :type "number", :unit "m3/s"},
     {:name "pressure", :type "number", :unit "Pa"}
   ]
   ;; Additional kind-specific data
 }}

;; Example error response
{:success false
 :error {
   :code "resource-not-found"
   :message "Kind not found"
 }}
```

### Related Messages

- `:clarity.model/get` - Get a semantic model
- `:clarity.individual/get` - Get an individual model

---

## `:clarity.individual/get`

**Type:** Command

**Component:** Clarity

**Resource:** Individual

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :individual-id string "Unique identifier of the individual model to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :model {
    ;; Individual model data structure
    ;; Contains individual-specific properties and relationships
  }
  :error {
    :code string "Error code (e.g., resource-not-found, internal-error)"
    :message string "Error message"
    :details map "Additional error details (optional)"
  }
}
```

### Description

Retrieves an individual model by its unique identifier. Individual models represent specific instances of kinds in the semantic model.

### Examples

```clojure
;; Example request
{:type :clarity.individual/get
 :payload {:individual-id "individual-123"}}

;; Example success response
{:success true
 :model {
   :uid "individual-123"
   :name "Pump-A1"
   :type "individual"
   :kind-id "kind-123"
   :created-at "2025-01-15T10:30:00Z"
   :updated-at "2025-05-10T14:22:15Z"
   :property-values [
     {:property "flow-rate", :value 0.5, :unit "m3/s"},
     {:property "pressure", :value 101325, :unit "Pa"}
   ]
   ;; Additional individual-specific data
 }}

;; Example error response
{:success false
 :error {
   :code "resource-not-found"
   :message "Individual not found"
 }}
```

### Related Messages

- `:clarity.model/get` - Get a semantic model
- `:clarity.kind/get` - Get a kind model
- `:clarity.individual/event` - Individual model response event

---

## `:relica.app/status-request`

**Type:** Command

**Component:** System

**Resource:** App

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
  :status string "Current application status (e.g., OK, degraded)"
  :timestamp number "Timestamp of the status (milliseconds since epoch)"
  :active-users number "Number of active users connected to the system"
}
```

### Description

Requests the current status of the application. This is a system-level operation common across all Relica components.

### Examples

```clojure
;; Example request
{:type :relica.app/status-request
 :payload {}}

;; Example response
{:status "OK"
 :timestamp 1716177600000
 :active-users 42}
```

### Related Messages

- `:relica.app/heartbeat` - Client heartbeat to maintain connection

---

## `:relica.app/heartbeat`

**Type:** Command

**Component:** System

**Resource:** App

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :timestamp number "Current client timestamp (milliseconds since epoch)"
}
```

### Response

```clojure
{
  ;; No response data
  ;; Server acknowledges the heartbeat by not responding
}
```

### Description

Sends a heartbeat from the client to the server to maintain the WebSocket connection and indicate that the client is still active.

### Examples

```clojure
;; Example request
{:type :relica.app/heartbeat
 :payload {:timestamp 1716177600000}}

;; No response
```

### Related Messages

- `:relica.app/status-request` - Request application status

---

## `:relica.connection/open`

**Type:** Event

**Component:** System

**Resource:** Connection

**Direction:** Server→Client

### Payload Schema

```clojure
{
  ;; No payload, this is a system event
}
```

### Description

Event triggered when a WebSocket connection is established. This is a system-level event common across all Relica components.

### Examples

```clojure
;; Example event
{:type :relica.connection/open}
```

### Related Messages

- `:relica.connection/close` - WebSocket connection closed

---

## `:relica.connection/close`

**Type:** Event

**Component:** System

**Resource:** Connection

**Direction:** Server→Client

### Payload Schema

```clojure
{
  ;; No payload, this is a system event
}
```

### Description

Event triggered when a WebSocket connection is closed. This is a system-level event common across all Relica components.

### Examples

```clojure
;; Example event
{:type :relica.connection/close}
```

### Related Messages

- `:relica.connection/open` - WebSocket connection opened

---

## `:clarity.individual/event`

**Type:** Event

**Component:** Clarity

**Resource:** Individual

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :individual-id string "Unique identifier of the individual model"
  :event-type string "Type of event (e.g., updated, created, deleted)"
  :timestamp number "Timestamp of the event (milliseconds since epoch)"
  :data {
    ;; Event-specific data
  }
}
```

### Description

Broadcast event sent when an individual model is updated, created, or deleted. This allows clients to stay synchronized with changes to individual models.

### Examples

```clojure
;; Example event
{:type :clarity.individual/event
 :payload {
   :individual-id "individual-123"
   :event-type "updated"
   :timestamp 1716177600000
   :data {
     :property "flow-rate"
     :old-value 0.4
     :new-value 0.5
     :unit "m3/s"
   }
 }}
```

### Related Messages

- `:clarity.individual/get` - Get an individual model

---

## Message Handling

Clients should implement handlers for all message types they expect to receive. For system events like `:relica.connection/open` and `:relica.connection/close`, clients should update their internal state accordingly.

## Error Handling

All command responses include a `:success` boolean field indicating whether the operation succeeded. If `:success` is `false`, an `:error` object will be included with details about the error.

Common error codes:
- `resource-not-found`: The requested resource does not exist
- `internal-error`: An unexpected error occurred on the server
- `validation-error`: The request payload failed validation

## Response Format

All successful responses follow a consistent format:
```clojure
{
  :success true
  :data { ... } ;; Operation-specific data
}
```

All error responses follow a consistent format:
```clojure
{
  :success false
  :error {
    :code string "Error code"
    :message string "Human-readable error message"
    :details map "Additional error details (optional)"
  }
}