import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// CONCEPT MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Concept message data structure
 */
export const ConceptMessageSchema = z.object({
  uid: z.number(),
  operation: z.enum(['get', 'create', 'update', 'delete']).optional(),
  data: z.any().optional(),
});

export type ConceptMessage = z.infer<typeof ConceptMessageSchema>;

// =====================================================
// CONCEPT GET CONTRACT
// =====================================================

export const ConceptGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('concept:get'),
  payload: ConceptMessageSchema,
});

export type ConceptGetRequest = z.infer<typeof ConceptGetRequestSchema>;

export const ConceptGetResponseSchema = BaseResponseSchema.extend({
  data: z.any().nullable(),
});

export type ConceptGetResponse = z.infer<typeof ConceptGetResponseSchema>;

// =====================================================
// CONCEPT CREATE CONTRACT
// =====================================================

export const ConceptCreateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('concept:create'),
  payload: ConceptMessageSchema,
});

export type ConceptCreateRequest = z.infer<typeof ConceptCreateRequestSchema>;

export const ConceptCreateResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }).optional(),
});

export type ConceptCreateResponse = z.infer<typeof ConceptCreateResponseSchema>;

// =====================================================
// CONCEPT UPDATE CONTRACT
// =====================================================

export const ConceptUpdateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('concept:update'),
  payload: ConceptMessageSchema,
});

export type ConceptUpdateRequest = z.infer<typeof ConceptUpdateRequestSchema>;

export const ConceptUpdateResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }).optional(),
});

export type ConceptUpdateResponse = z.infer<typeof ConceptUpdateResponseSchema>;

// =====================================================
// CONCEPT DELETE CONTRACT
// =====================================================

export const ConceptDeleteRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('concept:delete'),
  payload: ConceptMessageSchema,
});

export type ConceptDeleteRequest = z.infer<typeof ConceptDeleteRequestSchema>;

export const ConceptDeleteResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    uid: z.number(),
    success: z.boolean(),
  }).optional(),
});

export type ConceptDeleteResponse = z.infer<typeof ConceptDeleteResponseSchema>;

// =====================================================
// CONCEPT SERVICE ACTIONS
// =====================================================

export const ConceptActions = {
  GET: 'concept:get',
  CREATE: 'concept:create',
  UPDATE: 'concept:update',
  DELETE: 'concept:delete',
} as const;

export type ConceptActionType = typeof ConceptActions[keyof typeof ConceptActions];

// =====================================================
// CONCEPT EVENTS
// =====================================================

export const ConceptEvents = {
  RETRIEVED: 'concept:retrieved',
  CREATED: 'concept:created',
  UPDATED: 'concept:updated',
  DELETED: 'concept:deleted',
  ERROR: 'concept:error',
} as const;

export type ConceptEventType = typeof ConceptEvents[keyof typeof ConceptEvents];