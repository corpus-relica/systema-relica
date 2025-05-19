# Aperture WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Aperture component of the Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `aperture`)
- `resource` is the entity or concept being operated on (e.g., `environment`, `entity`, `fact`)
- `command` is the action being performed (e.g., `get`, `load`, `unload`)

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that don't alter the environment
2. **Load Operations**: Operations that add data to the environment
3. **Unload Operations**: Operations that remove data from the environment
4. **Other Operations**: Operations that don't fit into the above categories (select, create, etc.)
5. **Broadcast Messages**: Messages sent to all connected clients

## Message Reference Overview

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.environment/get` | Get environment details |
| `:aperture.environment/list` | List available environments |

### Load Operations (Add data to environment)

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.search/load-text` | Load facts based on text search |
| `:aperture.search/load-uid` | Load facts based on UID search |
| `:aperture.specialization/load-fact` | Load a specific specialization fact |
| `:aperture.specialization/load` | Load specialization hierarchy |
| `:aperture.fact/load-related` | Load all facts related to an entity |
| `:aperture.entity/load` | Load a specific entity |
| `:aperture.entity/load-multiple` | Load multiple entities |
| `:aperture.subtype/load` | Load subtypes of an entity |
| `:aperture.subtype/load-cone` | Load subtypes cone of an entity |
| `:aperture.classification/load` | Load classified entities |
| `:aperture.classification/load-fact` | Load a specific classification fact |
| `:aperture.composition/load` | Load composition relationships |
| `:aperture.composition/load-in` | Load incoming composition relationships |
| `:aperture.connection/load` | Load connections from an entity |
| `:aperture.connection/load-in` | Load connections to an entity |

### Unload Operations (Remove data from environment)

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.entity/unload` | Unload a specific entity |
| `:aperture.entity/unload-multiple` | Unload multiple entities |
| `:aperture.subtype/unload-cone` | Unload subtypes cone of an entity |
| `:aperture.environment/clear` | Clear all entities from environment |

### Other Operations

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.environment/create` | Create a new environment |
| `:aperture.entity/select` | Select an entity |
| `:aperture.entity/deselect` | Deselect the currently selected entity |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |

### Broadcast Messages

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.facts/loaded` | Notify that facts were loaded |
| `:aperture.facts/unloaded` | Notify that facts were unloaded |
| `:aperture.entity/selected` | Notify that an entity was selected |
| `:aperture.entity/deselected` | Notify that an entity was deselected |

## Individual Message Documentation

Below is the detailed documentation for each message supported by the Aperture component.

---

## `:aperture.environment/get`

**Type:** Command

**Component:** Aperture

**Resource:** Environment

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the environment"
  :environment-id string "ID of the environment to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    ;; Environment data structure
    :id string "Environment ID"
    :name string "Environment name"
    :user-id string "Owner user ID"
    :created-at string "Creation timestamp"
    :updated-at string "Last update timestamp"
    :entities [...] "List of entities in the environment"
    :facts [...] "List of facts in the environment"
    :selected-entity string "Currently selected entity UID (if any)"
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

Retrieves the details of a specific environment by its ID. The environment contains all loaded entities, facts, and the currently selected entity.

### Examples

```clojure
;; Example request
{:type :aperture.environment/get
 :payload {:user-id "user-123"
           :environment-id "env-456"}}

;; Example success response
{:success true
 :data {
   :id "env-456"
   :name "Production Environment"
   :user-id "user-123"
   :created-at "2025-01-15T10:30:00Z"
   :updated-at "2025-05-10T14:22:15Z"
   :entities [{:uid "entity-789", :name "Pump System"}]
   :facts [{:uid "fact-101", :type "classification", ...}]
   :selected-entity "entity-789"
 }}

;; Example error response
{:success false
 :error {
   :code "resource-not-found"
   :type "database-error"
   :message "Environment not found"
 }}
```

### Related Messages

- `:aperture.environment/list` - List all environments for a user
- `:aperture.environment/create` - Create a new environment

---

## `:aperture.environment/list`

**Type:** Command

**Component:** Aperture

**Resource:** Environment

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the environments list"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data [
    {
      :id string "Environment ID"
      :name string "Environment name"
      :user-id string "Owner user ID"
      :created-at string "Creation timestamp"
      :updated-at string "Last update timestamp"
    }
    ;; More environments...
  ]
  :error {
    :code string "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Lists all environments available to the specified user. This provides a summary of each environment without including the full entity and fact data.

### Examples

```clojure
;; Example request
{:type :aperture.environment/list
 :payload {:user-id "user-123"}}

;; Example success response
{:success true
 :data [
   {:id "env-456"
    :name "Production Environment"
    :user-id "user-123"
    :created-at "2025-01-15T10:30:00Z"
    :updated-at "2025-05-10T14:22:15Z"}
   {:id "env-789"
    :name "Development Environment"
    :user-id "user-123"
    :created-at "2025-03-22T09:15:30Z"
    :updated-at "2025-05-12T11:45:20Z"}
 ]}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to list environments"
 }}
```

### Related Messages

- `:aperture.environment/get` - Get a specific environment
- `:aperture.environment/create` - Create a new environment

---

## `:aperture.environment/create`

**Type:** Command

**Component:** Aperture

**Resource:** Environment

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID creating the environment"
  :name string "Name for the new environment"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :id string "Environment ID"
    :name string "Environment name"
    :user-id string "Owner user ID"
    :created-at string "Creation timestamp"
    :updated-at string "Last update timestamp"
    :entities [] "Empty list of entities (new environment)"
    :facts [] "Empty list of facts (new environment)"
    :selected-entity nil "No selected entity in new environment"
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

Creates a new environment with the specified name for the given user. The new environment is initially empty with no entities, facts, or selected entity.

### Examples

```clojure
;; Example request
{:type :aperture.environment/create
 :payload {:user-id "user-123"
           :name "Test Environment"}}

;; Example success response
{:success true
 :data {
   :id "env-901"
   :name "Test Environment"
   :user-id "user-123"
   :created-at "2025-05-18T21:45:00Z"
   :updated-at "2025-05-18T21:45:00Z"
   :entities []
   :facts []
   :selected-entity nil
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to create environment"
 }}
```

### Related Messages

- `:aperture.environment/get` - Get a specific environment
- `:aperture.environment/list` - List all environments for a user

---

## `:aperture.fact/load-related`

**Type:** Command

**Component:** Aperture

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID to load facts into"
  :entity-uid string "UID of the entity to load related facts for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :environment {
      ;; Updated environment data with newly loaded facts
    }
    :facts [
      ;; Array of loaded facts
    ]
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

Loads all facts related to the specified entity into the environment. This includes facts where the entity is either the subject or object.

### Examples

```clojure
;; Example request
{:type :aperture.fact/load-related
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uid "entity-789"}}

;; Example success response
{:success true
 :data {
   :environment {
     :id "env-456"
     :name "Production Environment"
     :user-id "user-123"
     :entities [{:uid "entity-789", :name "Pump System"}, ...]
     :facts [{:uid "fact-101", ...}, ...]
   }
   :facts [
     {:uid "fact-101", :subject "entity-789", :predicate "is-a", :object "entity-555"},
     {:uid "fact-102", :subject "entity-789", :predicate "has-part", :object "entity-666"}
   ]
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to load all related facts"
 }}
```

### Related Messages

- `:aperture.entity/load` - Load a specific entity
- `:aperture.facts/loaded` - Broadcast notification of loaded facts

---

## `:aperture.entity/load`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :entity-uid string "UID of the entity to load"
  
  ;; Optional fields
  (environment-id) string "Environment ID to load entity into (defaults to user's default environment)"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    ;; Updated environment data with newly loaded entity
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

Loads a specific entity into the environment. This includes the entity itself but not necessarily all related facts.

### Examples

```clojure
;; Example request
{:type :aperture.entity/load
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uid "entity-789"}}

;; Example success response
{:success true
 :data {
   :id "env-456"
   :name "Production Environment"
   :user-id "user-123"
   :entities [{:uid "entity-789", :name "Pump System"}, ...]
   :facts [{:uid "fact-101", ...}, ...]
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to load entity"
 }}
```

### Related Messages

- `:aperture.entity/load-multiple` - Load multiple entities
- `:aperture.fact/load-related` - Load all facts related to an entity
- `:aperture.facts/loaded` - Broadcast notification of loaded facts

---

## `:aperture.entity/load-multiple`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID to load entities into"
  :entity-uids [string] "Array of entity UIDs to load"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    ;; Updated environment data with newly loaded entities
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

Loads multiple entities into the environment in a single operation. This is more efficient than making separate requests for each entity.

### Examples

```clojure
;; Example request
{:type :aperture.entity/load-multiple
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uids ["entity-789", "entity-790", "entity-791"]}}

;; Example success response
{:success true
 :data {
   :id "env-456"
   :name "Production Environment"
   :user-id "user-123"
   :entities [
     {:uid "entity-789", :name "Pump System"},
     {:uid "entity-790", :name "Control Valve"},
     {:uid "entity-791", :name "Pressure Sensor"},
     ...
   ]
   :facts [{:uid "fact-101", ...}, ...]
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to load entities"
 }}
```

### Related Messages

- `:aperture.entity/load` - Load a single entity
- `:aperture.entity/unload-multiple` - Unload multiple entities
- `:aperture.facts/loaded` - Broadcast notification of loaded facts

---

## `:aperture.entity/unload`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID to unload entity from"
  :entity-uid string "UID of the entity to unload"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    ;; Updated environment data after entity removal
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

Unloads a specific entity from the environment, including all facts that directly involve this entity.

### Examples

```clojure
;; Example request
{:type :aperture.entity/unload
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uid "entity-789"}}

;; Example success response
{:success true
 :data {
   :id "env-456"
   :name "Production Environment"
   :user-id "user-123"
   :entities [...] // entity-789 removed
   :facts [...] // facts involving entity-789 removed
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to unload entity"
 }}
```

### Related Messages

- `:aperture.entity/unload-multiple` - Unload multiple entities
- `:aperture.facts/unloaded` - Broadcast notification of unloaded facts

---

## `:aperture.entity/unload-multiple`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID to unload entities from"
  :entity-uids [string] "Array of entity UIDs to unload"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    ;; Updated environment data after entities removal
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

Unloads multiple entities from the environment in a single operation, including all facts that directly involve these entities.

### Examples

```clojure
;; Example request
{:type :aperture.entity/unload-multiple
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uids ["entity-789", "entity-790", "entity-791"]}}

;; Example success response
{:success true
 :data {
   :id "env-456"
   :name "Production Environment"
   :user-id "user-123"
   :entities [...] // specified entities removed
   :facts [...] // facts involving specified entities removed
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to unload entities"
 }}
```

### Related Messages

- `:aperture.entity/unload` - Unload a single entity
- `:aperture.facts/unloaded` - Broadcast notification of unloaded facts

---

## `:aperture.entity/select`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID where the entity exists"
  :entity-uid string "UID of the entity to select"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :success boolean "Operation success indicator"
    :selected-entity string "UID of the selected entity"
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

Selects a specific entity in the environment. Only one entity can be selected at a time in an environment.

### Examples

```clojure
;; Example request
{:type :aperture.entity/select
 :payload {:user-id "user-123"
           :environment-id "env-456"
           :entity-uid "entity-789"}}

;; Example success response
{:success true
 :data {
   :success true
   :selected-entity "entity-789"
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to select entity"
 }}
```

### Related Messages

- `:aperture.entity/deselect` - Deselect the currently selected entity
- `:aperture.entity/selected` - Broadcast notification of entity selection

---

## `:aperture.entity/deselect`

**Type:** Command

**Component:** Aperture

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID where to deselect the current entity"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :success boolean "Operation success indicator"
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

Deselects the currently selected entity in the environment, if any.

### Examples

```clojure
;; Example request
{:type :aperture.entity/deselect
 :payload {:user-id "user-123"
           :environment-id "env-456"}}

;; Example success response
{:success true
 :data {
   :success true
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to deselect entity"
 }}
```

### Related Messages

- `:aperture.entity/select` - Select a specific entity
- `:aperture.entity/deselected` - Broadcast notification of entity deselection

---

## `:aperture.environment/clear`

**Type:** Command

**Component:** Aperture

**Resource:** Environment

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :user-id string "User ID requesting the operation"
  :environment-id string "Environment ID to clear"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :success boolean "Operation success indicator"
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

Clears all entities and facts from the specified environment, effectively resetting it to an empty state.

### Examples

```clojure
;; Example request
{:type :aperture.environment/clear
 :payload {:user-id "user-123"
           :environment-id "env-456"}}

;; Example success response
{:success true
 :data {
   :success true
 }}

;; Example error response
{:success false
 :error {
   :code "database-error"
   :type "database-error"
   :message "Failed to clear entities"
 }}
```

### Related Messages

- `:aperture.facts/unloaded` - Broadcast notification of unloaded facts

---

## `:relica.app/heartbeat`

**Type:** Command

**Component:** System

**Resource:** Application

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :timestamp number "Current timestamp in milliseconds"
}
```

### Response

```clojure
{
  :success boolean "Whether the heartbeat was acknowledged"
  :data {
    :timestamp number "Server timestamp in milliseconds"
  }
}
```

### Description

Sends a heartbeat to maintain the WebSocket connection. Clients should send this message periodically to prevent the connection from timing out.

### Examples

```clojure
;; Example request
{:type :relica.app/heartbeat
 :payload {:timestamp 1621345678901}}

;; Example success response
{:success true
 :data {
   :timestamp 1621345679012
 }}
```

---

## `:aperture.facts/loaded`

**Type:** Event

**Component:** Aperture

**Resource:** Facts

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :facts [object] "Array of facts that were loaded"
  :user-id string "User ID that initiated the load operation"
  :environment-id string "Environment ID where facts were loaded"
}
```

### Description

Broadcast notification sent to all connected clients when facts are loaded into an environment. This allows clients to update their local state accordingly.

### Examples

```clojure
;; Example broadcast message
{:type :aperture.facts/loaded
 :facts [
   {:uid "fact-101", :subject "entity-789", :predicate "is-a", :object "entity-555"},
   {:uid "fact-102", :subject "entity-789", :predicate "has-part", :object "entity-666"}
 ]
 :user-id "user-123"
 :environment-id "env-456"}
```

### Related Messages

- All load operations that add facts to the environment

---

## `:aperture.facts/unloaded`

**Type:** Event

**Component:** Aperture

**Resource:** Facts

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :fact-uids [string] "Array of fact UIDs that were unloaded"
  :model-uids [string] "Array of model UIDs that were unloaded (if applicable)"
  :user-id string "User ID that initiated the unload operation"
  :environment-id string "Environment ID where facts were unloaded"
}
```

### Description

Broadcast notification sent to all connected clients when facts are unloaded from an environment. This allows clients to update their local state accordingly.

### Examples

```clojure
;; Example broadcast message
{:type :aperture.facts/unloaded
 :fact-uids ["fact-101", "fact-102", "fact-103"]
 :model-uids ["model-201", "model-202"]
 :user-id "user-123"
 :environment-id "env-456"}
```

### Related Messages

- All unload operations that remove facts from the environment

---

## `:aperture.entity/selected`

**Type:** Event

**Component:** Aperture

**Resource:** Entity

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :entity-uid string "UID of the entity that was selected"
  :user-id string "User ID that initiated the selection"
  :environment-id string "Environment ID where the entity was selected"
}
```

### Description

Broadcast notification sent to all connected clients when an entity is selected in an environment. This allows clients to update their UI to highlight the selected entity.

### Examples

```clojure
;; Example broadcast message
{:type :aperture.entity/selected
 :entity-uid "entity-789"
 :user-id "user-123"
 :environment-id "env-456"}
```

### Related Messages

- `:aperture.entity/select` - Command to select an entity

---

## `:aperture.entity/deselected`

**Type:** Event

**Component:** Aperture

**Resource:** Entity

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :user-id string "User ID that initiated the deselection"
  :environment-id string "Environment ID where the entity was deselected"
}
```

### Description

Broadcast notification sent to all connected clients when the selected entity is deselected in an environment. This allows clients to update their UI to remove any selection highlighting.

### Examples

```clojure
;; Example broadcast message
{:type :aperture.entity/deselected
 :user-id "user-123"
 :environment-id "env-456"}
```

### Related Messages

- `:aperture.entity/deselect` - Command to deselect the current entity

---

## Implementation Notes

### Message Handling

All messages are handled asynchronously. The server processes each message and returns a response with either success or error information. For operations that modify the environment, broadcast messages are sent to all connected clients to keep them in sync.

### Error Handling

Errors are returned in a standardized format with a code, type, message, and optional details. Common error types include:

- `database-error`: Error accessing or modifying the database
- `resource-not-found`: The requested resource does not exist
- `validation-error`: The request payload failed validation
- `permission-error`: The user does not have permission for the operation

### Response Format

All responses follow a standard format:

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {...} "Response data if successful"
  :error {...} "Error information if unsuccessful"
}
```

### Performance Considerations

- Use batch operations (like `load-multiple` and `unload-multiple`) when working with multiple entities to reduce network overhead
- The `load-related` operation can be expensive for entities with many relationships
- Consider using pagination or filtering when retrieving large datasets