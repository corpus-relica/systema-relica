import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../base';

// =====================================================
// PRISM SETUP STATUS CONTRACT - Our Seed Example
// =====================================================

/**
 * Setup status data structure
 */
export const SetupStatusSchema = z.object({
  status: z.string(),
  stage: z.string().nullable(),
  message: z.string(),
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
  timestamp: z.string(),
});

export type SetupStatus = z.infer<typeof SetupStatusSchema>;

/**
 * Get Setup Status Request
 */
export const GetSetupStatusRequestSchema = BaseRequestSchema.extend({
  service: z.literal('prism'),
  action: z.literal('get-setup-status'),
  payload: z.undefined().optional(), // No payload needed
});

export type GetSetupStatusRequest = z.infer<typeof GetSetupStatusRequestSchema>;

/**
 * Get Setup Status Response
 */
export const GetSetupStatusResponseSchema = BaseResponseSchema.extend({
  data: SetupStatusSchema.optional(),
});

export type GetSetupStatusResponse = z.infer<typeof GetSetupStatusResponseSchema>;

// =====================================================
// PRISM RESET SYSTEM CONTRACT
// =====================================================

/**
 * Reset System Request
 */
export const ResetSystemRequestSchema = BaseRequestSchema.extend({
  service: z.literal('prism'),
  action: z.literal('reset-system'),
  payload: z.undefined().optional(),
});

export type ResetSystemRequest = z.infer<typeof ResetSystemRequestSchema>;

/**
 * Reset System Response
 */
export const ResetSystemResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    message: z.string(),
    errors: z.array(z.string()).optional(),
    timestamp: z.string(),
  }).optional(),
});

export type ResetSystemResponse = z.infer<typeof ResetSystemResponseSchema>;

// =====================================================
// PRISM SERVICE ACTION REGISTRY
// =====================================================

/**
 * All supported Prism actions
 */
export const PrismActions = {
  GET_SETUP_STATUS: 'get-setup-status',
  START_SETUP: 'start-setup',
  CREATE_USER: 'create-user',
  IMPORT_DATA: 'import-data',
  RESET_SYSTEM: 'reset-system',
} as const;

export type PrismActionType = typeof PrismActions[keyof typeof PrismActions];

/**
 * Prism request message discriminated union
 */
export const PrismRequestSchema = z.discriminatedUnion('action', [
  GetSetupStatusRequestSchema,
  ResetSystemRequestSchema,
  // Add other Prism requests here as we implement them
]);

export type PrismRequest = z.infer<typeof PrismRequestSchema>;

/**
 * Prism response message discriminated union
 */
export const PrismResponseSchema = z.union([
  GetSetupStatusResponseSchema,
  ResetSystemResponseSchema,
  // Add other Prism responses here as we implement them
]);

export type PrismResponse = z.infer<typeof PrismResponseSchema>;