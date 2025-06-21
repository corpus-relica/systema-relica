# @relica/websocket-contracts

Shared WebSocket API contracts and types for Relica services. This package provides type-safe message schemas and optional validation utilities to ensure alignment between WebSocket producers and consumers.

## 🎯 Purpose

This package solves the critical problem of **WebSocket API alignment** between services by:

- **Centralizing contracts** - Single source of truth for all WebSocket APIs
- **Type safety** - Compile-time checking of message structures with TypeScript
- **Optional validation** - Simple validation utilities for development debugging  
- **Direct action usage** - Actions are used directly as WebSocket topics (no mapping layer)

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

### Topic/Action Convention

**Format**: `{domain}/{action}` - Actions ARE the WebSocket topics

- **domain**: Logical grouping (setup, search, model, cache, etc.)
- **action**: Specific operation (get-status, create-user, reset-system, etc.)

**Examples**:
```typescript
PrismActions.GET_SETUP_STATUS  // 'setup/get-status'
PrismActions.RESET_SYSTEM      // 'setup/reset-system'
PrismActions.CREATE_USER       // 'setup/create-user'
```

**Why this simplified approach?**
- ✅ Actions are directly used as WebSocket topics (no mapping layer)
- ✅ Clean and readable
- ✅ Consistent domain/action structure  
- ✅ Easy to namespace and organize
- ✅ Reduces complexity and potential mapping errors

### Service Actions

Actions use kebab-case and should be descriptive:
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
  ValidationUtils,
  createDebugValidator 
} from '@relica/websocket-contracts';

// Use action directly as WebSocket topic
const topic = PrismActions.GET_SETUP_STATUS; // 'setup/get-status'

// Optional validation for debugging
const validation = ValidationUtils.validateBaseMessage(message);
if (validation.success) {
  // Message is valid
} else {
  console.error('Validation failed:', validation.error);
}

// Or use debug validator for specific schemas
const debugValidator = createDebugValidator(true);
const result = debugValidator.validateMessage(SomeSchema, message, 'setup/get-status');
```

## 📖 API Reference

### Core Exports

```typescript
// Service actions (constants)
import { PrismActions, PrismEvents, FactActions, ApertureActions } from '@relica/websocket-contracts';

// Message schemas and types
import { 
  SetupStatusSchema, 
  GetSetupStatusRequestSchema,
  type SetupStatus,
  type GetSetupStatusRequest 
} from '@relica/websocket-contracts';

// Simplified validation utilities
import { 
  ValidationUtils,
  createDebugValidator,
  type ValidationResult
} from '@relica/websocket-contracts';

// Base message types
import { 
  BaseMessage, 
  BaseRequest, 
  BaseResponse, 
  BaseEvent 
} from '@relica/websocket-contracts';
```

### ValidationUtils

```typescript
// Validate message against base message schema
ValidationUtils.validateBaseMessage(message: unknown): ValidationResult

// Validate message against a specific Zod schema
ValidationUtils.validateWithSchema<T>(schema: z.ZodSchema<T>, message: unknown): ValidationResult<T>
```

### Debug Validator

```typescript
// Create a debug validator with optional console logging
const debugValidator = createDebugValidator(enabled: boolean);

// Validate message with optional action name for logging
debugValidator.validateMessage(schema: z.ZodSchema, message: unknown, actionName?: string): ValidationResult
```

## 🔧 Adding New Service Contracts

### 1. Define Service Actions

```typescript
// src/services/my-service.ts
export const MyServiceActions = {
  QUERY_DATA: 'data/query',           // Actions ARE the topics
  UPDATE_CONFIG: 'config/update',
  GET_STATUS: 'status/get',
} as const;
```

### 2. Create Message Schemas

```typescript
import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../base';

// Request schema
export const QueryDataRequestSchema = BaseRequestSchema.extend({
  service: z.literal('my-service'),
  action: z.literal(MyServiceActions.QUERY_DATA),
  payload: z.object({
    query: z.string(),
    filters: z.record(z.unknown()).optional(),
  }),
});

export type QueryDataRequest = z.infer<typeof QueryDataRequestSchema>;

// Response schema  
export const QueryDataResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    results: z.array(z.unknown()),
    total: z.number(),
  }).optional(),
});

export type QueryDataResponse = z.infer<typeof QueryDataResponseSchema>;
```

### 3. Export from Service File

```typescript
// src/services/my-service.ts (continued)
export {
  MyServiceActions,
  QueryDataRequestSchema,
  QueryDataResponseSchema,
  type QueryDataRequest,
  type QueryDataResponse,
};
```

### 4. Add to Main Index

```typescript
// src/index.ts
export * from './services/my-service';
```

**That's it!** No registry needed - actions are used directly as WebSocket topics.

## 🧪 Development & Testing

### Development Mode Validation

Use `devValidator` for verbose logging during development:

```typescript
import { devValidator, ContractUtils } from '@relica/websocket-contracts';

// Development validator with console logging
const result = devValidator.validateRequest('setup/get-status', message);

// Or use the development utilities
const result2 = ContractUtils.dev.validate.request('setup/get-status', message);
```

### Contract Testing

Test your implementations against contracts:

```typescript
import { ContractUtils, PrismActions } from '@relica/websocket-contracts';

describe('WebSocket Message Contracts', () => {
  it('should validate setup status request', () => {
    const message = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'request' as const,
      service: 'prism',
      action: PrismActions.GET_SETUP_STATUS, // 'setup/get-status'
    };
    
    const result = ContractUtils.validate.request(PrismActions.GET_SETUP_STATUS, message);
    expect(result.success).toBe(true);
  });

  it('should validate setup status response', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'response' as const,
      success: true,
      data: {
        status: 'in-progress',
        stage: 'database-setup',
        message: 'Setting up database connections...',
        progress: 45,
        timestamp: new Date().toISOString(),
      },
    };
    
    const result = ContractUtils.validate.response(PrismActions.GET_SETUP_STATUS, response);
    expect(result.success).toBe(true);
  });
});
```

## 🔄 Migration Guide

### From Legacy WebSocket Messages

1. **Identify current actions** - Map existing WebSocket handlers to new action constants
2. **Use actions as topics** - Actions are now directly used as WebSocket topics
3. **Add to registry** - Create contracts for validation (development only)
4. **Update services** - Use shared action constants in Portal/Prism/etc.
5. **Enable validation** - Add contract validation in development mode

### Service Integration Example

```typescript
// Portal service (client side)
import { PrismActions } from '@relica/websocket-contracts';

// Use action directly as WebSocket topic
const message = {
  id: uuidv4(),
  type: 'request' as const,
  service: 'prism',
  action: PrismActions.GET_SETUP_STATUS, // 'setup/get-status'
};

// Send via WebSocket using action as topic
this.socketClient.emit(PrismActions.GET_SETUP_STATUS, message);
```

```typescript
// Prism service (handler side)
import { PrismActions } from '@relica/websocket-contracts';

@SubscribeMessage(PrismActions.GET_SETUP_STATUS) // 'setup/get-status'
async handleGetSetupStatus(client: Socket, data: any) {
  // Validate in development
  if (process.env.NODE_ENV === 'development') {
    const validation = ContractUtils.dev.validate.request(PrismActions.GET_SETUP_STATUS, data);
    if (!validation.success) {
      console.error('Invalid request:', validation.error);
    }
  }
  
  // Handle the request...
}
```

## ⚡ Performance Considerations

- **Schema validation** - Only enabled in development mode by default
- **Registry lookup** - O(1) contract lookup by action string
- **Lazy loading** - Import only what you need from service contracts
- **Tree shaking** - Individual exports for minimal bundle size
- **No runtime mapping** - Actions are used directly as topics (zero overhead)

## 🤝 Contributing

### Adding New Domains

When adding a new logical domain (e.g., `auth`, `workflow`, `reporting`):

1. Create domain-specific actions: `auth/login`, `workflow/execute`, `reporting/generate`
2. Group related functionality under the same domain
3. Document domain purpose and scope
4. Follow existing patterns for consistency

### Best Practices

- **Action names**: Use descriptive `domain/action` format (`setup/get-status`, `data/query`)
- **Schemas**: Include all required fields, make optional fields explicit with Zod
- **Validation**: Enable in development, disable in production for performance
- **Types**: Export both schemas and TypeScript types for each message
- **Documentation**: Add clear descriptions to all registry contracts
- **Testing**: Test both success and failure validation cases

## 📚 Examples

See existing contracts for reference patterns:

- **Prism Service**: `src/services/prism.ts` - Complete service contract example
- **Message Registry**: `src/registry.ts` - Contract definitions and validation schemas
- **Base Types**: `src/base.ts` - Foundation message types with Zod schemas
- **Validation Utilities**: `src/validation.ts` - Runtime validation patterns

## 🔗 Related Documentation

- [Systema Relica Development Guide](../../CLAUDE.md) - Overall architecture and patterns
- [Service Integration Patterns](../../docs/service-integration.md) - How services use contracts
- [WebSocket Communication Guide](../../docs/websocket-patterns.md) - Real-time communication patterns

---

**Note**: This package is the foundation for all WebSocket communication in the Relica ecosystem. Changes here affect all services, so follow semantic versioning and coordinate updates across teams. The simplified action-as-topic approach reduces complexity while maintaining type safety.