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
// =====================================================
// SUBMISSION SUBMIT CONTRACT
// =====================================================
export const SubmissionSubmitRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('submission:submit'),
    payload: SubmissionMessageSchema,
});
export const SubmissionSubmitResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SUBMISSION BATCH CONTRACT
// =====================================================
export const SubmissionBatchRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('submission:batch'),
    payload: SubmissionMessageSchema,
});
export const SubmissionBatchResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SUBMISSION SERVICE ACTIONS
// =====================================================
export const SubmissionActions = {
    SUBMIT: 'submission:submit',
    BATCH: 'submission:batch',
};
// =====================================================
// SUBMISSION EVENTS
// =====================================================
export const SubmissionEvents = {
    COMPLETED: 'submission:completed',
    BATCH_COMPLETED: 'submission:batch:completed',
    ERROR: 'submission:error',
};
//# sourceMappingURL=submission.js.map