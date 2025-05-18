# Archivist WebSocket Message Mappings

This document catalogs all WebSocket message identifiers used in the Archivist component and provides the mapping to the new standardized format.

## Incoming Messages (client → server)

| Current Identifier | New Standardized Identifier | Description |
| --- | --- | --- |
| `:graph/execute-query` | `:archivist.graph/query-execute` | Execute a graph query |
| `:fact/get-batch` | `:archivist.fact/batch-get` | Get a batch of facts |
| `:fact/count` | `:archivist.fact/count` | Get count of facts |
| `:fact/get-all-related` | `:archivist.fact/all-related-get` | Get all facts related to an entity |
| `:fact/get-definitive-facts` | `:archivist.fact/definitive-get` | Get definitive facts for an entity |
| `:fact/get-classification-fact` | `:archivist.fact/classification-get` | Get classification facts for an entity |
| `:fact/get-relating-entities` | `:archivist.fact/relating-entities-get` | Get facts relating two entities |
| `:fact/get-related-on-uid-subtype-cone` | `:archivist.fact/related-on-uid-subtype-cone-get` | Get facts related on UID subtype cone |
| `:fact/get-inherited-relation` | `:archivist.fact/inherited-relation-get` | Get inherited relation facts |
| `:fact/get-related-to` | `:archivist.fact/related-to-get` | Get facts related to an entity |
| `:fact/get-related-to-subtype-cone` | `:archivist.fact/related-to-subtype-cone-get` | Get facts related to subtype cone |
| `:fact/get-recursive-relations` | `:archivist.fact/recursive-relations-get` | Get recursive relation facts |
| `:fact/get-recursive-relations-to` | `:archivist.fact/recursive-relations-to-get` | Get recursive relation facts to an entity |
| `:fact/get-classified` | `:archivist.fact/classified-get` | Get classified facts |
| `:fact/get-subtypes` | `:archivist.fact/subtypes-get` | Get subtype facts |
| `:fact/get-subtypes-cone` | `:archivist.fact/subtypes-cone-get` | Get subtype cone facts |
| `:fact/get-core-sample` | `:archivist.fact/core-sample-get` | Get core sample facts |
| `:fact/get-core-sample-rh` | `:archivist.fact/core-sample-rh-get` | Get core sample RH facts |
| `:entities/resolve` | `:archivist.entity/batch-resolve` | Resolve multiple entity UIDs |
| `:entity/category` | `:archivist.entity/category-get` | Get category of an entity |
| `:entity/collections` | `:archivist.entity/collections-get` | Get collections |
| `:entity/type` | `:archivist.entity/type-get` | Get entity type |
| `:kinds/list` | `:archivist.kind/list` | List kinds |
| `:general-search/text` | `:archivist.search/text` | Perform text search |
| `:specialization/fact` | `:archivist.specialization/fact-get` | Get specialization fact |
| `:specialization/hierarchy` | `:archivist.specialization/hierarchy-get` | Get specialization hierarchy |
| `:lineage/get` | `:archivist.lineage/get` | Get lineage for an entity |
| `:app/heartbeat` | `:archivist.system/heartbeat` | Heartbeat message |

## Client-side Messages (called from client but not implemented as handlers)

| Current Identifier | New Standardized Identifier | Description |
| --- | --- | --- |
| `:facts/get` | `:archivist.fact/list` | Get facts with filtering options |
| `:facts/create` | `:archivist.fact/create` | Create a new fact |
| `:facts/update` | `:archivist.fact/update` | Update an existing fact |
| `:facts/delete` | `:archivist.fact/delete` | Delete a fact |
| `:aspects/get` | `:archivist.aspect/list` | Get aspects |
| `:aspects/create` | `:archivist.aspect/create` | Create a new aspect |
| `:aspects/update` | `:archivist.aspect/update` | Update an existing aspect |
| `:aspects/delete` | `:archivist.aspect/delete` | Delete an aspect |
| `:completions/get` | `:archivist.completion/list` | Get completions |
| `:concepts/get` | `:archivist.concept/get` | Get a concept |
| `:concepts/create` | `:archivist.concept/create` | Create a new concept |
| `:concepts/update` | `:archivist.concept/update` | Update an existing concept |
| `:definitions/get` | `:archivist.definition/get` | Get a definition |
| `:definitions/create` | `:archivist.definition/create` | Create a new definition |
| `:definitions/update` | `:archivist.definition/update` | Update an existing definition |
| `:individuals/get` | `:archivist.individual/get` | Get an individual |
| `:individuals/create` | `:archivist.individual/create` | Create a new individual |
| `:individuals/update` | `:archivist.individual/update` | Update an existing individual |
| `:kinds/get-one` | `:archivist.kind/get` | Get a kind |
| `:kinds/create` | `:archivist.kind/create` | Create a new kind |
| `:kinds/update` | `:archivist.kind/update` | Update an existing kind |
| `:kinds/delete` | `:archivist.kind/delete` | Delete a kind |
| `:general-search/uid` | `:archivist.search/uid` | Search by UID |
| `:individual-search/get` | `:archivist.search/individual` | Search individuals |
| `:kind-search/get` | `:archivist.search/kind` | Search kinds |
| `:transactions/get` | `:archivist.transaction/get` | Get a transaction |
| `:transactions/create` | `:archivist.transaction/create` | Create a new transaction |
| `:transactions/commit` | `:archivist.transaction/commit` | Commit a transaction |
| `:transactions/rollback` | `:archivist.transaction/rollback` | Rollback a transaction |
| `:validation/validate` | `:archivist.validation/validate` | Validate an entity |

## Implementation Notes

1. The new message identifiers follow the pattern `:component.resource/command`
2. Resources have been standardized (e.g., `fact`, `entity`, `specialization`, etc.)
3. Commands are generally verb-noun format, with most read operations using the pattern `noun-get` for consistency
4. Compound commands maintain their descriptive nature but in a more consistent format
5. The component name ('archivist') is now explicitly included in every message identifier
