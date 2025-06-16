import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// UID MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * UID message data structure
 */
export const UIDMessageSchema = z.object({
  count: z.number().optional(),
  type: z.string().optional(),
});

export type UIDMessage = z.infer<typeof UIDMessageSchema>;

// =====================================================
// UID GENERATE CONTRACT
// =====================================================

export const UIDGenerateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('uid:generate'),
  payload: UIDMessageSchema,
});

export type UIDGenerateRequest = z.infer<typeof UIDGenerateRequestSchema>;

export const UIDGenerateResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type UIDGenerateResponse = z.infer<typeof UIDGenerateResponseSchema>;

// =====================================================
// UID BATCH CONTRACT
// =====================================================

export const UIDBatchRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('uid:batch'),
  payload: UIDMessageSchema,
});

export type UIDBatchRequest = z.infer<typeof UIDBatchRequestSchema>;

export const UIDBatchResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type UIDBatchResponse = z.infer<typeof UIDBatchResponseSchema>;

// =====================================================
// UID RESERVE CONTRACT
// =====================================================

export const UIDReserveRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('uid:reserve'),
  payload: UIDMessageSchema,
});

export type UIDReserveRequest = z.infer<typeof UIDReserveRequestSchema>;

export const UIDReserveResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type UIDReserveResponse = z.infer<typeof UIDReserveResponseSchema>;

// =====================================================
// UID SERVICE ACTIONS
// =====================================================

export const UIDActions = {
  GENERATE: 'uid:generate',
  BATCH: 'uid:batch',
  RESERVE: 'uid:reserve',
} as const;

export type UIDActionType = typeof UIDActions[keyof typeof UIDActions];

// =====================================================
// UID EVENTS
// =====================================================

export const UIDEvents = {
  GENERATED: 'uid:generated',
  BATCH_GENERATED: 'uid:batch:generated',
  RANGE_RESERVED: 'uid:range:reserved',
  ERROR: 'uid:error',
} as const;

export type UIDEventType = typeof UIDEvents[keyof typeof UIDEvents];