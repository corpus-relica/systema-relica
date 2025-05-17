# Prism WebSocket Message Mapping

This document maps the old WebSocket message identifiers to their new standardized versions, preserving the semantic meaning of each operation.

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **Setup Operations**: Operations related to system setup and initialization
3. **System Operations**: Operations related to application status and connection management (common across modules)
4. **Broadcast Events**: Messages sent to all connected clients

## Message Mapping

### Get Operations (Read-only)

| Old Identifier      | New Identifier            | Semantic Meaning             |
| ------------------- | ------------------------- | ---------------------------- |
| `:setup-status/get` | `:prism.setup/get-status` | Get the current setup status |

### Setup Operations

| Old Identifier       | New Identifier             | Semantic Meaning         |
| -------------------- | -------------------------- | ------------------------ |
| `:setup/start`       | `:prism.setup/start`       | Start the setup sequence |
| `:setup/create-user` | `:prism.setup/create-user` | Create an admin user     |

### System Operations (Common across modules)

| Old Identifier        | New Identifier             | Semantic Meaning                        |
| --------------------- | -------------------------- | --------------------------------------- |
| `:app/heartbeat`      | `:relica.app/heartbeat`    | Client heartbeat to maintain connection |
| `:chsk/uidport-open`  | `:relica.connection/open`  | WebSocket connection opened             |
| `:chsk/uidport-close` | `:relica.connection/close` | WebSocket connection closed             |

### Broadcast Events

| Old Identifier  | New Identifier       | Semantic Meaning          |
| --------------- | -------------------- | ------------------------- |
| `:setup/update` | `:prism.setup/event` | Setup status update event |

## Implementation Notes

1. The new naming convention follows the format `:prism.<domain>/<action>` for Prism-specific operations where:

   - `<domain>` is the domain of the operation (setup, etc.)
   - `<action>` is the action being performed (get-status, start, create-user, etc.)

2. For system-level operations common across modules, the format is `:relica.<domain>/<action>` to indicate it's a system-wide operation.

3. For outgoing events, the format is `:prism.<domain>/event` to indicate it's an event notification.

4. The semantic meaning of operations is preserved:

   - "get" operations remain as "get" or are clarified with more specific terms
   - System operations use descriptive terms for their actions

5. Some operations have been renamed for clarity and consistency:
   - `:setup-status/get` → `:prism.setup/get-status` (more consistent domain grouping)
   - `:setup/update` → `:prism.setup/event` (clarifies it's an event notification)
   - `:app/heartbeat` → `:relica.app/heartbeat` (system-wide operation)
