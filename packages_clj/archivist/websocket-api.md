# Archivist WebSocket API Documentation

## Introduction

This document describes the WebSocket API for the Archivist component of the Relica system. It follows the standardized documentation format for all WebSocket APIs in the system.

All message identifiers follow the `:component.resource/command` format, where:
- `component` is the name of the component (e.g., `archivist`)
- `resource` is the entity or concept being operated on (e.g., `entity`, `fact`, `kind`)
- `command` is the action being performed (e.g., `get`, `create`, `update`)

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **Create Operations**: Operations that create new resources
3. **Update Operations**: Operations that modify existing resources
4. **Delete Operations**: Operations that remove resources
5. **System Operations**: Operations related to application status and connection management
6. **Broadcast Events**: Messages sent to all connected clients

## Message Reference Overview

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:archivist.graph/query-execute` | Execute a Cypher query against the Neo4j graph database |
| `:archivist.fact/batch-get` | Get a batch of facts by their UIDs |
| `:archivist.fact/count` | Get count of all facts in the system |
| `:archivist.fact/all-related-get` | Get all facts related to an entity |
| `:archivist.fact/definitive-get` | Get definitive facts for an entity |
| `:archivist.fact/classification-get` | Get classification facts for an entity |
| `:archivist.fact/relating-entities-get` | Get facts relating two entities |
| `:archivist.fact/related-on-uid-subtype-cone-get` | Get facts related on UID subtype cone |
| `:archivist.fact/inherited-relation-get` | Get inherited relation facts |
| `:archivist.fact/related-to-get` | Get facts related to an entity |
| `:archivist.fact/related-to-subtype-cone-get` | Get facts related to subtype cone |
| `:archivist.fact/recursive-relations-get` | Get recursive relation facts |
| `:archivist.fact/recursive-relations-to-get` | Get recursive relation facts to an entity |
| `:archivist.fact/classified-get` | Get classified facts |
| `:archivist.fact/subtypes-get` | Get subtype facts |
| `:archivist.fact/subtypes-cone-get` | Get subtype cone facts |
| `:archivist.fact/core-sample-get` | Get core sample facts |
| `:archivist.fact/core-sample-rh-get` | Get core sample RH facts |
| `:archivist.entity/batch-resolve` | Resolve multiple entity UIDs |
| `:archivist.entity/category-get` | Get category of an entity |
| `:archivist.entity/collections-get` | Get collections |
| `:archivist.entity/type-get` | Get entity type |
| `:archivist.kind/list` | List kinds with filtering options |
| `:archivist.kind/get` | Get a single kind by UID |
| `:archivist.search/text` | Perform text search across entities |
| `:archivist.search/uid` | Search by entity UID |
| `:archivist.search/individual` | Search for individuals |
| `:archivist.search/kind` | Search for kinds |
| `:archivist.specialization/fact-get` | Get specialization fact |
| `:archivist.specialization/hierarchy-get` | Get specialization hierarchy |
| `:archivist.lineage/get` | Get lineage for an entity |
| `:archivist.aspect/list` | Get aspects with filtering options |
| `:archivist.completion/list` | Get completions for a query |
| `:archivist.concept/get` | Get a concept by UID |
| `:archivist.definition/get` | Get a definition by UID |
| `:archivist.individual/get` | Get an individual by UID |
| `:archivist.transaction/get` | Get a transaction by UID |
### Create Operations

| Identifier | Description |
| ---------- | ----------- |
| `:archivist.fact/create` | Create a new fact |
| `:archivist.fact/batch-create` | Create multiple facts in a batch operation |
| `:archivist.aspect/create` | Create a new aspect |
| `:archivist.concept/create` | Create a new concept |
| `:archivist.definition/create` | Create a new definition |
| `:archivist.individual/create` | Create a new individual |
| `:archivist.kind/create` | Create a new kind |
| `:archivist.transaction/create` | Create a new transaction |
| `:archivist.submission/update-definition` | Update a fact definition |
| `:archivist.submission/update-collection` | Update a fact collection |
| `:archivist.submission/update-name` | Update an entity name on a fact |
| `:archivist.submission/blanket-rename` | Update entity name at every instance |
| `:archivist.submission/add-synonym` | Add a synonym to an entity |
| `:archivist.submission/create-date` | Create a date entity |

### Update Operations

| Identifier | Description |
| ---------- | ----------- |
| `:archivist.fact/update` | Update an existing fact |
| `:archivist.aspect/update` | Update an existing aspect |
| `:archivist.concept/update` | Update an existing concept |
| `:archivist.definition/update` | Update an existing definition |
| `:archivist.individual/update` | Update an existing individual |
| `:archivist.kind/update` | Update an existing kind |

### Delete Operations

| Identifier | Description |
| ---------- | ----------- |
| `:archivist.fact/delete` | Delete a fact |
| `:archivist.fact/batch-delete` | Delete multiple facts by their UIDs |
| `:archivist.aspect/delete` | Delete an aspect |
| `:archivist.kind/delete` | Delete a kind |

### System Operations

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |
| `:archivist.transaction/commit` | Commit a transaction |
| `:archivist.transaction/rollback` | Rollback a transaction |
| `:archivist.validation/validate` | Validate an entity |

## Individual Message Documentation

Below is the detailed documentation for each message supported by the Archivist component.

---

## `:archivist.graph/query-execute`

**Type:** Command

**Component:** Archivist

**Resource:** Graph

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :query string "The Cypher query to execute"
  
  ;; Optional fields
  (params) map "Map of query parameters"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data [...] "The results of the query execution"
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Executes a Cypher query against the Neo4j graph database. Used for custom queries that aren't covered by other specialized endpoints.

### Examples

```clojure
;; Example request
{:type :archivist.graph/query-execute
 :payload {:query "MATCH (n:Entity) RETURN n LIMIT 10"}}

;; Example response
{:success true
 :data [{:n {:uid "123", :name "Example Entity"}}
        {:n {:uid "456", :name "Another Entity"}}]}
```

---

## `:archivist.fact/batch-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [string] "List of fact UIDs to retrieve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of retrieved facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves a batch of facts by their UIDs. This is more efficient than making individual requests for multiple facts.

### Examples

```clojure
;; Example request
{:type :archivist.fact/batch-get
 :payload {:uids ["fact-123", "fact-456", "fact-789"]}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-123", :type "classification", ...},
           {:uid "fact-456", :type "specialization", ...},
           {:uid "fact-789", :type "composition", ...}]
 }
}
```

### Related Messages

- `:archivist.fact/count` - Get count of all facts
- `:archivist.fact/list` - Get facts with filtering options
---

## `:archivist.fact/count`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

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
    :count number "Number of facts in the system"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Returns the total count of facts in the system. Useful for pagination or status overviews.

### Examples

```clojure
;; Example request
{:type :archivist.fact/count
 :payload {}}

;; Example response
{:success true
 :data {
   :count 12345
 }
}
```

---

## `:archivist.entity/batch-resolve`

**Type:** Command

**Component:** Archivist

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [string] "List of entity UIDs to resolve"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data [...] "Array of resolved entity data"
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Resolves multiple entity UIDs to their full entity data in a single request. Used to efficiently batch-load multiple entities.

### Examples

```clojure
;; Example request
{:type :archivist.entity/batch-resolve
 :payload {:uids ["entity-123", "entity-456"]}}

;; Example response
{:success true
 :data [{:uid "entity-123", :name "Example Entity", :type "Individual"},
        {:uid "entity-456", :name "Another Entity", :type "Kind"}]}
```

---

## `:archivist.kind/list`

**Type:** Command

**Component:** Archivist

**Resource:** Kind

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Optional fields
  (sort) [string, string] "Field and direction to sort by (e.g. ['name', 'ASC'])"
  (range) [number, number] "Start and end indices for pagination"
  (filter) map "Filter criteria for kinds"
  (user-id) string "User ID to filter by ownership"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data [...] "Array of kind data"
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves a list of kinds, with optional sorting, pagination, and filtering. Primarily used for browsing and searching the kind hierarchy.

### Examples

```clojure
;; Example request
{:type :archivist.kind/list
 :payload {:sort ["name", "ASC"]
           :range [0, 10]
           :filter {}}}

;; Example response
{:success true
 :data [{:uid "kind-123", :name "Physical Object"},
        {:uid "kind-456", :name "Activity"}]}
```

### Related Messages

- `:archivist.kind/get` - Get a single kind by UID

---

## `:archivist.search/text`

**Type:** Command

**Component:** Archivist

**Resource:** Search

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :searchTerm string "Text to search for"
  
  ;; Optional fields
  (collectionUID) string "UID of collection to search within"
  (page) number "Page number for pagination (default: 1)"
  (pageSize) number "Number of results per page (default: 10)"
  (filter) map "Additional filter criteria"
  (exactMatch) boolean "Whether to perform exact matching (default: false)"
}
```

### Response

```clojure
{
  :success boolean "Whether the search succeeded"
  :data {
    :results {
      :items [...] "Search result items"
      :total number "Total number of results"
    }
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Performs a text search across entities. Supports pagination, filtering by collection, and exact or fuzzy matching.

### Examples

```clojure
;; Example request
{:type :archivist.search/text
 :payload {:searchTerm "pump"
           :collectionUID "collection-123"
           :page 1
           :pageSize 20}}

;; Example response
{:success true
 :data {
   :results {
     :items [{:uid "entity-123", :name "Centrifugal Pump", ...},
             {:uid "entity-456", :name "Pump Station", ...}],
     :total 45
   }
 }
}
```

### Related Messages

- `:archivist.search/uid` - Search by entity UID
- `:archivist.search/individual` - Search for individuals
- `:archivist.search/kind` - Search for kinds
---

## `:archivist.fact/all-related-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID to get related facts for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of related facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves all facts related to a specific entity. This includes facts where the entity is either the left-hand or right-hand side of the relationship.

### Examples

```clojure
;; Example request
{:type :archivist.fact/all-related-get
 :payload {:uid "entity-123"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-123", :type "classification", ...},
           {:uid "fact-456", :type "composition", ...}]
 }
}
```

---

## `:archivist.fact/definitive-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID to get definitive facts for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of definitive facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves the definitive facts for a specific entity. Definitive facts are those that define the core characteristics of an entity.

### Examples

```clojure
;; Example request
{:type :archivist.fact/definitive-get
 :payload {:uid "entity-123"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-123", :type "classification", ...},
           {:uid "fact-456", :type "naming", ...}]
 }
}
```

---

## `:archivist.fact/classification-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID to get classification facts for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of classification facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves the classification facts for a specific entity. Classification facts define what kind of entity this is.

### Examples

```clojure
;; Example request
{:type :archivist.fact/classification-get
 :payload {:uid "entity-123"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-123", :type "classification", 
            :lh {:uid "entity-123", :name "Example Entity"},
            :rh {:uid "kind-456", :name "Physical Object"}}]
 }
}
```

---

## `:archivist.fact/relating-entities-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid1 string "First entity UID"
  :uid2 string "Second entity UID"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of facts relating the two entities"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves all facts that relate two specific entities. This includes direct relationships in either direction.

### Examples

```clojure
;; Example request
{:type :archivist.fact/relating-entities-get
 :payload {:uid1 "entity-123", :uid2 "entity-456"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-789", :type "composition", 
            :lh {:uid "entity-123", :name "System"},
            :rh {:uid "entity-456", :name "Component"}}]
 }
}
```
---

## `:archivist.fact/related-on-uid-subtype-cone-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :lh-object-uid string "Left-hand object UID"
  :rel-type-uid string "Relation type UID"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of facts in the subtype cone"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves facts related on a UID subtype cone. This is used to find relationships that involve subtypes of a specific relation type.

### Examples

```clojure
;; Example request
{:type :archivist.fact/related-on-uid-subtype-cone-get
 :payload {:lh-object-uid "entity-123", :rel-type-uid "relation-456"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-789", :type "composition", ...},
           {:uid "fact-101", :type "aggregation", ...}]
 }
}
```

---

## `:archivist.fact/inherited-relation-get`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID"
  :rel-type-uid string "Relation type UID"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "List of inherited relation facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves inherited relation facts for a specific entity and relation type. This includes relations that are inherited through the type hierarchy.

### Examples

```clojure
;; Example request
{:type :archivist.fact/inherited-relation-get
 :payload {:uid "entity-123", :rel-type-uid "relation-456"}}

;; Example response
{:success true
 :data {
   :facts [{:uid "fact-789", :type "composition", ...},
           {:uid "fact-101", :type "composition", ...}]
 }
}
```

---

## `:archivist.fact/create`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :lh_object_uid number "UID of the left-hand object"
  :rh_object_uid number "UID of the right-hand object"
  :rel_type_uid number "UID of the relation type"
  :rel_type_name string "Name of the relation type"
  
  ;; Optional fields
  (collection_uid) number "UID of the collection this fact belongs to"
  (collection_name) string "Name of the collection this fact belongs to"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :fact {...} "The created fact"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Creates a new fact in the system. A fact represents a relationship between two entities.

### Examples

```clojure
;; Example request
{:type :archivist.fact/create
 :payload {:lh_object_uid 123456
           :rh_object_uid 789012
           :rel_type_uid 1225
           :rel_type_name "is classified as"
           :collection_uid 5001
           :collection_name "My Collection"}}

;; Example success response
{:success true
 :data {
   :fact {
     :fact_uid 345678
     :lh_object_uid 123456
     :rh_object_uid 789012
     :rel_type_uid 1225
     :rel_type_name "is classified as"
     :collection_uid 5001
     :collection_name "My Collection"
   }
 }
}
```

### Related Messages

- `:archivist.fact/update` - Update an existing fact
- `:archivist.fact/delete` - Delete a fact
- `:archivist.fact/batch-create` - Create multiple facts in a batch
- `:archivist.fact/batch-get` - Get multiple facts by UIDs

---

## `:archivist.fact/batch-create`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
[
  {
    ;; Required fields for each fact
    :lh_object_uid number "UID of the left-hand object"
    :rh_object_uid number "UID of the right-hand object"
    :rel_type_uid number "UID of the relation type"
    :rel_type_name string "Name of the relation type"
    
    ;; Optional fields
    (collection_uid) number "UID of the collection this fact belongs to"
    (collection_name) string "Name of the collection this fact belongs to"
  }
  ;; More facts...
]
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :facts [...] "Array of created facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Creates multiple facts in a single batch operation. This is more efficient than making individual create requests for multiple facts. Supports temporary UIDs (1-100) that will be replaced with actual UIDs during creation.

### Examples

```clojure
;; Example request
{:type :archivist.fact/batch-create
 :payload [
   {:lh_object_uid 123456
    :rh_object_uid 789012
    :rel_type_uid 1225
    :rel_type_name "is classified as"},
   {:lh_object_uid 1  ; Temporary UID that will be replaced
    :rh_object_uid 789012
    :rel_type_uid 1226
    :rel_type_name "is part of"}
 ]}

;; Example success response
{:success true
 :data {
   :facts [
     {:fact_uid 345678
      :lh_object_uid 123456
      :rh_object_uid 789012
      :rel_type_uid 1225
      :rel_type_name "is classified as"},
     {:fact_uid 345679
      :lh_object_uid 234567  ; New UID assigned to replace temporary UID 1
      :rh_object_uid 789012
      :rel_type_uid 1226
      :rel_type_name "is part of"}
   ]
 }
}
```

### Related Messages

- `:archivist.fact/create` - Create a single fact
- `:archivist.fact/batch-delete` - Delete multiple facts
  :lh map "Left-hand entity data"
  :rh map "Right-hand entity data"
  
  ;; Optional fields
  (uid) string "Fact UID (generated if not provided)"
  (metadata) map "Additional metadata for the fact"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :fact {...} "The created fact"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Creates a new fact in the system. Facts represent relationships between entities and are the fundamental building blocks of the knowledge graph.

### Examples

```clojure
;; Example request
{:type :archivist.fact/create
 :payload {:type "classification"
           :lh {:uid "entity-123"}
           :rh {:uid "kind-456"}}}

;; Example response
{:success true
 :data {
   :fact {:uid "fact-789", 
          :type "classification",
          :lh {:uid "entity-123", :name "Example Entity"},
          :rh {:uid "kind-456", :name "Physical Object"}}
 }
}
```

### Related Messages

- `:archivist.fact/update` - Update an existing fact
- `:archivist.fact/delete` - Delete a fact

---

## `:archivist.fact/update`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "UID of the fact to update"
  
  ;; Optional fields (at least one must be provided)
  (type) string "New type of fact"
  (lh) map "New left-hand entity data"
  (rh) map "New right-hand entity data"
  (metadata) map "New metadata for the fact"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :fact {...} "The updated fact"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Updates an existing fact in the system. This can be used to change the type, entities involved, or metadata of a fact.

### Examples

```clojure
;; Example request
{:type :archivist.fact/update
 :payload {:uid "fact-123"
           :metadata {:confidence 0.9}}}

;; Example response
{:success true
 :data {
   :fact {:uid "fact-123", 
          :type "classification",
          :lh {:uid "entity-123", :name "Example Entity"},
          :rh {:uid "kind-456", :name "Physical Object"},
          :metadata {:confidence 0.9}}
 }
}
```

### Related Messages

- `:archivist.fact/create` - Create a new fact
- `:archivist.fact/delete` - Delete a fact
---

## `:archivist.fact/delete`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "UID of the fact to delete"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :deleted boolean "Whether the fact was deleted"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Deletes a fact from the system. This permanently removes the relationship from the knowledge graph.

### Examples

```clojure
;; Example request
{:type :archivist.fact/delete
 :payload {:uid "fact-123"}}

;; Example response
{:success true
 :data {
   :deleted true
 }
}
```

### Related Messages

- `:archivist.fact/create` - Create a new fact
- `:archivist.fact/update` - Update an existing fact
- `:archivist.fact/batch-delete` - Delete multiple facts by their UIDs

---

## `:archivist.fact/batch-delete`

**Type:** Command

**Component:** Archivist

**Resource:** Fact

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uids [number] "Array of fact UIDs to delete"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :result string "Success message"
    :uids [number] "UIDs of the deleted facts"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Deletes multiple facts from the system by their UIDs in a single operation.

### Examples

```clojure
;; Example request
{:type :archivist.fact/batch-delete
 :payload {:uids [345678, 345679, 345680]}}

;; Example success response
{:success true
 :data {
   :result "success"
   :uids [345678, 345679, 345680]
 }
}
```

### Related Messages

- `:archivist.fact/delete` - Delete a single fact
- `:archivist.fact/batch-create` - Create multiple facts

---

## `:archivist.entity/type-get`

**Type:** Command

**Component:** Archivist

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID to get type for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :type string "Entity type (e.g., 'Individual', 'Kind')"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves the type of a specific entity. This is used to determine whether an entity is an Individual, Kind, or other type.

### Examples

```clojure
;; Example request
{:type :archivist.entity/type-get
 :payload {:uid "entity-123"}}

;; Example response
{:success true
 :data {
   :type "Individual"
 }
}
```

---

## `:archivist.entity/category-get`

**Type:** Command

**Component:** Archivist

**Resource:** Entity

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid string "Entity UID to get category for"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :category string "Entity category (e.g., 'PhysicalObject', 'Activity')"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Retrieves the category of a specific entity. The category represents the high-level classification of the entity.

### Examples

```clojure
;; Example request
{:type :archivist.entity/category-get
 :payload {:uid "entity-123"}}

;; Example response
{:success true
 :data {
   :category "PhysicalObject"
 }
}
```

---

## `:relica.app/heartbeat`

**Type:** Command

**Component:** System

**Resource:** App

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Optional fields
  (timestamp) number "Client timestamp in milliseconds"
}
```

### Response

```clojure
{
  :success boolean "Whether the heartbeat was acknowledged"
  :data {
    :timestamp number "Server timestamp in milliseconds"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Sends a heartbeat message to maintain the WebSocket connection. Clients should send this message periodically to prevent the connection from timing out.

### Examples

```clojure
;; Example request
{:type :relica.app/heartbeat
 :payload {:timestamp 1621234567890}}

;; Example response
{:success true
 :data {
   :timestamp 1621234567895
 }
}
```

---

## `:archivist.submission/update-definition`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :fact_uid number "UID of the fact to update"
  :partial_definition string "Partial definition text"
  :full_definition string "Full definition text"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :result {...} "Result of the update operation"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Updates the definition of a fact identified by its UID.

### Examples

```clojure
;; Example request
{:type :archivist.submission/update-definition
 :payload {:fact_uid 123456
           :partial_definition "A partial definition"
           :full_definition "A complete definition of the concept"}}

;; Example success response
{:success true
 :data {
   :result {
     :fact_uid 123456
     :partial_definition "A partial definition"
     :full_definition "A complete definition of the concept"
   }
 }
}
```

---

## `:archivist.submission/update-collection`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :fact_uid number "UID of the fact to update"
  :collection_uid number "UID of the collection"
  :collection_name string "Name of the collection"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :result {...} "Result of the update operation"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Updates the collection of a fact identified by its UID.

### Examples

```clojure
;; Example request
{:type :archivist.submission/update-collection
 :payload {:fact_uid 123456
           :collection_uid 5001
           :collection_name "My Collection"}}

;; Example success response
{:success true
 :data {
   :result {
     :fact_uid 123456
     :collection_uid 5001
     :collection_name "My Collection"
   }
 }
}
```

---

## `:archivist.submission/update-name`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :fact_uid number "UID of the fact to update"
  :name string "New name for the entity"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :result {...} "Result of the update operation"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Updates the name of an entity in a fact identified by its UID.

### Examples

```clojure
;; Example request
{:type :archivist.submission/update-name
 :payload {:fact_uid 123456
           :name "New Entity Name"}}

;; Example success response
{:success true
 :data {
   :result {
     :fact_uid 123456
     :name "New Entity Name"
   }
 }
}
```

---

## `:archivist.submission/blanket-rename`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :entity_uid number "UID of the entity to rename"
  :name string "New name for the entity"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :result {...} "Result of the update operation"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Updates the name of an entity at every instance where it appears in the system.

### Examples

```clojure
;; Example request
{:type :archivist.submission/blanket-rename
 :payload {:entity_uid 123456
           :name "New Entity Name"}}

;; Example success response
{:success true
 :data {
   :result {
     :entity_uid 123456
     :name "New Entity Name"
     :updated_facts 5  // Number of facts updated
   }
 }
}
```

---

## `:archivist.submission/add-synonym`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :uid number "UID of the entity to add synonym to"
  :synonym string "Synonym to add"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :uid number "UID of the entity"
    :synonym string "Added synonym"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Adds a synonym to an entity identified by its UID.

### Examples

```clojure
;; Example request
{:type :archivist.submission/add-synonym
 :payload {:uid 123456
           :synonym "Alternative Name"}}

;; Example success response
{:success true
 :data {
   :uid 123456
   :synonym "Alternative Name"
 }
}
```

---

## `:archivist.submission/create-date`

**Type:** Command

**Component:** Archivist

**Resource:** Submission

**Direction:** Client→Server

### Payload Schema

```clojure
{
  ;; Required fields
  :date_uid number "UID for the date entity"
  :collection_uid number "UID of the collection"
  :collection_name string "Name of the collection"
}
```

### Response

```clojure
{
  :success boolean "Whether the operation succeeded"
  :data {
    :fact {...} "The created date fact"
  }
  :error {
    :code number "Error code"
    :type string "Error type"
    :message string "Error message"
    :details map "Additional error details"
  }
}
```

### Description

Creates a date entity and classifies it as a date.

### Examples

```clojure
;; Example request
{:type :archivist.submission/create-date
 :payload {:date_uid 123456
           :collection_uid 5001
           :collection_name "My Collection"}}

;; Example success response
{:success true
 :data {
   :fact {
     :fact_uid 345678
     :lh_object_uid 123456
     :lh_object_name "123456"
     :rel_type_uid 1225
     :rel_type_name "is classified as"
     :rh_object_uid 550571
     :rh_object_name "date"
     :collection_uid 5001
     :collection_name "My Collection"
   }
 }
}
```

---

## Implementation Notes

This documentation covers the standardized WebSocket API for the Archivist component of the Relica system. The following implementation notes provide additional context and guidance.

### Message Handling

- All messages should be processed asynchronously
- Error responses should include detailed error messages
- Successful responses should include the appropriate data

### Error Handling

- If a required field is missing, return an error with a descriptive message
- If an operation fails, return an error with details about the failure
- If a resource is not found, return an appropriate error message

### Response Format

All responses follow a standardized format:

```clojure
{
  :success boolean "Whether the operation succeeded"
  :request_id string "Optional, included when available"
  :data { ... }  "Payload containing the actual response data"
}
```

For error responses:

```clojure
{
  :success false
  :request_id string "Optional, included when available"
  :error {
    :code number "Numeric error code"
    :type string "String identifier for the error type"
    :message string "Human-readable error message"
    :details { ... }  "Optional field with additional error context"
  }
}
```

### Error Codes

Error codes are grouped by category:

- **System Errors (1001-1099)**: Service unavailable, internal errors, timeouts
- **Validation Errors (1101-1199)**: Missing fields, invalid formats, constraint violations
- **Data Access Errors (1201-1299)**: Resource not found, query failures, unauthorized access

### Performance Considerations

- Batch operations should be used when processing multiple resources
- Pagination should be used for operations that return large result sets
- Caching may be used to improve performance for frequently accessed resources