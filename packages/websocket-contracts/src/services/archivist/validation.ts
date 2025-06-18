import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
import { FactCreateMessageSchema } from './facts';

// =====================================================
// VALIDATION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Validation message data structure
 */
export const ValidationMessageSchema = z.object({
  fact: FactCreateMessageSchema,
  context: z.any().optional(),
});

export type ValidationMessage = z.infer<typeof ValidationMessageSchema>;

/**
 * Collection validation message data structure
 */
export const ValidationCollectionMessageSchema = z.object({
  facts: z.array(FactCreateMessageSchema),
});

export type ValidationCollectionMessage = z.infer<typeof ValidationCollectionMessageSchema>;

// =====================================================
// VALIDATION VALIDATE CONTRACT
// =====================================================

export const ValidationValidateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('validation:validate'),
  payload: ValidationMessageSchema,
});

export type ValidationValidateRequest = z.infer<typeof ValidationValidateRequestSchema>;

export const ValidationValidateResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type ValidationValidateResponse = z.infer<typeof ValidationValidateResponseSchema>;

// =====================================================
// VALIDATION COLLECTION CONTRACT
// =====================================================

export const ValidationCollectionRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('validation:collection'),
  payload: ValidationCollectionMessageSchema,
});

export type ValidationCollectionRequest = z.infer<typeof ValidationCollectionRequestSchema>;

export const ValidationCollectionResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type ValidationCollectionResponse = z.infer<typeof ValidationCollectionResponseSchema>;

// =====================================================
// VALIDATION SERVICE ACTIONS
// =====================================================

export const ValidationActions = {
  VALIDATE: 'validation:validate',
  COLLECTION: 'validation:collection',
} as const;

export type ValidationActionType = typeof ValidationActions[keyof typeof ValidationActions];

// =====================================================
// VALIDATION EVENTS
// =====================================================

export const ValidationEvents = {
  RESULT: 'validation:result',
  COLLECTION_RESULT: 'validation:collection:result',
  ERROR: 'validation:error',
} as const;

export type ValidationEventType = typeof ValidationEvents[keyof typeof ValidationEvents];