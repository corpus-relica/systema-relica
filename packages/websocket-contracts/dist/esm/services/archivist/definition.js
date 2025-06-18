import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// DEFINITION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Definition message data structure
 */
export const DefinitionMessageSchema = z.object({
    uid: z.number(),
    definition: z.any().optional(),
});
// =====================================================
// DEFINITION GET CONTRACT
// =====================================================
export const DefinitionGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('definition:get'),
    payload: DefinitionMessageSchema,
});
export const DefinitionGetResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// DEFINITION UPDATE CONTRACT
// =====================================================
export const DefinitionUpdateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('definition:update'),
    payload: DefinitionMessageSchema,
});
export const DefinitionUpdateResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        success: z.boolean(),
        message: z.string(),
    }).optional(),
});
// =====================================================
// DEFINITION SERVICE ACTIONS
// =====================================================
export const DefinitionActions = {
    GET: 'definition:get',
    UPDATE: 'definition:update',
};
// =====================================================
// DEFINITION EVENTS
// =====================================================
export const DefinitionEvents = {
    RETRIEVED: 'definition:retrieved',
    UPDATED: 'definition:updated',
    ERROR: 'definition:error',
};
//# sourceMappingURL=definition.js.map