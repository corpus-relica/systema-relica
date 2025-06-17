"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionEvents = exports.TransactionActions = exports.TransactionGetResponseSchema = exports.TransactionGetRequestSchema = exports.TransactionRollbackResponseSchema = exports.TransactionRollbackRequestSchema = exports.TransactionCommitResponseSchema = exports.TransactionCommitRequestSchema = exports.TransactionStartResponseSchema = exports.TransactionStartRequestSchema = exports.TransactionMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// TRANSACTION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Transaction message data structure
 */
exports.TransactionMessageSchema = zod_1.z.object({
    transaction_id: zod_1.z.string().optional(),
    operations: zod_1.z.array(zod_1.z.any()).optional(),
});
// =====================================================
// TRANSACTION START CONTRACT
// =====================================================
exports.TransactionStartRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('transaction:start'),
    payload: exports.TransactionMessageSchema,
});
exports.TransactionStartResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// TRANSACTION COMMIT CONTRACT
// =====================================================
exports.TransactionCommitRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('transaction:commit'),
    payload: exports.TransactionMessageSchema,
});
exports.TransactionCommitResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// TRANSACTION ROLLBACK CONTRACT
// =====================================================
exports.TransactionRollbackRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('transaction:rollback'),
    payload: exports.TransactionMessageSchema,
});
exports.TransactionRollbackResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// TRANSACTION GET CONTRACT
// =====================================================
exports.TransactionGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('transaction:get'),
    payload: exports.TransactionMessageSchema,
});
exports.TransactionGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// TRANSACTION SERVICE ACTIONS
// =====================================================
exports.TransactionActions = {
    START: 'transaction:start',
    COMMIT: 'transaction:commit',
    ROLLBACK: 'transaction:rollback',
    GET: 'transaction:get',
};
// =====================================================
// TRANSACTION EVENTS
// =====================================================
exports.TransactionEvents = {
    STARTED: 'transaction:started',
    COMMITTED: 'transaction:committed',
    ROLLED_BACK: 'transaction:rolledback',
    RETRIEVED: 'transaction:retrieved',
    ERROR: 'transaction:error',
};
//# sourceMappingURL=transaction.js.map