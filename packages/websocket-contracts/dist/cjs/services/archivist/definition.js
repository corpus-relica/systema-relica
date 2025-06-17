"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionEvents = exports.DefinitionActions = exports.DefinitionUpdateResponseSchema = exports.DefinitionUpdateRequestSchema = exports.DefinitionGetResponseSchema = exports.DefinitionGetRequestSchema = exports.DefinitionMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// DEFINITION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Definition message data structure
 */
exports.DefinitionMessageSchema = zod_1.z.object({
    uid: zod_1.z.number(),
    definition: zod_1.z.any().optional(),
});
// =====================================================
// DEFINITION GET CONTRACT
// =====================================================
exports.DefinitionGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('definition:get'),
    payload: exports.DefinitionMessageSchema,
});
exports.DefinitionGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// DEFINITION UPDATE CONTRACT
// =====================================================
exports.DefinitionUpdateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('definition:update'),
    payload: exports.DefinitionMessageSchema,
});
exports.DefinitionUpdateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// DEFINITION SERVICE ACTIONS
// =====================================================
exports.DefinitionActions = {
    GET: 'definition:get',
    UPDATE: 'definition:update',
};
// =====================================================
// DEFINITION EVENTS
// =====================================================
exports.DefinitionEvents = {
    RETRIEVED: 'definition:retrieved',
    UPDATED: 'definition:updated',
    ERROR: 'definition:error',
};
//# sourceMappingURL=definition.js.map