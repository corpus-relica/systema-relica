# Portal WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Portal component of the Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `portal`, `aperture`, `nous`)
- `resource` is the entity or concept being operated on (e.g., `entity`, `facts`, `chat`)
- `command` is the action being performed (e.g., `select`, `load`, `unload`)

## Message Categories

Messages are categorized based on their semantic meaning and origin:

1. **Client Commands**: Operations initiated by clients to interact with the system
2. **Component Events**: Events received from other Relica components
3. **Connection Events**: Events related to component connections
4. **Broadcast Events**: Messages sent to all connected clients
5. **System Operations**: Operations related to application status and connection management

## Message Reference Overview

### Client Commands

| Identifier | Description |
| ---------- | ----------- |
| `:portal.entity/select` | Select an entity in the environment |
| `:portal.entity/select-none` | Clear entity selection |
| `:portal.entity/load-specialization-hierarchy` | Load specialization hierarchy for an entity |
| `:portal.environment/clear-entities` | Clear all entities from the environment |
| `:portal.facts/load-all-related` | Load all facts related to an entity |
| `:portal.entity/unload` | Unload an entity from the environment |
| `:portal.entities/load` | Load multiple entities into the environment |
| `:portal.entities/unload` | Unload multiple entities from the environment |
| `:portal.subtypes/load-cone` | Load subtypes cone for an entity |
| `:portal.subtypes/unload-cone` | Unload subtypes cone for an entity |
| `:portal.composition/load` | Load composition for an entity |
| `:portal.composition/load-in` | Load composition in for an entity |
| `:portal.connections/load` | Load connections for an entity |
| `:portal.connections/load-in` | Load connections in for an entity |
| `:portal.chat/user-input` | Send user input to chat |
| `:portal.auth/authenticate` | Authenticate with JWT token |
| `:portal.auth/guest` | Authenticate as guest |
| `:portal.system/ping` | Check if server is responsive |

### Component Events

| Identifier | Source | Description |
| ---------- | ------ | ----------- |
| `:aperture.facts/loaded` | Aperture | Facts were loaded into the environment |
| `:aperture.facts/unloaded` | Aperture | Facts were unloaded from the environment |
| `:aperture.entity/selected` | Aperture | An entity was selected |
| `:aperture.entity/deselected` | Aperture | Entity selection was cleared |
| `:nous.chat/final-answer` | Nous | Final answer received from chat |
| `:prism.setup/updated` | Prism | Prism setup status was updated |

### Connection Events

| Identifier | Description |
| ---------- | ----------- |
| `:nous/connected` | Nous connects to portal |
| `:nous/disconnected` | Disconnected from Nous service |
| `:nous/message-received` | Message received from Nous service |
| `:prism/connected` | Prism service connects to portal |
| `:prism/disconnected` | Disconnected from Prism service |

### Prism Setup Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/start` | Start the Prism setup process |
| `:prism.setup/create-user` | Create an admin user in Prism |
| `:prism.setup/process-stage` | Process the current setup stage |

## Individual Message Documentation

Below is the detailed documentation for each message supported by the Portal component.

---

## `:portal.auth/authenticate`

**Type:** Command

**Component:** Portal

**Resource:** Auth

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :jwt string "JWT token for authentication"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :token string "Socket token for subsequent requests"
  :user-id string "Authenticated user ID"
  :error string "Error message if authentication failed"
}
```

### Description

Authenticates a user with a JWT token and returns a socket token for subsequent WebSocket requests.

### Examples

```clojure
;; Example request
{:type "auth"
 :payload {:jwt "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}

;; Example success response
{:success true
 :token "550e8400-e29b-41d4-a716-446655440000"
 :user-id "user-123"}

;; Example error response
{:success false
 :error "Invalid JWT"}
```

---

## `:portal.auth/guest`

**Type:** Command

**Component:** Portal

**Resource:** Auth

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
  :token string "Socket token for subsequent requests"
  :user-id string "Guest user ID"
}
```

### Description

Authenticates as a guest user and returns a socket token for subsequent WebSocket requests.

### Examples

```clojure
;; Example request
{:type "guest-auth"
 :payload {}}

;; Example success response
{:success true
 :token "550e8400-e29b-41d4-a716-446655440000"
 :user-id "guest-user"}
```

---

## `:portal.entity/select`

**Type:** Command

**Component:** Portal

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to select"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Selects an entity in the environment. This triggers an entity selection event that is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example request
{:type "selectEntity"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Entity selected"}

;; Example error response
{:success false
 :error "Failed to select entity"}
```

### Related Messages

- `:portal.entity/select-none` - Clear entity selection
- `:aperture.entity/selected` - Entity selected event

---

## `:portal.entity/select-none`

**Type:** Command

**Component:** Portal

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Clears entity selection in the environment. This triggers an entity deselection event that is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example request
{:type "selectNone"
 :payload {:client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Entity deselected"}

;; Example error response
{:success false
 :error "Failed to deselect entity"}
```

### Related Messages

- `:portal.entity/select` - Select an entity
- `:aperture.entity/deselected` - Entity deselected event

---

## `:portal.entity/load-specialization-hierarchy`

**Type:** Command

**Component:** Portal

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load specialization hierarchy for"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :environment object "Environment data with specialization hierarchy"
  :error string "Error message if operation failed"
}
```

### Description

Loads the specialization hierarchy for an entity. This provides the inheritance structure for the entity.

### Examples

```clojure
;; Example request
{:type "loadSpecializationHierarchy"
 :payload {:uid "entity-123"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Specialization hierarchy loaded"
 :environment {...}} // Environment data with specialization hierarchy

;; Example error response
{:success false
 :error "Failed to load specialization hierarchy"}
```

---

## `:portal.environment/clear-entities`

**Type:** Command

**Component:** Portal

**Resource:** Environment

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Clears all entities from the environment. This removes all loaded entities and facts.

### Examples

```clojure
;; Example request
{:type "clearEnvironmentEntities"
 :payload {:client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Environment entities cleared"}

;; Example error response
{:success false
 :error "Failed to clear environment entities"}
```

---

## `:portal.facts/load-all-related`

**Type:** Command

**Component:** Portal

**Resource:** Facts

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load related facts for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :facts array "Array of related facts"
  :error string "Error message if operation failed"
}
```

### Description

Loads all facts related to an entity. This retrieves all facts where the entity is involved.

### Examples

```clojure
;; Example request
{:type "loadAllRelatedFacts"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "All related facts loaded"
 :facts [{...}, {...}, ...]} // Array of related facts

;; Example error response
{:success false
 :error "Failed to load all related facts"}
```

### Related Messages

- `:aperture.facts/loaded` - Facts loaded event

---

## `:portal.entity/unload`

**Type:** Command

**Component:** Portal

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to unload"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Unloads an entity from the environment. This removes the entity and its related facts from the environment.

### Examples

```clojure
;; Example request
{:type "unloadEntity"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Entity unloaded"}

;; Example error response
{:success false
 :error "Failed to unload entity"}
```

### Related Messages

- `:portal.entities/unload` - Unload multiple entities
- `:aperture.facts/unloaded` - Facts unloaded event

---

## `:portal.entities/load`

**Type:** Command

**Component:** Portal

**Resource:** Entities

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [string] "Array of unique identifiers of entities to load"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Loads multiple entities into the environment. This adds the entities and their related facts to the environment.

### Examples

```clojure
;; Example request
{:type "loadEntities"
 :payload {:uids ["entity-123", "entity-456", "entity-789"]
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Entities loaded"}

;; Example error response
{:success false
 :error "Failed to load entities"}
```

### Related Messages

- `:portal.entity/unload` - Unload an entity
- `:aperture.facts/loaded` - Facts loaded event

---

## `:portal.entities/unload`

**Type:** Command

**Component:** Portal

**Resource:** Entities

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [string] "Array of unique identifiers of entities to unload"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Unloads multiple entities from the environment. This removes the entities and their related facts from the environment.

### Examples

```clojure
;; Example request
{:type "unloadEntities"
 :payload {:uids ["entity-123", "entity-456", "entity-789"]
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Entities unloaded"}

;; Example error response
{:success false
 :error "Failed to unload entities"}
```

### Related Messages

- `:portal.entity/unload` - Unload an entity
- `:aperture.facts/unloaded` - Facts unloaded event

---

## `:portal.subtypes/load-cone`

**Type:** Command

**Component:** Portal

**Resource:** Subtypes

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load subtypes cone for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :subtypes array "Array of subtypes"
  :error string "Error message if operation failed"
}
```

### Description

Loads the subtypes cone for an entity. This retrieves all subtypes of the entity in a hierarchical structure.

### Examples

```clojure
;; Example request
{:type "loadSubtypesCone"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Subtypes cone loaded"
 :subtypes [{...}, {...}, ...]} // Array of subtypes

;; Example error response
{:success false
 :error "Failed to load subtypes cone"}
```

### Related Messages

- `:portal.subtypes/unload-cone` - Unload subtypes cone

---

## `:portal.subtypes/unload-cone`

**Type:** Command

**Component:** Portal

**Resource:** Subtypes

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to unload subtypes cone for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :error string "Error message if operation failed"
}
```

### Description

Unloads the subtypes cone for an entity. This removes the subtypes from the environment.

### Examples

```clojure
;; Example request
{:type "unloadSubtypesCone"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Subtypes cone unloaded"}

;; Example error response
{:success false
 :error "Failed to unload subtypes cone"}
```

### Related Messages

- `:portal.subtypes/load-cone` - Load subtypes cone

---

## `:portal.composition/load`

**Type:** Command

**Component:** Portal

**Resource:** Composition

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load composition for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :composition object "Composition data"
  :error string "Error message if operation failed"
}
```

### Description

Loads the composition for an entity. This retrieves the components that make up the entity.

### Examples

```clojure
;; Example request
{:type "loadComposition"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Composition loaded"
 :composition {...}} // Composition data

;; Example error response
{:success false
 :error "Failed to load composition"}
```

### Related Messages

- `:portal.composition/load-in` - Load composition in

---

## `:portal.composition/load-in`

**Type:** Command

**Component:** Portal

**Resource:** Composition

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load composition in for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :composition object "Composition data"
  :error string "Error message if operation failed"
}
```

### Description

Loads the composition in for an entity. This retrieves the entities that this entity is a component of.

### Examples

```clojure
;; Example request
{:type "loadCompositionIn"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Composition In loaded"
 :composition {...}} // Composition data

;; Example error response
{:success false
 :error "Failed to load composition"}
```

### Related Messages

- `:portal.composition/load` - Load composition

---

## `:portal.connections/load`

**Type:** Command

**Component:** Portal

**Resource:** Connections

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load connections for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :connections array "Array of connections"
  :error string "Error message if operation failed"
}
```

### Description

Loads the connections for an entity. This retrieves the entities that this entity is connected to.

### Examples

```clojure
;; Example request
{:type "loadConnections"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Connections loaded"
 :connections [{...}, {...}, ...]} // Array of connections

;; Example error response
{:success false
 :error "Failed to load connections"}
```

### Related Messages

- `:portal.connections/load-in` - Load connections in

---

## `:portal.connections/load-in`

**Type:** Command

**Component:** Portal

**Resource:** Connections

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Unique identifier of the entity to load connections in for"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :connections array "Array of connections"
  :error string "Error message if operation failed"
}
```

### Description

Loads the connections in for an entity. This retrieves the entities that are connected to this entity.

### Examples

```clojure
;; Example request
{:type "loadConnectionsIn"
 :payload {:uid "entity-123"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Connections loaded"
 :connections [{...}, {...}, ...]} // Array of connections

;; Example error response
{:success false
 :error "Failed to load connections"}
```

### Related Messages

- `:portal.connections/load` - Load connections

---

## `:portal.chat/user-input`

**Type:** Command

**Component:** Portal

**Resource:** Chat

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :message string "User input message"
  :client-id string "Client identifier"
  :user-id string "User identifier"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :message string "Success or error message"
  :response object "Response data"
  :error string "Error message if operation failed"
}
```

### Description

Sends user input to the chat system. This processes the user's message and returns a response.

### Examples

```clojure
;; Example request
{:type "chatUserInput"
 :payload {:message "What is a pump?"
           :client-id "client-456"
           :user-id "user-789"}}

;; Example success response
{:success true
 :message "Chat user input processed"
 :response {...}} // Response data

;; Example error response
{:success false
 :error "Failed to process chat user input"}
```

### Related Messages

- `:nous.chat/final-answer` - Final answer event

---

## `:portal.system/ping`

**Type:** Command

**Component:** Portal

**Resource:** System

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
  :message string "Success message"
}
```

### Description

Checks if the server is responsive. Used for health checks and connection testing.

### Examples

```clojure
;; Example request
{:type "ping"
 :payload {}}

;; Example response
{:success true
 :message "Pong"}
```

---

## `:prism.setup/start`

**Type:** Command

**Component:** Portal

**Resource:** Prism Setup

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
  :result object "Setup result data"
  :error string "Error message if operation failed"
}
```

### Description

Starts the Prism setup process. This initializes the setup sequence for Prism.

### Examples

```clojure
;; Example request
{:type "prism/startSetup"
 :payload {}}

;; Example success response
{:success true
 :result {...}} // Setup result data

;; Example error response
{:success false
 :error "Error starting Prism setup"}
```

### Related Messages

- `:prism.setup/updated` - Prism setup updated event

---

## `:prism.setup/create-user`

**Type:** Command

**Component:** Portal

**Resource:** Prism Setup

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :username string "Admin username"
  :password string "Admin password"
  :confirmPassword string "Confirm admin password"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :result object "User creation result data"
  :error string "Error message if operation failed"
}
```

### Description

Creates an admin user in Prism during the setup process.

### Examples

```clojure
;; Example request
{:type "prism/createUser"
 :payload {:username "admin"
           :password "securepassword"
           :confirmPassword "securepassword"}}

;; Example success response
{:success true
 :result {...}} // User creation result data

;; Example error response
{:success false
 :error "Error creating Prism admin user"}
```

### Related Messages

- `:prism.setup/updated` - Prism setup updated event

---

## `:aperture.facts/loaded`

**Type:** Event

**Component:** Aperture

**Resource:** Facts

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :facts array "Array of loaded facts"
  :user_id string "User identifier"
  :environment_id string "Environment identifier"
}
```

### Description

Event triggered when facts are loaded into the environment. This is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:factsLoaded"
 :payload {:type "aperture.facts/loaded"
           :facts [{...}, {...}, ...] // Array of loaded facts
           :user_id "user-789"
           :environment_id "env-123"}}
```

### Related Messages

- `:portal.facts/load-all-related` - Load all related facts
- `:portal.entities/load` - Load entities

---

## `:aperture.facts/unloaded`

**Type:** Event

**Component:** Aperture

**Resource:** Facts

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :fact_uids array "Array of unloaded fact UIDs"
  :user_id string "User identifier"
  :environment_id string "Environment identifier"
}
```

### Description

Event triggered when facts are unloaded from the environment. This is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:factsUnloaded"
 :payload {:type "aperture.facts/unloaded"
           :fact_uids ["fact-123", "fact-456", "fact-789"] // Array of unloaded fact UIDs
           :user_id "user-789"
           :environment_id "env-123"}}
```

### Related Messages

- `:portal.entity/unload` - Unload entity
- `:portal.entities/unload` - Unload entities

---

## `:aperture.entity/selected`

**Type:** Event

**Component:** Aperture

**Resource:** Entity

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :entity_uid string "Selected entity UID"
  :user_id string "User identifier"
  :environment_id string "Environment identifier"
}
```

### Description

Event triggered when an entity is selected in the environment. This is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:entitySelected"
 :payload {:type "aperture.entity/selected"
           :entity_uid "entity-123"
           :user_id "user-789"
           :environment_id "env-123"}}
```

### Related Messages

- `:portal.entity/select` - Select entity

---

## `:aperture.entity/deselected`

**Type:** Event

**Component:** Aperture

**Resource:** Entity

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :user_id string "User identifier"
  :environment_id string "Environment identifier"
}
```

### Description

Event triggered when entity selection is cleared in the environment. This is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:entitySelectedNone"
 :payload {:type "aperture.entity/deselected"
           :user_id "user-789"
           :environment_id "env-123"}}
```

### Related Messages

- `:portal.entity/select-none` - Clear entity selection

---

## `:nous.chat/final-answer`

**Type:** Event

**Component:** Nous

**Resource:** Chat

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :answer object "Final answer data"
  :user_id string "User identifier"
  :environment_id string "Environment identifier"
}
```

### Description

Event triggered when a final answer is received from the chat system. This is broadcast to all clients in the same environment.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:finalAnswer"
 :payload {:type "nous.chat/final-answer"
           :answer {...} // Final answer data
           :user_id "user-789"
           :environment_id "env-123"}}
```

### Related Messages

- `:portal.chat/user-input` - Send user input to chat

---

## `:prism.setup/updated`

**Type:** Event

**Component:** Prism

**Resource:** Setup

**Direction:** Server→Client (Broadcast)

### Payload Schema

```clojure
{
  :type string "Event type"
  :status string "Setup status"
  :stage string "Current setup stage"
  :progress number "Setup progress percentage"
}
```

### Description

Event triggered when the Prism setup status is updated. This is broadcast to all clients.

### Examples

```clojure
;; Example event
{:id "system"
 :type "portal:prismSetupUpdate"
 :payload {:type "prism.setup/updated"
           :status "in-progress"
           :stage "create-user"
           :progress 50}}
```

### Related Messages

- `:prism.setup/start` - Start the Prism setup process
- `:prism.setup/create-user` - Create an admin user in Prism
- `:prism.setup/process-stage` - Process the current setup stage

---

## `:prism.setup/process-stage`

**Type:** Command

**Component:** Portal

**Resource:** Prism Setup

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
  :result object "Stage processing result data"
  :error string "Error message if operation failed"
}
```

### Description

Processes the current setup stage in the Prism setup sequence.

### Examples

```clojure
;; Example request
{:type "prism/processStage"
 :payload {}}

;; Example success response
{:success true
 :result {...}} // Stage processing result data

;; Example error response
{:success false
 :error "Error processing Prism setup stage"}
```

### Related Messages

- `:prism.setup/updated` - Prism setup updated event