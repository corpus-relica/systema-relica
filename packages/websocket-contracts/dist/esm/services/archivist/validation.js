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
/**
 * Collection validation message data structure
 */
export const ValidationCollectionMessageSchema = z.object({
    facts: z.array(FactCreateMessageSchema),
});
// =====================================================
// VALIDATION VALIDATE CONTRACT
// =====================================================
export const ValidationValidateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('validation:validate'),
    payload: ValidationMessageSchema,
});
export const ValidationValidateResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// VALIDATION COLLECTION CONTRACT
// =====================================================
export const ValidationCollectionRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('validation:collection'),
    payload: ValidationCollectionMessageSchema,
});
export const ValidationCollectionResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// VALIDATION SERVICE ACTIONS
// =====================================================
export const ValidationActions = {
    VALIDATE: 'validation:validate',
    COLLECTION: 'validation:collection',
};
// =====================================================
// VALIDATION EVENTS
// =====================================================
export const ValidationEvents = {
    RESULT: 'validation:result',
    COLLECTION_RESULT: 'validation:collection:result',
    ERROR: 'validation:error',
};
//# sourceMappingURL=validation.js.map