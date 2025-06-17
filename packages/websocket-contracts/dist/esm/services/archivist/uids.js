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
// =====================================================
// UID GENERATE CONTRACT
// =====================================================
export const UIDGenerateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('uid:generate'),
    payload: UIDMessageSchema,
});
export const UIDGenerateResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// UID BATCH CONTRACT
// =====================================================
export const UIDBatchRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('uid:batch'),
    payload: UIDMessageSchema,
});
export const UIDBatchResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// UID RESERVE CONTRACT
// =====================================================
export const UIDReserveRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('uid:reserve'),
    payload: UIDMessageSchema,
});
export const UIDReserveResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// UID SERVICE ACTIONS
// =====================================================
export const UIDActions = {
    GENERATE: 'uid:generate',
    BATCH: 'uid:batch',
    RESERVE: 'uid:reserve',
};
// =====================================================
// UID EVENTS
// =====================================================
export const UIDEvents = {
    GENERATED: 'uid:generated',
    BATCH_GENERATED: 'uid:batch:generated',
    RANGE_RESERVED: 'uid:range:reserved',
    ERROR: 'uid:error',
};
//# sourceMappingURL=uids.js.map