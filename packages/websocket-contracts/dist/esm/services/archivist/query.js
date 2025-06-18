import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// QUERY MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Query message data structure
 */
export const QueryMessageSchema = z.object({
    query: z.string(),
    parameters: z.any().optional(),
});
// =====================================================
// QUERY EXECUTE CONTRACT
// =====================================================
export const QueryExecuteRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('query:execute'),
    payload: QueryMessageSchema,
});
export const QueryExecuteResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// QUERY VALIDATE CONTRACT
// =====================================================
export const QueryValidateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('query:validate'),
    payload: QueryMessageSchema,
});
export const QueryValidateResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        valid: z.boolean(),
        message: z.string(),
    }).optional(),
});
// =====================================================
// QUERY PARSE CONTRACT
// =====================================================
export const QueryParseRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('query:parse'),
    payload: QueryMessageSchema,
});
export const QueryParseResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        parsed: z.any().nullable(),
        message: z.string(),
    }).optional(),
});
// =====================================================
// QUERY SERVICE ACTIONS
// =====================================================
export const QueryActions = {
    EXECUTE: 'query:execute',
    VALIDATE: 'query:validate',
    PARSE: 'query:parse',
};
// =====================================================
// QUERY EVENTS
// =====================================================
export const QueryEvents = {
    RESULTS: 'query:results',
    VALIDATED: 'query:validated',
    PARSED: 'query:parsed',
    ERROR: 'query:error',
};
//# sourceMappingURL=query.js.map