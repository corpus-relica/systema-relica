# Aperture WebSocket Message Mapping

This document maps the old WebSocket message identifiers to their new standardized versions, preserving the semantic meaning of each operation.

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that don't alter the environment
2. **Load Operations**: Operations that add data to the environment
3. **Unload Operations**: Operations that remove data from the environment
4. **Other Operations**: Operations that don't fit into the above categories (select, create, etc.)
5. **Broadcast Messages**: Messages sent to all connected clients

## Message Mapping

### Get Operations (Read-only)

| Old Identifier      | New Identifier               | Semantic Meaning            |
| ------------------- | ---------------------------- | --------------------------- |
| `:environment/get`  | `:aperture.environment/get`  | Get environment details     |
| `:environment/list` | `:aperture.environment/list` | List available environments |

### Load Operations (Add data to environment)

| Old Identifier                          | New Identifier                       | Semantic Meaning                        |
| --------------------------------------- | ------------------------------------ | --------------------------------------- |
| `:environment/text-search-load`         | `:aperture.search/load-text`         | Load facts based on text search         |
| `:environment/uid-search-load`          | `:aperture.search/load-uid`          | Load facts based on UID search          |
| `:environment/load-specialization-fact` | `:aperture.specialization/load-fact` | Load a specific specialization fact     |
| `:environment/load-specialization`      | `:aperture.specialization/load`      | Load specialization hierarchy           |
| `:environment/load-all-related-facts`   | `:aperture.fact/load-related`        | Load all facts related to an entity     |
| `:environment/load-entity`              | `:aperture.entity/load`              | Load a specific entity                  |
| `:environment/load-entities`            | `:aperture.entity/load-multiple`     | Load multiple entities                  |
| `:environment/load-subtypes`            | `:aperture.subtype/load`             | Load subtypes of an entity              |
| `:environment/load-subtypes-cone`       | `:aperture.subtype/load-cone`        | Load subtypes cone of an entity         |
| `:environment/load-classified`          | `:aperture.classification/load`      | Load classified entities                |
| `:environment/load-classification-fact` | `:aperture.classification/load-fact` | Load a specific classification fact     |
| `:environment/load-composition`         | `:aperture.composition/load`         | Load composition relationships          |
| `:environment/load-composition-in`      | `:aperture.composition/load-in`      | Load incoming composition relationships |
| `:environment/load-connections`         | `:aperture.connection/load`          | Load connections from an entity         |
| `:environment/load-connections-in`      | `:aperture.connection/load-in`       | Load connections to an entity           |

### Unload Operations (Remove data from environment)

| Old Identifier                      | New Identifier                     | Semantic Meaning                    |
| ----------------------------------- | ---------------------------------- | ----------------------------------- |
| `:environment/unload-entity`        | `:aperture.entity/unload`          | Unload a specific entity            |
| `:environment/unload-entities`      | `:aperture.entity/unload-multiple` | Unload multiple entities            |
| `:environment/unload-subtypes-cone` | `:aperture.subtype/unload-cone`    | Unload subtypes cone of an entity   |
| `:environment/clear-entities`       | `:aperture.environment/clear`      | Clear all entities from environment |

### Other Operations

| Old Identifier        | New Identifier                 | Semantic Meaning                       |
| --------------------- | ------------------------------ | -------------------------------------- |
| `:environment/create` | `:aperture.environment/create` | Create a new environment               |
| `:entity/select`      | `:aperture.entity/select`      | Select an entity                       |
| `:entity/select-none` | `:aperture.entity/deselect`    | Deselect the currently selected entity |

### Broadcast Messages

| Old Identifier          | New Identifier                | Semantic Meaning                     |
| ----------------------- | ----------------------------- | ------------------------------------ |
| `:facts/loaded`         | `:aperture.facts/loaded`      | Notify that facts were loaded        |
| `:facts/unloaded`       | `:aperture.facts/unloaded`    | Notify that facts were unloaded      |
| `:entity/selected`      | `:aperture.entity/selected`   | Notify that an entity was selected   |
| `:entity/selected-none` | `:aperture.entity/deselected` | Notify that an entity was deselected |

## Implementation Notes

1. The new naming convention follows the format `:aperture.<domain>/<action>` where:

   - `<domain>` is the domain of the operation (environment, entity, fact, etc.)
   - `<action>` is the action being performed (get, load, unload, etc.)

2. The semantic meaning of operations is preserved:

   - "get" operations remain as "get"
   - "load" operations preserve the "load" verb
   - "unload" operations preserve the "unload" verb

3. Some operations have been renamed for clarity and consistency:
   - `:entity/select-none` → `:aperture.entity/deselect` (more descriptive)
   - `:environment/clear-entities` → `:aperture.environment/clear` (more concise)
