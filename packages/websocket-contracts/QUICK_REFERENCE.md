# WebSocket Contracts Quick Reference

**Fast reference for using WebSocket contracts in Systema Relica services.**

## 🚀 Quick Start

### Basic Import Pattern
```typescript
import { 
  PrismActions, 
  FactActions, 
  SearchActions,
  ValidationUtils 
} from '@relica/websocket-contracts';
```

### Action Usage (Actions ARE Topics)
```typescript
// ✅ Use action directly as WebSocket topic
const topic = PrismActions.GET_SETUP_STATUS; // 'setup/get-status'
client.emit(topic, messageData);

// ✅ Handle in service
@SubscribeMessage(PrismActions.GET_SETUP_STATUS)
handleGetStatus(client: Socket, data: any) {
  // Handle the message
}
```

## 📋 Service Action Reference

### Prism (System Control) - Port 3005
```typescript
import { PrismActions, PrismEvents } from '@relica/websocket-contracts';

// Common actions
PrismActions.GET_SETUP_STATUS     // 'setup/get-status'
PrismActions.RESET_SYSTEM         // 'setup/reset-system'
PrismActions.CREATE_USER          // 'setup/create-user'
PrismActions.CACHE_BUILD          // 'cache/build'
PrismActions.CACHE_STATUS         // 'cache/get-status'

// Events (broadcasts)
PrismEvents.SETUP_STATUS_CHANGED  // 'setup/status-changed'
PrismEvents.CACHE_PROGRESS        // 'cache/progress'
```

### Archivist (Data Layer) - Port 3000
```typescript
import { 
  FactActions, 
  SearchActions, 
  ConceptActions 
} from '@relica/websocket-contracts';

// Fact operations
FactActions.CREATE               // 'fact/create'
FactActions.GET                  // 'fact/get'
FactActions.DELETE               // 'fact/delete'
FactActions.BATCH_GET            // 'fact/batch-get'

// Search operations
SearchActions.GENERAL            // 'search/general'
SearchActions.KIND               // 'search/kind'
SearchActions.INDIVIDUAL         // 'search/individual'

// Concept operations
ConceptActions.GET               // 'concept/get'
ConceptActions.DELETE            // 'concept/delete'
```

### Aperture (Environment) - Port 3002
```typescript
import { ApertureActions } from '@relica/websocket-contracts';

// Environment management
ApertureActions.ENVIRONMENT_GET     // 'environment/get'
ApertureActions.ENVIRONMENT_CREATE  // 'environment/create'
ApertureActions.ENVIRONMENT_CLEAR   // 'environment/clear'

// Entity operations
ApertureActions.ENTITY_LOAD         // 'entity/load'
ApertureActions.ENTITY_UNLOAD       // 'entity/unload'
ApertureActions.ENTITY_SELECT       // 'entity/select'
```

### Clarity (Semantic Layer) - Port 3001
```typescript
import { ClarityActions } from '@relica/websocket-contracts';

// Model operations
ClarityActions.MODEL_GET            // 'model/get'
ClarityActions.MODEL_CREATE         // 'model/create'
ClarityActions.MODEL_UPDATE         // 'model/update'

// Kind operations
ClarityActions.KIND_GET             // 'kind/get'
ClarityActions.INDIVIDUAL_GET       // 'individual/get'
```

### Portal (Gateway) - Port 2204
```typescript
import { 
  PortalUserActions, 
  PortalSystemEvents 
} from '@relica/websocket-contracts';

// User actions (frontend → portal)
PortalUserActions.SELECT_ENTITY         // 'user/select-entity'
PortalUserActions.LOAD_ENTITY           // 'user/load-entity'
PortalUserActions.DELETE_ENTITY         // 'user/delete-entity'

// System events (portal → frontend)
PortalSystemEvents.LOADED_FACTS         // 'system/loaded-facts'
PortalSystemEvents.STATE_CHANGED        // 'system/state-changed'
```

### NOUS (AI) - Port 3006
```typescript
import { NOUSActions } from '@relica/websocket-contracts';

NOUSActions.PROCESS_CHAT_INPUT      // 'chat/process-input'
NOUSActions.GENERATE_RESPONSE       // 'ai/generate-response'
NOUSActions.PING                    // 'system/ping'
```

## 💬 Message Patterns

### Request-Response Pattern
```typescript
// Request message
const request = {
  id: uuidv4(),
  type: 'request' as const,
  service: 'prism',
  action: PrismActions.GET_SETUP_STATUS,
  timestamp: Date.now()
};

// Response message
const response = {
  id: uuidv4(),
  type: 'response' as const,
  correlationId: request.id,
  success: true,
  data: { status: 'ready', progress: 100 },
  timestamp: Date.now()
};
```

### Event Broadcast Pattern
```typescript
// Event message
const event = {
  id: uuidv4(),
  type: 'event' as const,
  action: PrismEvents.SETUP_STATUS_CHANGED,
  data: { status: 'in-progress', stage: 'database-setup' },
  timestamp: Date.now()
};
```

## 🔧 Implementation Examples

### Service Handler (NestJS)
```typescript
import { PrismActions, ValidationUtils } from '@relica/websocket-contracts';

@SubscribeMessage(PrismActions.GET_SETUP_STATUS)
async handleGetSetupStatus(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any
): Promise<void> {
  // Optional validation in development
  if (process.env.NODE_ENV === 'development') {
    const validation = ValidationUtils.validateBaseMessage(data);
    if (!validation.success) {
      console.error('Invalid message:', validation.error);
      return;
    }
  }

  // Business logic
  const status = await this.setupService.getStatus();
  
  // Send response
  client.emit('response', {
    id: uuidv4(),
    type: 'response',
    correlationId: data.id,
    success: true,
    data: status
  });
}
```

### Frontend Client Usage
```typescript
import { PrismActions } from '@relica/websocket-contracts';

// Send request
const message = {
  id: uuidv4(),
  type: 'request' as const,
  service: 'prism',
  action: PrismActions.GET_SETUP_STATUS
};

socket.emit(PrismActions.GET_SETUP_STATUS, message);

// Listen for response
socket.on('response', (response) => {
  if (response.correlationId === message.id) {
    console.log('Setup status:', response.data);
  }
});
```

### Portal Service Client
```typescript
import { PrismSocketClient } from '@relica/websocket-clients';

export class PrismService {
  constructor(private prismClient: PrismSocketClient) {}

  async getSetupStatus(): Promise<SetupStatus> {
    const message = {
      id: uuidv4(),
      type: 'request' as const,
      service: 'prism',
      action: PrismActions.GET_SETUP_STATUS
    };

    return this.prismClient.sendMessage(message);
  }
}
```

## 🛡️ Validation Examples

### Development Validation
```typescript
import { ValidationUtils, createDebugValidator } from '@relica/websocket-contracts';

// Simple validation
const result = ValidationUtils.validateBaseMessage(message);
if (!result.success) {
  console.error('Validation failed:', result.error);
}

// Debug validator with logging
const debugValidator = createDebugValidator(true);
const validation = debugValidator.validateMessage(
  SomeSchema, 
  message, 
  'setup/get-status'
);
```

### Contract Testing
```typescript
import { PrismActions, ContractUtils } from '@relica/websocket-contracts';

describe('Setup Status Contract', () => {
  it('should validate request message', () => {
    const message = {
      id: uuidv4(),
      type: 'request' as const,
      service: 'prism',
      action: PrismActions.GET_SETUP_STATUS
    };

    const result = ValidationUtils.validateBaseMessage(message);
    expect(result.success).toBe(true);
  });
});
```

## 🐛 Common Patterns & Troubleshooting

### ✅ Correct Usage
```typescript
// Use action constants directly
socket.emit(PrismActions.GET_SETUP_STATUS, message);

// Handle with same constant
@SubscribeMessage(PrismActions.GET_SETUP_STATUS)
handleMessage() { }

// Include required fields
const message = {
  id: uuidv4(),           // Always include
  type: 'request',        // request/response/event
  service: 'prism',       // Target service
  action: 'setup/get-status'  // Action constant
};
```

### ❌ Common Mistakes
```typescript
// Don't use raw strings
socket.emit('setup/get-status', message);  // ❌

// Don't mix up action constants
socket.emit(FactActions.CREATE, message);  // ❌ for setup status

// Don't forget required fields
const message = { action: 'setup/get-status' };  // ❌ missing id, type

// Don't hardcode service names
const message = { service: 'prism-service' };  // ❌ use 'prism'
```

### Debug Steps
1. **Check action constant**: Ensure using correct action from contracts
2. **Verify message structure**: Include all required base fields
3. **Check service name**: Must match exactly ('prism', not 'prism-service')
4. **Validate in development**: Use ValidationUtils for debugging
5. **Check WebSocket connection**: Ensure client is connected

## 📝 Adding New Contracts

### 1. Define Actions
```typescript
// packages/websocket-contracts/src/services/my-service.ts
export const MyServiceActions = {
  QUERY_DATA: 'data/query',
  UPDATE_CONFIG: 'config/update'
} as const;
```

### 2. Create Schemas
```typescript
import { z } from 'zod';
import { BaseRequestSchema } from '../base';

export const QueryDataRequestSchema = BaseRequestSchema.extend({
  service: z.literal('my-service'),
  action: z.literal(MyServiceActions.QUERY_DATA),
  payload: z.object({
    query: z.string(),
    filters: z.record(z.unknown()).optional()
  })
});

export type QueryDataRequest = z.infer<typeof QueryDataRequestSchema>;
```

### 3. Export from Index
```typescript
// packages/websocket-contracts/src/index.ts
export * from './services/my-service';
```

## 🔗 Related Documentation

- [WebSocket Contracts README](./README.md) - Complete guide
- [Service Architecture](../README.md) - Service overview
- [Development Guide](../../CLAUDE.md) - Full development guide