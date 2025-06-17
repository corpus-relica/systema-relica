"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConceptEvents = exports.ConceptActions = exports.ConceptDeleteResponseSchema = exports.ConceptDeleteRequestSchema = exports.ConceptUpdateResponseSchema = exports.ConceptUpdateRequestSchema = exports.ConceptCreateResponseSchema = exports.ConceptCreateRequestSchema = exports.ConceptGetResponseSchema = exports.ConceptGetRequestSchema = exports.ConceptMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// CONCEPT MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Concept message data structure
 */
exports.ConceptMessageSchema = zod_1.z.object({
    uid: zod_1.z.number(),
    operation: zod_1.z.enum(['get', 'create', 'update', 'delete']).optional(),
    data: zod_1.z.any().optional(),
});
// =====================================================
// CONCEPT GET CONTRACT
// =====================================================
exports.ConceptGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('concept:get'),
    payload: exports.ConceptMessageSchema,
});
exports.ConceptGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().nullable(),
});
// =====================================================
// CONCEPT CREATE CONTRACT
// =====================================================
exports.ConceptCreateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('concept:create'),
    payload: exports.ConceptMessageSchema,
});
exports.ConceptCreateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// CONCEPT UPDATE CONTRACT
// =====================================================
exports.ConceptUpdateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('concept:update'),
    payload: exports.ConceptMessageSchema,
});
exports.ConceptUpdateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// CONCEPT DELETE CONTRACT
// =====================================================
exports.ConceptDeleteRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('concept:delete'),
    payload: exports.ConceptMessageSchema,
});
exports.ConceptDeleteResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        uid: zod_1.z.number(),
        success: zod_1.z.boolean(),
    }).optional(),
});
// =====================================================
// CONCEPT SERVICE ACTIONS
// =====================================================
exports.ConceptActions = {
    GET: 'concept:get',
    CREATE: 'concept:create',
    UPDATE: 'concept:update',
    DELETE: 'concept:delete',
};
// =====================================================
// CONCEPT EVENTS
// =====================================================
exports.ConceptEvents = {
    RETRIEVED: 'concept:retrieved',
    CREATED: 'concept:created',
    UPDATED: 'concept:updated',
    DELETED: 'concept:deleted',
    ERROR: 'concept:error',
};
//# sourceMappingURL=concepts.js.map