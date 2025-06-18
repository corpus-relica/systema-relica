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

export type TransactionMessage = z.infer<typeof TransactionMessageSchema>;

// =====================================================
// TRANSACTION START CONTRACT
// =====================================================

export const TransactionStartRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('transaction:start'),
  payload: TransactionMessageSchema,
});

export type TransactionStartRequest = z.infer<typeof TransactionStartRequestSchema>;

export const TransactionStartResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type TransactionStartResponse = z.infer<typeof TransactionStartResponseSchema>;

// =====================================================
// TRANSACTION COMMIT CONTRACT
// =====================================================

export const TransactionCommitRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('transaction:commit'),
  payload: TransactionMessageSchema,
});

export type TransactionCommitRequest = z.infer<typeof TransactionCommitRequestSchema>;

export const TransactionCommitResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type TransactionCommitResponse = z.infer<typeof TransactionCommitResponseSchema>;

// =====================================================
// TRANSACTION ROLLBACK CONTRACT
// =====================================================

export const TransactionRollbackRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('transaction:rollback'),
  payload: TransactionMessageSchema,
});

export type TransactionRollbackRequest = z.infer<typeof TransactionRollbackRequestSchema>;

export const TransactionRollbackResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type TransactionRollbackResponse = z.infer<typeof TransactionRollbackResponseSchema>;

// =====================================================
// TRANSACTION GET CONTRACT
// =====================================================

export const TransactionGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('transaction:get'),
  payload: TransactionMessageSchema,
});

export type TransactionGetRequest = z.infer<typeof TransactionGetRequestSchema>;

export const TransactionGetResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type TransactionGetResponse = z.infer<typeof TransactionGetResponseSchema>;

// =====================================================
// TRANSACTION SERVICE ACTIONS
// =====================================================

export const TransactionActions = {
  START: 'transaction:start',
  COMMIT: 'transaction:commit',
  ROLLBACK: 'transaction:rollback',
  GET: 'transaction:get',
} as const;

export type TransactionActionType = typeof TransactionActions[keyof typeof TransactionActions];

// =====================================================
// TRANSACTION EVENTS
// =====================================================

export const TransactionEvents = {
  STARTED: 'transaction:started',
  COMMITTED: 'transaction:committed',
  ROLLED_BACK: 'transaction:rolledback',
  RETRIEVED: 'transaction:retrieved',
  ERROR: 'transaction:error',
} as const;

export type TransactionEventType = typeof TransactionEvents[keyof typeof TransactionEvents];