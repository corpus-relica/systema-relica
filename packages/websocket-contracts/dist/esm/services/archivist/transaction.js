import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// TRANSACTION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Transaction message data structure
 */
export const TransactionMessageSchema = z.object({
    transaction_id: z.string().optional(),
    operations: z.array(z.any()).optional(),
});
// =====================================================
// TRANSACTION START CONTRACT
// =====================================================
export const TransactionStartRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('transaction:start'),
    payload: TransactionMessageSchema,
});
export const TransactionStartResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// TRANSACTION COMMIT CONTRACT
// =====================================================
export const TransactionCommitRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('transaction:commit'),
    payload: TransactionMessageSchema,
});
export const TransactionCommitResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// TRANSACTION ROLLBACK CONTRACT
// =====================================================
export const TransactionRollbackRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('transaction:rollback'),
    payload: TransactionMessageSchema,
});
export const TransactionRollbackResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// TRANSACTION GET CONTRACT
// =====================================================
export const TransactionGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('transaction:get'),
    payload: TransactionMessageSchema,
});
export const TransactionGetResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// TRANSACTION SERVICE ACTIONS
// =====================================================
export const TransactionActions = {
    START: 'transaction:start',
    COMMIT: 'transaction:commit',
    ROLLBACK: 'transaction:rollback',
    GET: 'transaction:get',
};
// =====================================================
// TRANSACTION EVENTS
// =====================================================
export const TransactionEvents = {
    STARTED: 'transaction:started',
    COMMITTED: 'transaction:committed',
    ROLLED_BACK: 'transaction:rolledback',
    RETRIEVED: 'transaction:retrieved',
    ERROR: 'transaction:error',
};
//# sourceMappingURL=transaction.js.map