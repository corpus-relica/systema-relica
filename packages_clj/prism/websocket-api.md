# Prism WebSocket API

## Message Categories

Messages are categorized based on their semantic meaning:

1. **Get Operations**: Read-only operations that retrieve data without altering the system
2. **Setup Operations**: Operations related to system setup and initialization
3. **System Operations**: Operations related to application status and connection management (common across modules)
4. **Broadcast Events**: Messages sent to all connected clients

## Message Reference

### Get Operations (Read-only)

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/get-status` | Get the current setup status |

### Setup Operations

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/start` | Start the setup sequence |
| `:prism.setup/create-user` | Create an admin user |

### System Operations (Common across modules)

| Identifier | Description |
| ---------- | ----------- |
| `:relica.app/heartbeat` | Client heartbeat to maintain connection |
| `:relica.connection/open` | WebSocket connection opened |
| `:relica.connection/close` | WebSocket connection closed |

### Broadcast Events

| Identifier | Description |
| ---------- | ----------- |
| `:prism.setup/event` | Setup status update event |