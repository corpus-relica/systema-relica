import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// DEFINITION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Definition message data structure
 */
export const DefinitionMessageSchema = z.object({
  uid: z.number(),
  definition: z.any().optional(),
});

export type DefinitionMessage = z.infer<typeof DefinitionMessageSchema>;

// =====================================================
// DEFINITION GET CONTRACT
// =====================================================

export const DefinitionGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('definition:get'),
  payload: DefinitionMessageSchema,
});

export type DefinitionGetRequest = z.infer<typeof DefinitionGetRequestSchema>;

export const DefinitionGetResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type DefinitionGetResponse = z.infer<typeof DefinitionGetResponseSchema>;

// =====================================================
// DEFINITION UPDATE CONTRACT
// =====================================================

export const DefinitionUpdateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('definition:update'),
  payload: DefinitionMessageSchema,
});

export type DefinitionUpdateRequest = z.infer<typeof DefinitionUpdateRequestSchema>;

export const DefinitionUpdateResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }).optional(),
});

export type DefinitionUpdateResponse = z.infer<typeof DefinitionUpdateResponseSchema>;

// =====================================================
// DEFINITION SERVICE ACTIONS
// =====================================================

export const DefinitionActions = {
  GET: 'definition:get',
  UPDATE: 'definition:update',
} as const;

export type DefinitionActionType = typeof DefinitionActions[keyof typeof DefinitionActions];

// =====================================================
// DEFINITION EVENTS
// =====================================================

export const DefinitionEvents = {
  RETRIEVED: 'definition:retrieved',
  UPDATED: 'definition:updated',
  ERROR: 'definition:error',
} as const;

export type DefinitionEventType = typeof DefinitionEvents[keyof typeof DefinitionEvents];