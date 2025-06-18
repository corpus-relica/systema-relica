import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// COMPLETION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Completion message data structure
 */
export const CompletionMessageSchema = z.object({
  query: z.string(),
  context: z.any().optional(),
});

export type CompletionMessage = z.infer<typeof CompletionMessageSchema>;

// =====================================================
// COMPLETION REQUEST CONTRACT
// =====================================================

export const CompletionRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('completion:request'),
  payload: CompletionMessageSchema,
});

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

export const CompletionResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

// =====================================================
// COMPLETION ENTITIES CONTRACT
// =====================================================

export const CompletionEntitiesRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('completion:entities'),
  payload: CompletionMessageSchema,
});

export type CompletionEntitiesRequest = z.infer<typeof CompletionEntitiesRequestSchema>;

export const CompletionEntitiesResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type CompletionEntitiesResponse = z.infer<typeof CompletionEntitiesResponseSchema>;

// =====================================================
// COMPLETION RELATIONS CONTRACT
// =====================================================

export const CompletionRelationsRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('completion:relations'),
  payload: CompletionMessageSchema,
});

export type CompletionRelationsRequest = z.infer<typeof CompletionRelationsRequestSchema>;

export const CompletionRelationsResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type CompletionRelationsResponse = z.infer<typeof CompletionRelationsResponseSchema>;

// =====================================================
// COMPLETION SERVICE ACTIONS
// =====================================================

export const CompletionActions = {
  REQUEST: 'completion:request',
  ENTITIES: 'completion:entities',
  RELATIONS: 'completion:relations',
} as const;

export type CompletionActionType = typeof CompletionActions[keyof typeof CompletionActions];

// =====================================================
// COMPLETION EVENTS
// =====================================================

export const CompletionEvents = {
  RESULTS: 'completion:results',
  ENTITIES_RESULTS: 'completion:entities:results',
  RELATIONS_RESULTS: 'completion:relations:results',
  ERROR: 'completion:error',
} as const;

export type CompletionEventType = typeof CompletionEvents[keyof typeof CompletionEvents];