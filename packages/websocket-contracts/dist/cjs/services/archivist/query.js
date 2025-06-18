"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryEvents = exports.QueryActions = exports.QueryParseResponseSchema = exports.QueryParseRequestSchema = exports.QueryValidateResponseSchema = exports.QueryValidateRequestSchema = exports.QueryExecuteResponseSchema = exports.QueryExecuteRequestSchema = exports.QueryMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// QUERY MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Query message data structure
 */
exports.QueryMessageSchema = zod_1.z.object({
    query: zod_1.z.string(),
    parameters: zod_1.z.any().optional(),
});
// =====================================================
// QUERY EXECUTE CONTRACT
// =====================================================
exports.QueryExecuteRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('query:execute'),
    payload: exports.QueryMessageSchema,
});
exports.QueryExecuteResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// QUERY VALIDATE CONTRACT
// =====================================================
exports.QueryValidateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('query:validate'),
    payload: exports.QueryMessageSchema,
});
exports.QueryValidateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        valid: zod_1.z.boolean(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// QUERY PARSE CONTRACT
// =====================================================
exports.QueryParseRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('query:parse'),
    payload: exports.QueryMessageSchema,
});
exports.QueryParseResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        parsed: zod_1.z.any().nullable(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// QUERY SERVICE ACTIONS
// =====================================================
exports.QueryActions = {
    EXECUTE: 'query:execute',
    VALIDATE: 'query:validate',
    PARSE: 'query:parse',
};
// =====================================================
// QUERY EVENTS
// =====================================================
exports.QueryEvents = {
    RESULTS: 'query:results',
    VALIDATED: 'query:validated',
    PARSED: 'query:parsed',
    ERROR: 'query:error',
};
//# sourceMappingURL=query.js.map