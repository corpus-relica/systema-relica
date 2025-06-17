import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// COMPLETION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Completion message data structure
 */
export const CompletionMessageSchema = z.object({
    query: z.string(),
    context: z.any().optional(),
});
// =====================================================
// COMPLETION REQUEST CONTRACT
// =====================================================
export const CompletionRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('completion:request'),
    payload: CompletionMessageSchema,
});
export const CompletionResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// COMPLETION ENTITIES CONTRACT
// =====================================================
export const CompletionEntitiesRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('completion:entities'),
    payload: CompletionMessageSchema,
});
export const CompletionEntitiesResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// COMPLETION RELATIONS CONTRACT
// =====================================================
export const CompletionRelationsRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('completion:relations'),
    payload: CompletionMessageSchema,
});
export const CompletionRelationsResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// COMPLETION SERVICE ACTIONS
// =====================================================
export const CompletionActions = {
    REQUEST: 'completion:request',
    ENTITIES: 'completion:entities',
    RELATIONS: 'completion:relations',
};
// =====================================================
// COMPLETION EVENTS
// =====================================================
export const CompletionEvents = {
    RESULTS: 'completion:results',
    ENTITIES_RESULTS: 'completion:entities:results',
    RELATIONS_RESULTS: 'completion:relations:results',
    ERROR: 'completion:error',
};
//# sourceMappingURL=completion.js.map