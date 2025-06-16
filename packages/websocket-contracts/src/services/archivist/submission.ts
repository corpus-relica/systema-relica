import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
import { FactCreateMessageSchema } from './facts';

// =====================================================
// SUBMISSION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Submission message data structure
 */
export const SubmissionMessageSchema = z.object({
  facts: z.array(FactCreateMessageSchema),
  metadata: z.any().optional(),
});

export type SubmissionMessage = z.infer<typeof SubmissionMessageSchema>;

// =====================================================
// SUBMISSION SUBMIT CONTRACT
// =====================================================

export const SubmissionSubmitRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('submission:submit'),
  payload: SubmissionMessageSchema,
});

export type SubmissionSubmitRequest = z.infer<typeof SubmissionSubmitRequestSchema>;

export const SubmissionSubmitResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SubmissionSubmitResponse = z.infer<typeof SubmissionSubmitResponseSchema>;

// =====================================================
// SUBMISSION BATCH CONTRACT
// =====================================================

export const SubmissionBatchRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('submission:batch'),
  payload: SubmissionMessageSchema,
});

export type SubmissionBatchRequest = z.infer<typeof SubmissionBatchRequestSchema>;

export const SubmissionBatchResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SubmissionBatchResponse = z.infer<typeof SubmissionBatchResponseSchema>;

// =====================================================
// SUBMISSION SERVICE ACTIONS
// =====================================================

export const SubmissionActions = {
  SUBMIT: 'submission:submit',
  BATCH: 'submission:batch',
} as const;

export type SubmissionActionType = typeof SubmissionActions[keyof typeof SubmissionActions];

// =====================================================
// SUBMISSION EVENTS
// =====================================================

export const SubmissionEvents = {
  COMPLETED: 'submission:completed',
  BATCH_COMPLETED: 'submission:batch:completed',
  ERROR: 'submission:error',
} as const;

export type SubmissionEventType = typeof SubmissionEvents[keyof typeof SubmissionEvents];