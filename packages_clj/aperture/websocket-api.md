# Aperture WebSocket API

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that don't alter the environment
2. **Load Operations**: Operations that add data to the environment
3. **Unload Operations**: Operations that remove data from the environment
4. **Other Operations**: Operations that don't fit into the above categories (select, create, etc.)
5. **Broadcast Messages**: Messages sent to all connected clients

## Message Reference

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

### Broadcast Messages

| Identifier | Description |
| ---------- | ----------- |
| `:aperture.facts/loaded` | Notify that facts were loaded |
| `:aperture.facts/unloaded` | Notify that facts were unloaded |
| `:aperture.entity/selected` | Notify that an entity was selected |
| `:aperture.entity/deselected` | Notify that an entity was deselected |