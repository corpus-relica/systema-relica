import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// CONCEPT MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Concept message data structure
 */
export const ConceptMessageSchema = z.object({
    uid: z.number(),
    operation: z.enum(['get', 'create', 'update', 'delete']).optional(),
    data: z.any().optional(),
});
// =====================================================
// CONCEPT GET CONTRACT
// =====================================================
export const ConceptGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('concept:get'),
    payload: ConceptMessageSchema,
});
export const ConceptGetResponseSchema = BaseResponseSchema.extend({
    data: z.any().nullable(),
});
// =====================================================
// CONCEPT CREATE CONTRACT
// =====================================================
export const ConceptCreateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('concept:create'),
    payload: ConceptMessageSchema,
});
export const ConceptCreateResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        success: z.boolean(),
        message: z.string(),
    }).optional(),
});
// =====================================================
// CONCEPT UPDATE CONTRACT
// =====================================================
export const ConceptUpdateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('concept:update'),
    payload: ConceptMessageSchema,
});
export const ConceptUpdateResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        success: z.boolean(),
        message: z.string(),
    }).optional(),
});
// =====================================================
// CONCEPT DELETE CONTRACT
// =====================================================
export const ConceptDeleteRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('concept:delete'),
    payload: ConceptMessageSchema,
});
export const ConceptDeleteResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        uid: z.number(),
        success: z.boolean(),
    }).optional(),
});
// =====================================================
// CONCEPT SERVICE ACTIONS
// =====================================================
export const ConceptActions = {
    GET: 'concept:get',
    CREATE: 'concept:create',
    UPDATE: 'concept:update',
    DELETE: 'concept:delete',
};
// =====================================================
// CONCEPT EVENTS
// =====================================================
export const ConceptEvents = {
    RETRIEVED: 'concept:retrieved',
    CREATED: 'concept:created',
    UPDATED: 'concept:updated',
    DELETED: 'concept:deleted',
    ERROR: 'concept:error',
};
//# sourceMappingURL=concepts.js.map