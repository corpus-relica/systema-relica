# @relica/websocket-contracts

Shared WebSocket API contracts and types for Relica services. This package provides type-safe message schemas, action-to-topic mapping, and runtime validation utilities to ensure alignment between WebSocket producers and consumers.

## 🎯 Purpose

This package solves the critical problem of **WebSocket API alignment** between services by:

- **Centralizing contracts** - Single source of truth for all WebSocket APIs
- **Type safety** - Compile-time checking of message structures  
- **Runtime validation** - Development-time contract validation
- **Topic mapping** - Consistent action → topic conversion across services

## 📋 Standards & Conventions

### Message Structure

All WebSocket messages follow a base structure:

```typescript
interface BaseMessage {
  id: string;              // UUID for message identification
  type: 'request' | 'response' | 'event';
  timestamp?: number;      // Optional timestamp
  correlationId?: string;  // Links related messages across services
}
```

### Topic Naming Convention

**Format**: `{domain}/{action}`

- **domain**: Logical grouping (setup, search, model, cache, etc.)
- **action**: Specific operation (get-status, create-user, reset-system, etc.)

**Examples**:
```
setup/get-status
setup/reset-system
search/query
model/create
cache/rebuild
```

**Why this pattern?**
- ✅ Clean and readable
- ✅ Consistent domain/action structure  
- ✅ No redundancy with service field
- ✅ Easy to namespace and organize
- ✅ Scales across all services

### Service Actions

Actions use kebab-case and should be descriptive verbs:
- `get-setup-status` (not `status`)
- `reset-system` (not `reset`)
- `create-user` (not `user`)

## 🚀 Quick Start

### Installation

```bash
yarn add @relica/websocket-contracts
```

### Basic Usage

```typescript
import { 
  PrismActions, 
  MessageRegistryUtils, 
  ContractUtils 
} from '@relica/websocket-contracts';

// Get WebSocket topic for Portal action
const topic = MessageRegistryUtils.getTopic(PrismActions.GET_SETUP_STATUS);
// Returns: 'setup/get-status'

// Validate message against contract
const validation = ContractUtils.validate.request('get-setup-status', message);
if (validation.success) {
  // Message is valid
} else {
  console.error('Validation failed:', validation.error);
}
```

## 📖 API Reference

### Core Exports

```typescript
// Actions
import { PrismActions } from '@relica/websocket-contracts';

// Registry utilities
import { MESSAGE_REGISTRY, MessageRegistryUtils } from '@relica/websocket-contracts';

// Validation
import { ContractUtils, validator, devValidator } from '@relica/websocket-contracts';

// Base types
import { BaseMessage, BaseRequest, BaseResponse } from '@relica/websocket-contracts';
```

### MessageRegistryUtils

```typescript
// Get WebSocket topic for action
MessageRegistryUtils.getTopic(action: string): string

// Get action from WebSocket topic (reverse lookup)
MessageRegistryUtils.getActionFromTopic(topic: string): string | undefined

// Validate request/response against contract
MessageRegistryUtils.validateRequest(action: string, message: unknown)
MessageRegistryUtils.validateResponse(action: string, message: unknown)

// Get all contracts for a service
MessageRegistryUtils.getServiceContracts(serviceName: string): MessageContract[]
```

### ContractUtils

```typescript
// Quick validation
ContractUtils.validate.request(action: string, message: unknown)
ContractUtils.validate.response(action: string, message: unknown)
ContractUtils.validate.baseMessage(message: unknown)

// Topic/action conversion
ContractUtils.convert.actionToTopic(action: string): string | null
ContractUtils.convert.topicToAction(topic: string): string | null

// Development mode (verbose logging)
ContractUtils.dev.validate.request(action: string, message: unknown)
ContractUtils.dev.convert.actionToTopic(action: string)
```

## 🔧 Adding New Service Contracts

### 1. Define Service Actions

```typescript
// src/services/my-service.ts
export const MyServiceActions = {
  QUERY_DATA: 'query-data',
  UPDATE_CONFIG: 'update-config',
  // ... more actions
} as const;
```

### 2. Create Message Schemas

```typescript
// Request schema
export const QueryDataRequestSchema = BaseRequestSchema.extend({
  service: z.literal('my-service'),
  action: z.literal(MyServiceActions.QUERY_DATA),
  payload: z.object({
    query: z.string(),
    filters: z.record(z.unknown()).optional(),
  }),
});

// Response schema  
export const QueryDataResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    results: z.array(z.unknown()),
    total: z.number(),
  }).optional(),
});
```

### 3. Add to Registry

```typescript
// src/registry.ts
export const MESSAGE_REGISTRY = {
  // ... existing contracts
  
  [MyServiceActions.QUERY_DATA]: {
    action: MyServiceActions.QUERY_DATA,
    topic: 'data/query',  // domain/action format
    service: 'my-service',
    requestSchema: QueryDataRequestSchema,
    responseSchema: QueryDataResponseSchema,
    description: 'Query data with optional filters',
  },
  
} as const;
```

### 4. Export from Index

```typescript
// src/index.ts
export * from './services/my-service';

export {
  MyServiceActions,
} from './services/my-service';
```

## 🧪 Development & Testing

### Development Mode Validation

Use `devValidator` for verbose logging during development:

```typescript
import { devValidator } from '@relica/websocket-contracts';

// Logs validation results to console
const result = devValidator.validateRequest('get-setup-status', message);
```

### Contract Testing

Test your implementations against contracts:

```typescript
describe('WebSocket Message Contracts', () => {
  it('should validate setup status request', () => {
    const message = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'request',
      service: 'prism',
      action: 'get-setup-status',
    };
    
    const result = ContractUtils.validate.request('get-setup-status', message);
    expect(result.success).toBe(true);
  });
});
```

## 🔄 Migration Guide

### From Legacy WebSocket Messages

1. **Identify current actions** - Map existing WebSocket handlers to new actions
2. **Update topic names** - Convert to `domain/action` format
3. **Add to registry** - Create contracts for existing messages
4. **Update services** - Use shared contracts in Portal/Prism/etc.
5. **Enable validation** - Add contract validation in development

### Portal Service Migration

```typescript
// Before
const message = {
  service: 'prism',
  action: 'get-setup-status',
  payload: {},
};

// After
import { PrismActions, MessageRegistryUtils } from '@relica/websocket-contracts';

const topic = MessageRegistryUtils.getTopic(PrismActions.GET_SETUP_STATUS);
// Use topic for WebSocket message routing
```

## ⚡ Performance Considerations

- **Schema validation** - Only enabled in development by default
- **Registry lookup** - O(1) action → topic mapping
- **Lazy loading** - Import only what you need
- **Tree shaking** - Individual exports for minimal bundle size

## 🤝 Contributing

### Adding New Domains

When adding a new logical domain (e.g., `auth`, `workflow`, `reporting`):

1. Create domain-specific actions: `auth/login`, `workflow/execute`, `reporting/generate`
2. Group related functionality under the same domain
3. Document domain purpose and scope
4. Follow existing patterns for consistency

### Best Practices

- **Action names**: Use descriptive verbs (`get-status`, `reset-system`)
- **Schemas**: Include all required fields, make optional fields explicit
- **Topics**: Follow `domain/action` convention strictly
- **Documentation**: Add clear descriptions to all contracts
- **Validation**: Test both success and failure cases

## 📚 Examples

See existing contracts for reference patterns:

- **Prism Setup**: `src/services/prism.ts` - Complete setup flow example
- **Message Registry**: `src/registry.ts` - Contract definitions
- **Validation**: `src/validation.ts` - Runtime validation patterns

## 🔗 Related Documentation

- [WebSocket API Documentation](../docs/websocket-api.md)
- [Service Integration Guide](../docs/service-integration.md)
- [Development Best Practices](../docs/development.md)

---

**Note**: This package is the foundation for all WebSocket communication in the Relica ecosystem. Changes here affect all services, so follow semantic versioning and coordinate updates across teams.