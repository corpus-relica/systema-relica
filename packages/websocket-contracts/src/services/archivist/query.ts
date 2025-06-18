import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// QUERY MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Query message data structure
 */
export const QueryMessageSchema = z.object({
  query: z.string(),
  parameters: z.any().optional(),
});

export type QueryMessage = z.infer<typeof QueryMessageSchema>;

// =====================================================
// QUERY EXECUTE CONTRACT
// =====================================================

export const QueryExecuteRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('query:execute'),
  payload: QueryMessageSchema,
});

export type QueryExecuteRequest = z.infer<typeof QueryExecuteRequestSchema>;

export const QueryExecuteResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type QueryExecuteResponse = z.infer<typeof QueryExecuteResponseSchema>;

// =====================================================
// QUERY VALIDATE CONTRACT
// =====================================================

export const QueryValidateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('query:validate'),
  payload: QueryMessageSchema,
});

export type QueryValidateRequest = z.infer<typeof QueryValidateRequestSchema>;

export const QueryValidateResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    valid: z.boolean(),
    message: z.string(),
  }).optional(),
});

export type QueryValidateResponse = z.infer<typeof QueryValidateResponseSchema>;

// =====================================================
// QUERY PARSE CONTRACT
// =====================================================

export const QueryParseRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('query:parse'),
  payload: QueryMessageSchema,
});

export type QueryParseRequest = z.infer<typeof QueryParseRequestSchema>;

export const QueryParseResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    parsed: z.any().nullable(),
    message: z.string(),
  }).optional(),
});

export type QueryParseResponse = z.infer<typeof QueryParseResponseSchema>;

// =====================================================
// QUERY SERVICE ACTIONS
// =====================================================

export const QueryActions = {
  EXECUTE: 'query:execute',
  VALIDATE: 'query:validate',
  PARSE: 'query:parse',
} as const;

export type QueryActionType = typeof QueryActions[keyof typeof QueryActions];

// =====================================================
// QUERY EVENTS
// =====================================================

export const QueryEvents = {
  RESULTS: 'query:results',
  VALIDATED: 'query:validated',
  PARSED: 'query:parsed',
  ERROR: 'query:error',
} as const;

export type QueryEventType = typeof QueryEvents[keyof typeof QueryEvents];