import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// ENTITY MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Resolved entity data structure
 */
export const ResolvedEntitySchema = z.object({
  uid: z.number(),
  name: z.string(),
  descendants: z.array(z.number()).optional(),
  definition: z.string().optional(),
  category: z.string().optional(),
}).catchall(z.any()); // Allow additional properties

export type ResolvedEntity = z.infer<typeof ResolvedEntitySchema>;

/**
 * Entity batch resolve message data structure
 */
export const EntityBatchResolveMessageSchema = z.object({
  uids: z.array(z.number()),
});

export type EntityBatchResolveMessage = z.infer<typeof EntityBatchResolveMessageSchema>;

/**
 * Entity category message data structure
 */
export const EntityCategoryMessageSchema = z.object({
  uid: z.number(),
});

export type EntityCategoryMessage = z.infer<typeof EntityCategoryMessageSchema>;

/**
 * Entity type message data structure
 */
export const EntityTypeMessageSchema = z.object({
  uid: z.number(),
});

export type EntityTypeMessage = z.infer<typeof EntityTypeMessageSchema>;

// =====================================================
// ENTITY BATCH RESOLVE CONTRACT
// =====================================================

export const EntityBatchResolveRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('entity:batch-resolve'),
  payload: EntityBatchResolveMessageSchema,
});

export type EntityBatchResolveRequest = z.infer<typeof EntityBatchResolveRequestSchema>;

export const EntityBatchResolveResponseSchema = BaseResponseSchema.extend({
  data: z.array(ResolvedEntitySchema),
});

export type EntityBatchResolveResponse = z.infer<typeof EntityBatchResolveResponseSchema>;

// =====================================================
// ENTITY CATEGORY GET CONTRACT
// =====================================================

export const EntityCategoryGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('entity:category-get'),
  payload: EntityCategoryMessageSchema,
});

export type EntityCategoryGetRequest = z.infer<typeof EntityCategoryGetRequestSchema>;

export const EntityCategoryGetResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    category: z.string(),
  }),
});

export type EntityCategoryGetResponse = z.infer<typeof EntityCategoryGetResponseSchema>;

// =====================================================
// ENTITY TYPE GET CONTRACT
// =====================================================

export const EntityTypeGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('entity:type-get'),
  payload: EntityTypeMessageSchema,
});

export type EntityTypeGetRequest = z.infer<typeof EntityTypeGetRequestSchema>;

export const EntityTypeGetResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    type: z.string(),
  }),
});

export type EntityTypeGetResponse = z.infer<typeof EntityTypeGetResponseSchema>;

// =====================================================
// ACTION CONSTANTS
// =====================================================

export const EntityActions = {
  BATCH_RESOLVE: 'entity:batch-resolve',
  CATEGORY_GET: 'entity:category-get',
  TYPE_GET: 'entity:type-get',
} as const;

export type EntityActionType = typeof EntityActions[keyof typeof EntityActions];

// =====================================================
// EVENT CONSTANTS (for potential real-time updates)
// =====================================================

export const EntityEvents = {
  ENTITY_UPDATED: 'entity:updated',
  ENTITY_CREATED: 'entity:created',
  ENTITY_DELETED: 'entity:deleted',
} as const;

export type EntityEventType = typeof EntityEvents[keyof typeof EntityEvents];