"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIDEvents = exports.UIDActions = exports.UIDReserveResponseSchema = exports.UIDReserveRequestSchema = exports.UIDBatchResponseSchema = exports.UIDBatchRequestSchema = exports.UIDGenerateResponseSchema = exports.UIDGenerateRequestSchema = exports.UIDMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// UID MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * UID message data structure
 */
exports.UIDMessageSchema = zod_1.z.object({
    count: zod_1.z.number().optional(),
    type: zod_1.z.string().optional(),
});
// =====================================================
// UID GENERATE CONTRACT
// =====================================================
exports.UIDGenerateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('uid:generate'),
    payload: exports.UIDMessageSchema,
});
exports.UIDGenerateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// UID BATCH CONTRACT
// =====================================================
exports.UIDBatchRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('uid:batch'),
    payload: exports.UIDMessageSchema,
});
exports.UIDBatchResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// UID RESERVE CONTRACT
// =====================================================
exports.UIDReserveRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('uid:reserve'),
    payload: exports.UIDMessageSchema,
});
exports.UIDReserveResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// UID SERVICE ACTIONS
// =====================================================
exports.UIDActions = {
    GENERATE: 'uid:generate',
    BATCH: 'uid:batch',
    RESERVE: 'uid:reserve',
};
// =====================================================
// UID EVENTS
// =====================================================
exports.UIDEvents = {
    GENERATED: 'uid:generated',
    BATCH_GENERATED: 'uid:batch:generated',
    RANGE_RESERVED: 'uid:range:reserved',
    ERROR: 'uid:error',
};
//# sourceMappingURL=uids.js.map