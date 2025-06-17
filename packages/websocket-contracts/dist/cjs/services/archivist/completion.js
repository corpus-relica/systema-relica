"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionEvents = exports.CompletionActions = exports.CompletionRelationsResponseSchema = exports.CompletionRelationsRequestSchema = exports.CompletionEntitiesResponseSchema = exports.CompletionEntitiesRequestSchema = exports.CompletionResponseSchema = exports.CompletionRequestSchema = exports.CompletionMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// COMPLETION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Completion message data structure
 */
exports.CompletionMessageSchema = zod_1.z.object({
    query: zod_1.z.string(),
    context: zod_1.z.any().optional(),
});
// =====================================================
// COMPLETION REQUEST CONTRACT
// =====================================================
exports.CompletionRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('completion:request'),
    payload: exports.CompletionMessageSchema,
});
exports.CompletionResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// COMPLETION ENTITIES CONTRACT
// =====================================================
exports.CompletionEntitiesRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('completion:entities'),
    payload: exports.CompletionMessageSchema,
});
exports.CompletionEntitiesResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// COMPLETION RELATIONS CONTRACT
// =====================================================
exports.CompletionRelationsRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('completion:relations'),
    payload: exports.CompletionMessageSchema,
});
exports.CompletionRelationsResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// COMPLETION SERVICE ACTIONS
// =====================================================
exports.CompletionActions = {
    REQUEST: 'completion:request',
    ENTITIES: 'completion:entities',
    RELATIONS: 'completion:relations',
};
// =====================================================
// COMPLETION EVENTS
// =====================================================
exports.CompletionEvents = {
    RESULTS: 'completion:results',
    ENTITIES_RESULTS: 'completion:entities:results',
    RELATIONS_RESULTS: 'completion:relations:results',
    ERROR: 'completion:error',
};
//# sourceMappingURL=completion.js.map