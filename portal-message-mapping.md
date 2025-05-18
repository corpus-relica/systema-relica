# Portal WebSocket Message Mapping

This document maps the WebSocket message identifiers to their new standardized versions, preserving the semantic meaning of each operation.

## Message Categories

Messages are categorized based on their semantic meaning and origin:

1. **Component Events**: Events received from other Relica components
2. **Connection Events**: Events related to component connections
3. **Broadcast Events**: Messages sent to all connected clients

## Message Mapping

### Component Events

| Old Identifier          | New Identifier                | Source   | Semantic Meaning                         |
| ----------------------- | ----------------------------- | -------- | ---------------------------------------- |
| `:facts-loaded`         | `:aperture.facts/loaded`      | Aperture | Facts were loaded into the environment   |
| `:facts-unloaded`       | `:aperture.facts/unloaded`    | Aperture | Facts were unloaded from the environment |
| `:entity-selected`      | `:aperture.entity/selected`   | Aperture | An entity was selected                   |
| `:entity-selected-none` | `:aperture.entity/deselected` | Aperture | Entity selection was cleared             |
| `:final-answer`         | `:nous.chat/final-answer`     | Nous     | Final answer received from chat          |
| `:prism-setup-update`   | `:prism.setup/updated`        | Prism    | Prism setup status was updated           |

### Connection Events

| Old Identifier           | New Identifier           | Semantic Meaning                   |
| ------------------------ | ------------------------ | ---------------------------------- |
| `:nous-connected`        | `:nous/connected`        | Nous connects to portal            |
| `:nous-disconnected`     | `:nous/disconnected`     | Disconnected from Nous service     |
| `:nous-message-received` | `:nous/message-received` | Message received from Nous service |
| `:prism-connected`       | `:prism/connected`       | Prism service connects to portal   |
| `:prism-disconnected`    | `:prism/disconnected`    | Disconnected from Prism service    |

### Broadcast Events

keep these the same for now

## Implementation Notes

1. The new naming convention follows these patterns:

   - Component events: `:<component>.<domain>/<event>` to indicate which component generated the event
   - Connection events: `:connection/<component>-<state>` for connection status events
   - Broadcast events: `"<domain>/<event>"` for messages sent to clients (dropping the "portal:" prefix)

2. Client-facing message identifiers (from the TypeScript frontend) remain unchanged to maintain backward compatibility.

3. The semantic meaning of operations is preserved while standardizing the format to match other components.

4. Some operations have been renamed for clarity and consistency:

   - `:entity-selected-none` → `:aperture.entity/deselected` (more descriptive)
   - `"portal:entitySelectedNone"` → `"entity/deselected"` (more consistent)

5. Plural semantics are maintained where appropriate (e.g., `facts` remains plural in the standardized identifiers).
