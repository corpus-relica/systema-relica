# Archivist WebSocket Message Registry

This registry documents all WebSocket messages used by the Archivist component following the standardized `:component.resource/command` format.

## :archivist.graph/query-execute

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
  :success boolean "Whether the query executed successfully"
  :result [...] "The results of the query execution"
  :error string "Error message on failure"
}
```

### Description

Executes a Cypher query against the Neo4j graph database. Used for custom queries that
aren't covered by other specialized endpoints.

### Examples

```clojure
;; Example request
{:type :archivist.graph/query-execute
 :payload {:query "MATCH (n:Entity) RETURN n LIMIT 10"}}

;; Example response
{:success true
 :result [{:n {:uid "123", :name "Example Entity"}}
          {:n {:uid "456", :name "Another Entity"}}]}
```

## :archivist.fact/batch-get

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
  :facts [...] "List of retrieved facts"
  :error string "Error message on failure"
}
```

### Description

Retrieves a batch of facts by their UIDs. This is more efficient than making
individual requests for multiple facts.

### Examples

```clojure
;; Example request
{:type :archivist.fact/batch-get
 :payload {:uids ["fact-123", "fact-456", "fact-789"]}}

;; Example response
{:success true
 :facts [{:uid "fact-123", :type "classification", ...},
         {:uid "fact-456", :type "specialization", ...},
         {:uid "fact-789", :type "composition", ...}]}
```

### Related Messages

- `:archivist.fact/count` - Get count of all facts
- `:archivist.fact/list` - Get facts with filtering options

## :archivist.fact/count

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
  :count number "Number of facts in the system"
  :error string "Error message on failure"
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
 :count 12345}
```

## :archivist.entity/batch-resolve

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
  :resolved boolean "Whether the resolution was successful"
  :data [...] "Array of resolved entity data"
  :error string "Error message on failure"
}
```

### Description

Resolves multiple entity UIDs to their full entity data in a single request.
Used to efficiently batch-load multiple entities.

### Examples

```clojure
;; Example request
{:type :archivist.entity/batch-resolve
 :payload {:uids ["entity-123", "entity-456"]}}

;; Example response
{:resolved true
 :data [{:uid "entity-123", :name "Example Entity", :type "Individual"},
        {:uid "entity-456", :name "Another Entity", :type "Kind"}]}
```

## :archivist.kind/list

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
  :resolved boolean "Whether the operation succeeded"
  :data [...] "Array of kind data"
  :error string "Error message on failure"
}
```

### Description

Retrieves a list of kinds, with optional sorting, pagination, and filtering.
Primarily used for browsing and searching the kind hierarchy.

### Examples

```clojure
;; Example request
{:type :archivist.kind/list
 :payload {:sort ["name", "ASC"]
           :range [0, 10]
           :filter {}}}

;; Example response
{:resolved true
 :data [{:uid "kind-123", :name "Physical Object"},
        {:uid "kind-456", :name "Activity"}]}
```

### Related Messages

- `:archivist.kind/get` - Get a single kind by UID

## :archivist.search/text

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
  :results {:items [...], :total number} "Search results and total count"
  :error string "Error message on failure"
}
```

### Description

Performs a text search across entities. Supports pagination, filtering by collection,
and exact or fuzzy matching.

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
 :results {:items [{:uid "entity-123", :name "Centrifugal Pump", ...},
                  {:uid "entity-456", :name "Pump Station", ...}],
           :total 45}}
```

### Related Messages

- `:archivist.search/uid` - Search by entity UID
- `:archivist.search/individual` - Search for individuals
- `:archivist.search/kind` - Search for kinds

## Implementation Notes

This registry documents the new standardized WebSocket message identifiers for the Archivist component. The full documentation includes many more messages, but this sample showcases the key messages and their documentation format.

Key patterns:
1. All message identifiers follow `:component.resource/command` format
2. Commands are generally verb-noun format, with most read operations using the pattern `noun-get` for consistency
3. All operations include well-defined payload schemas and response formats
4. Related messages are cross-referenced where applicable
5. Examples show both request and response formats