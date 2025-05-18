# Clarity WebSocket API

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **System Operations**: Operations related to application status and connection management (common across modules)

## Message Reference

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:clarity.model/get` | Get a semantic model by ID |
| `:clarity.model/get-batch` | Get multiple semantic models |
| `:clarity.kind/get` | Get a kind model by ID |
| `:clarity.individual/get` | Get an individual model by ID |

### System Operations (Common across modules)

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/status-request` | Request application status |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |
| `:relica.connection/open` | WebSocket connection opened |
| `:relica.connection/close` | WebSocket connection closed |

### Broadcast Events

| Identifier | Description |
| ---------- | ----------- |
| `:clarity.individual/event` | Individual model response event |