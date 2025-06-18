"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionEvents = exports.SubmissionActions = exports.SubmissionBatchResponseSchema = exports.SubmissionBatchRequestSchema = exports.SubmissionSubmitResponseSchema = exports.SubmissionSubmitRequestSchema = exports.SubmissionMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
const facts_1 = require("./facts");
// =====================================================
// SUBMISSION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Submission message data structure
 */
exports.SubmissionMessageSchema = zod_1.z.object({
    facts: zod_1.z.array(facts_1.FactCreateMessageSchema),
    metadata: zod_1.z.any().optional(),
});
// =====================================================
// SUBMISSION SUBMIT CONTRACT
// =====================================================
exports.SubmissionSubmitRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('submission:submit'),
    payload: exports.SubmissionMessageSchema,
});
exports.SubmissionSubmitResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SUBMISSION BATCH CONTRACT
// =====================================================
exports.SubmissionBatchRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('submission:batch'),
    payload: exports.SubmissionMessageSchema,
});
exports.SubmissionBatchResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SUBMISSION SERVICE ACTIONS
// =====================================================
exports.SubmissionActions = {
    SUBMIT: 'submission:submit',
    BATCH: 'submission:batch',
};
// =====================================================
// SUBMISSION EVENTS
// =====================================================
exports.SubmissionEvents = {
    COMPLETED: 'submission:completed',
    BATCH_COMPLETED: 'submission:batch:completed',
    ERROR: 'submission:error',
};
//# sourceMappingURL=submission.js.map