# Relica System Clojure Clients Documentation

This document provides comprehensive documentation for the Clojure client implementations in the Relica system. These clients enable communication with various components of the system through WebSocket connections.

## Table of Contents

- [Overview](#overview)
  - [Common Architecture](#common-architecture)
  - [Connection Management](#connection-management)
  - [Heartbeat Mechanism](#heartbeat-mechanism)
- [Aperture Client](#aperture-client)
- [Archivist Client](#archivist-client)
- [Clarity Client](#clarity-client)
- [NOUS Client](#nous-client)
- [Prism Client](#prism-client)

## Overview

### Common Architecture

All Relica system clients follow a consistent architecture pattern:

1. **Protocol Definition**: Each client defines a protocol that specifies the operations it supports.
2. **Record Implementation**: A record type implements the protocol, providing concrete implementations for each operation.
3. **Factory Function**: A `create-client` function serves as the primary way to instantiate a client.
4. **WebSocket Communication**: All clients use a common WebSocket client implementation for communication.

### Connection Management

Clients handle connection management in a consistent way:

- **Automatic Connection**: Operations automatically establish a connection if one doesn't exist.
- **Connection Status**: Clients provide a way to check connection status.
- **Reconnection**: Some clients support automatic reconnection after disconnection.

### Heartbeat Mechanism

All clients implement a heartbeat mechanism to maintain active connections:

- **Heartbeat Scheduler**: A scheduler sends periodic heartbeat messages.
- **Configurable Interval**: The heartbeat interval is configurable (default: 30 seconds).
- **Cleanup Function**: The scheduler returns a function to stop the heartbeat when needed.

## Aperture Client

The Aperture client provides operations for managing environments, entities, and their relationships.

### Creating and Configuring

```clojure
(require '[io.relica.common.io.aperture-client :as aperture])

(def client (aperture/create-client
              {:host "localhost"
               :port 3030
               :timeout 5000  ; Optional, default: 5000ms
               :handlers {    ; Optional event handlers
                 :handle-facts-loaded (fn [payload] ...)
                 :handle-facts-unloaded (fn [payload] ...)
                 :handle-entity-selected (fn [payload] ...)
                 :handle-entity-selected-none (fn [payload] ...)
               }}))
```

### Available Operations

#### Environment Operations

```clojure
;; Get environment by ID
(aperture/get-environment client user-id env-id)

;; List all environments for a user
(aperture/list-environments client user-id)

;; Create a new environment
(aperture/create-environment client user-id env-name)

;; Update an environment
(aperture/update-environment! client user-id env-id updates)

;; Clear all entities from an environment
(aperture/clear-environment-entities client user-id env-id)
```

#### Entity Operations

```clojure
;; Load multiple entities
(aperture/load-entities client user-id env-id entity-uids)

;; Unload an entity
(aperture/unload-entity client user-id env-id entity-uid)

;; Unload multiple entities
(aperture/unload-entities client user-id env-id entity-uids)

;; Select an entity
(aperture/select-entity client user-id env-id entity-uid)

;; Deselect all entities
(aperture/select-entity-none client user-id env-id)
```

#### Relationship Operations

```clojure
;; Load specialization hierarchy
(aperture/load-specialization-hierarchy client user-id uid)

;; Load all related facts
(aperture/load-all-related-facts client user-id env-id entity-uid)

;; Load subtypes cone
(aperture/load-subtypes-cone client user-id env-id entity-uid)

;; Unload subtypes cone
(aperture/unload-subtypes-cone client user-id env-id entity-uid)

;; Load composition
(aperture/load-composition client user-id env-id entity-uid)

;; Load composition in
(aperture/load-composition-in client user-id env-id entity-uid)

;; Load connections
(aperture/load-connections client user-id env-id entity-uid)

;; Load connections in
(aperture/load-connections-in client user-id env-id entity-uid)
```

### Handling Responses

Responses from the Aperture client are delivered through the handlers provided during client creation:

```clojure
(def client (aperture/create-client
              {:host "localhost"
               :port 3030
               :handlers {
                 :handle-facts-loaded (fn [payload]
                   (println "Facts loaded:" payload))
                 :handle-facts-unloaded (fn [payload]
                   (println "Facts unloaded:" payload))
                 :handle-entity-selected (fn [payload]
                   (println "Entity selected:" payload))
                 :handle-entity-selected-none (fn [payload]
                   (println "No entity selected"))
               }}))
```

### Example Usage

```clojure
;; Create a client
(def aperture-client (aperture/create-client
                       {:host "localhost"
                        :port 3030}))

;; Get an environment
(aperture/get-environment aperture-client "user-123" "env-456")

;; Load entities into the environment
(aperture/load-entities aperture-client "user-123" "env-456" 
                        ["entity-1" "entity-2" "entity-3"])

;; Select an entity
(aperture/select-entity aperture-client "user-123" "env-456" "entity-1")

;; Load all related facts for the selected entity
(aperture/load-all-related-facts aperture-client "user-123" "env-456" "entity-1")

;; Clean up when done
(aperture/select-entity-none aperture-client "user-123" "env-456")
(aperture/clear-environment-entities aperture-client "user-123" "env-456")
```

## Archivist Client

The Archivist client provides operations for managing knowledge graph entities, facts, and relationships.

### Creating and Configuring

```clojure
(require '[io.relica.common.io.archivist-client :as archivist])

(def client (archivist/create-client
              {:host "localhost"
               :port 3000
               :timeout 5000  ; Optional, default: 5000ms
               :handlers {    ; Optional event handlers
                 :on-error (fn [e] (println "Error:" e))
                 :on-message (fn [msg] (println "Message:" msg))
               }}))
```

### Available Operations

The Archivist client provides a comprehensive set of operations organized by entity type:

#### Connection Management

```clojure
;; Connect to the server
(archivist/connect! client)

;; Disconnect from the server
(archivist/disconnect! client)

;; Check connection status
(archivist/connected? client)
```

#### General Operations

```clojure
;; Get batch of facts
(archivist/get-batch-facts client config)

;; Get facts count
(archivist/get-facts-count client)

;; Execute a graph query
(archivist/execute-query client query params)

;; Resolve UIDs to entities
(archivist/resolve-uids client uids)

;; Get kinds
(archivist/get-kinds client {:sort ["name" "ASC"]
                             :range [0 10]
                             :filter {}})

;; Get collections
(archivist/get-collections client)

;; Get entity type
(archivist/get-entity-type client uid)

;; Get entity category
(archivist/get-entity-category client uid)

;; Text search
(archivist/text-search client query)
```

#### Aspect Operations

```clojure
;; Get aspects
(archivist/get-aspects client opts)

;; Create aspect
(archivist/create-aspect client aspect-data)

;; Update aspect
(archivist/update-aspect client uid aspect-data)

;; Delete aspect
(archivist/delete-aspect client uid)
```

#### Completion Operations

```clojure
;; Get completions
(archivist/get-completions client query)
```

#### Concept Operations

```clojure
;; Get concept
(archivist/get-concept client uid)

;; Create concept
(archivist/create-concept client concept-data)

;; Update concept
(archivist/update-concept client uid concept-data)
```

#### Definition Operations

```clojure
;; Get definition
(archivist/get-definition client uid)

;; Create definition
(archivist/create-definition client def-data)

;; Update definition
(archivist/update-definition client uid def-data)
```

#### Fact Operations

```clojure
;; Get facts
(archivist/get-facts client opts)

;; Get all related facts
(archivist/get-all-related client uid)

;; Create fact
(archivist/create-fact client fact-data)

;; Update fact
(archivist/update-fact client uid fact-data)

;; Delete fact
(archivist/delete-fact client uid)

;; Get definitive facts
(archivist/get-definitive-facts client uid)

;; Get facts relating entities
(archivist/get-facts-relating-entities client uid1 uid2)

;; Get related on UID subtype cone
(archivist/get-related-on-uid-subtype-cone client lh-object-uid rel-type-uid)

;; Get inherited relation
(archivist/get-inherited-relation client uid rel-type-uid)

;; Get core sample
(archivist/get-core-sample client uid rel-type-uid)

;; Get core sample RH
(archivist/get-core-sample-rh client uid rel-type-uid)

;; Get related to
(archivist/get-related-to client uid rel-type-uid)

;; Get related to subtype cone
(archivist/get-related-to-subtype-cone client uid rel-type-uid)

;; Get recursive relations
(archivist/get-recurisve-relations client uid rel-type-uid)

;; Get recursive relations to
(archivist/get-recurisve-relations-to client uid rel-type-uid)

;; Get classification fact
(archivist/get-classification-fact client uid)

;; Get classified
(archivist/get-classified client uid)

;; Get subtypes
(archivist/get-subtypes client uid)

;; Get subtypes cone
(archivist/get-subtypes-cone client uid)
```

#### Individual Operations

```clojure
;; Get individual
(archivist/get-individual client uid)

;; Create individual
(archivist/create-individual client individual-data)

;; Update individual
(archivist/update-individual client uid individual-data)
```

#### Kind Operations

```clojure
;; Get kind
(archivist/get-kind client uid)

;; Create kind
(archivist/create-kind client kind-data)

;; Update kind
(archivist/update-kind client uid kind-data)

;; Delete kind
(archivist/delete-kind client uid)
```

#### Search Operations

```clojure
;; UID search
(archivist/uid-search client query)

;; Individual search
(archivist/individual-search client query)

;; Kind search
(archivist/kind-search client query)
```

#### Specialization Operations

```clojure
;; Get specialization fact
(archivist/get-specialization-fact client user-id uid)

;; Get specialization hierarchy
(archivist/get-specialization-hierarchy client user-id uid)
```

#### Transaction Operations

```clojure
;; Get transaction
(archivist/get-transaction client uid)

;; Create transaction
(archivist/create-transaction client tx-data)

;; Commit transaction
(archivist/commit-transaction client uid)

;; Rollback transaction
(archivist/rollback-transaction client uid)
```

#### Validation Operations

```clojure
;; Validate entity
(archivist/validate-entity client entity-data)
```

#### Lineage Operations

```clojure
;; Get lineage
(archivist/get-lineage client uid)
```

### Handling Responses

Responses from the Archivist client are delivered through the handlers provided during client creation:

```clojure
(def client (archivist/create-client
              {:host "localhost"
               :port 3000
               :handlers {
                 :on-error (fn [e]
                   (println "Error occurred:" e))
                 :on-message (fn [msg]
                   (println "Received message:" msg))
               }}))
```

### Example Usage

```clojure
;; Create a client
(def archivist-client (archivist/create-client
                        {:host "localhost"
                         :port 3000}))

;; Connect to the server
(archivist/connect! archivist-client)

;; Check if connected
(when (archivist/connected? archivist-client)
  (println "Connected to Archivist server"))

;; Get kinds with pagination and sorting
(def kinds-response (archivist/get-kinds archivist-client
                                        {:sort ["name" "ASC"]
                                         :range [0 10]
                                         :filter {}}))

;; Resolve UIDs
(def resolved-entities (archivist/resolve-uids archivist-client
                                              ["uid-1" "uid-2" "uid-3"]))

;; Create a new kind
(def new-kind (archivist/create-kind archivist-client
                                     {:name "TestKind"
                                      :description "A test kind"}))

;; Get facts related to an entity
(def related-facts (archivist/get-all-related archivist-client "entity-uid"))

;; Disconnect when done
(archivist/disconnect! archivist-client)
```

## Clarity Client

The Clarity client provides operations for retrieving models for kinds and individuals.

### Creating and Configuring

```clojure
(require '[io.relica.common.io.clarity-client :as clarity])

(def client (clarity/create-client
              {:host "localhost"
               :port 3000
               :timeout 5000  ; Optional, default: 5000ms
               :handlers {    ; Optional event handlers
                 :on-connect (fn [] (println "Connected to Clarity"))
                 :on-disconnect (fn [] (println "Disconnected from Clarity"))
                 :on-message (fn [event-type payload]
                               (println "Received message:" event-type))
               }}))
```

### Available Operations

```clojure
;; Get model by UID
(clarity/get-model client uid)

;; Get kind model
(clarity/get-kind-model client kind-id)

;; Get individual model
(clarity/get-individual-model client individual-id)

;; Send heartbeat
(clarity/send-heartbeat! client)
```

### Handling Responses

Responses from the Clarity client are delivered through the handlers provided during client creation:

```clojure
(def client (clarity/create-client
              {:host "localhost"
               :port 3000
               :handlers {
                 :on-connect (fn []
                   (println "Connected to Clarity server"))
                 :on-disconnect (fn []
                   (println "Disconnected from Clarity server"))
                 :on-message (fn [event-type payload]
                   (println "Received message:" event-type)
                   (println "Payload:" payload))
               }}))
```

### Example Usage

```clojure
;; Create a client
(def clarity-client (clarity/create-client
                      {:host "localhost"
                       :port 3000}))

;; Get a model by UID
(def model (clarity/get-model clarity-client "model-uid"))

;; Get a kind model
(def kind-model (clarity/get-kind-model clarity-client "kind-uid"))

;; Get an individual model
(def individual-model (clarity/get-individual-model clarity-client "individual-uid"))
```

## NOUS Client

The NOUS client provides operations for interacting with the NOUS (Natural language Oriented Understanding System) component.

### Creating and Configuring

```clojure
(require '[io.relica.common.io.nous-client :as nous])

(def client (nous/create-client
              {:host "localhost"
               :port 3000
               :timeout 5000  ; Optional, default: 5000ms
               :handlers {    ; Optional event handlers
                 :on-connect (fn [] (println "Connected to NOUS"))
                 :on-disconnect (fn [] (println "Disconnected from NOUS"))
                 :on-message (fn [event-type payload]
                               (println "Received message:" event-type))
                 :handle-final-answer (fn [payload]
                                        (println "Final answer:" payload))
               }}))
```

### Available Operations

```clojure
;; Send user input
(nous/user-input client user-id env-id user-message)

;; Send heartbeat
(nous/send-heartbeat! client)
```

### Handling Responses

Responses from the NOUS client are delivered through the handlers provided during client creation:

```clojure
(def client (nous/create-client
              {:host "localhost"
               :port 3000
               :handlers {
                 :on-connect (fn []
                   (println "Connected to NOUS server"))
                 :on-disconnect (fn []
                   (println "Disconnected from NOUS server"))
                 :on-message (fn [event-type payload]
                   (println "Received message:" event-type)
                   (println "Payload:" payload))
                 :handle-final-answer (fn [payload]
                   (println "Received final answer:" payload))
               }}))
```

### Example Usage

```clojure
;; Create a client
(def nous-client (nous/create-client
                   {:host "localhost"
                    :port 3000}))

;; Send user input
(nous/user-input nous-client "user-123" "env-456" "What is the purpose of this system?")
```

## Prism Client

The Prism client provides operations for system setup and administration.

### Creating and Configuring

```clojure
(require '[io.relica.common.io.prism-client :as prism])

(def client (prism/create-client
              {:host "localhost"
               :port 3000
               :handlers {    ; Optional event handlers
                 :on-connect (fn [] (println "Connected to Prism"))
                 :on-disconnect (fn [] (println "Disconnected from Prism"))
                 :on-message (fn [event-type payload]
                               (println "Received message:" event-type))
                 :handle-setup-state-update (fn [payload]
                                              (println "Setup state updated:" payload))
               }}))
```

### Available Operations

```clojure
;; Get setup status
(prism/get-setup-status client)

;; Start setup
(prism/start-setup client)

;; Create admin user
(prism/create-admin-user client username password confirm-password)

;; Process setup stage
(prism/process-setup-stage client)

;; Check connection status
(prism/connected? client)

;; Send heartbeat
(prism/send-heartbeat! client)

;; Disconnect client
(prism/disconnect-client client)
```

### Handling Responses

Responses from the Prism client are delivered through the handlers provided during client creation:

```clojure
(def client (prism/create-client
              {:host "localhost"
               :port 3000
               :handlers {
                 :on-connect (fn []
                   (println "Connected to Prism server"))
                 :on-disconnect (fn []
                   (println "Disconnected from Prism server"))
                 :on-message (fn [event-type payload]
                   (println "Received message:" event-type)
                   (println "Payload:" payload))
                 :handle-setup-state-update (fn [payload]
                   (println "Setup state updated:" payload))
               }}))
```

### Example Usage

```clojure
;; Create a client
(def prism-client (prism/create-client
                    {:host "localhost"
                     :port 3000}))

;; Check connection status
(when (prism/connected? prism-client)
  (println "Connected to Prism server"))

;; Get setup status
(def setup-status (prism/get-setup-status prism-client))

;; Start setup process
(prism/start-setup prism-client)

;; Create admin user
(prism/create-admin-user prism-client "admin" "password123" "password123")

;; Process current setup stage
(prism/process-setup-stage prism-client)

;; Disconnect when done
(prism/disconnect-client prism-client)