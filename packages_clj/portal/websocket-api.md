# Portal WebSocket API

## Message Categories

Messages are categorized based on their semantic meaning and origin:

1. **Component Events**: Events received from other Relica components
2. **Connection Events**: Events related to component connections
3. **Broadcast Events**: Messages sent to all connected clients

## Message Reference

### Component Events

| Identifier | Source | Description |
| ---------- | ------ | ----------- |
| `:aperture.facts/loaded` | Aperture | Facts were loaded into the environment |
| `:aperture.facts/unloaded` | Aperture | Facts were unloaded from the environment |
| `:aperture.entity/selected` | Aperture | An entity was selected |
| `:aperture.entity/deselected` | Aperture | Entity selection was cleared |
| `:nous.chat/final-answer` | Nous | Final answer received from chat |
| `:prism.setup/updated` | Prism | Prism setup status was updated |

### Connection Events

| Identifier | Description |
| ---------- | ----------- |
| `:nous/connected` | Nous connects to portal |
| `:nous/disconnected` | Disconnected from Nous service |
| `:nous/message-received` | Message received from Nous service |
| `:prism/connected` | Prism service connects to portal |
| `:prism/disconnected` | Disconnected from Prism service |