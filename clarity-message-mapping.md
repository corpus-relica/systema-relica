# Clarity WebSocket Message Mapping

This document maps the old WebSocket message identifiers to their new standardized versions, preserving the semantic meaning of each operation.

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **System Operations**: Operations related to application status and connection management (common across modules)

## Message Mapping

### Get Operations (Read-only)

| Old Identifier          | New Identifier             | Semantic Meaning              |
| ----------------------- | -------------------------- | ----------------------------- |
| `:get/model`            | `:clarity.model/get`       | Get a semantic model by ID    |
| `:get/models`           | `:clarity.model/get-batch` | Get multiple semantic models  |
| `:get/kind-model`       | `:clarity.kind/get`        | Get a kind model by ID        |
| `:get/individual-model` | `:clarity.individual/get`  | Get an individual model by ID |

### System Operations (Common across modules)

| Old Identifier        | New Identifier               | Semantic Meaning                        |
| --------------------- | ---------------------------- | --------------------------------------- |
| `:app/request-status` | `:relica.app/status-request` | Request application status              |
| `:app/heartbeat`      | `:relica.app/heartbeat`      | Client heartbeat to maintain connection |
| `:chsk/uidport-open`  | `:relica.connection/open`    | WebSocket connection opened             |
| `:chsk/uidport-close` | `:relica.connection/close`   | WebSocket connection closed             |

### Broadcast Events

| Old Identifier                   | New Identifier              | Semantic Meaning                |
| -------------------------------- | --------------------------- | ------------------------------- |
| `:get/individual-model-response` | `:clarity.individual/event` | Individual model response event |

## Implementation Notes

1. The new naming convention follows the format `:clarity.<domain>/<action>` for Clarity-specific operations where:

   - `<domain>` is the domain of the operation (model, kind, individual, etc.)
   - `<action>` is the action being performed (get, etc.)

2. For system-level operations common across modules, the format is `:relica.<domain>/<action>` to indicate it's a system-wide operation.

3. For outgoing events, the format is `:clarity.<domain>/event` to indicate it's an event notification.

4. The semantic meaning of operations is preserved:

   - "get" operations remain as "get" or are clarified with more specific terms
   - System operations use descriptive terms for their actions

5. Some operations have been renamed for clarity and consistency:
   - `:get/models` → `:clarity.model/get-batch` (more descriptive of batch operation)
   - `:app/request-status` → `:relica.app/status-request` (system-wide operation)
   - `:app/heartbeat` → `:relica.app/heartbeat` (system-wide operation)
   - `:chsk/uidport-open` → `:relica.connection/open` (more descriptive)
   - `:chsk/uidport-close` → `:relica.connection/close` (more descriptive)
