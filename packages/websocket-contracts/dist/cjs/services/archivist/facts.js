"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactEvents = exports.FactActions = exports.FactValidateResponseSchema = exports.FactValidateRequestSchema = exports.FactGetClassifiedResponseSchema = exports.FactGetClassifiedRequestSchema = exports.FactGetSupertypesResponseSchema = exports.FactGetSupertypesRequestSchema = exports.FactGetSubtypesResponseSchema = exports.FactGetSubtypesRequestSchema = exports.FactGetResponseSchema = exports.FactGetRequestSchema = exports.FactDeleteResponseSchema = exports.FactDeleteRequestSchema = exports.FactUpdateResponseSchema = exports.FactUpdateRequestSchema = exports.FactCreateResponseSchema = exports.FactCreateRequestSchema = exports.FactQueryMessageSchema = exports.FactDeleteMessageSchema = exports.FactUpdateMessageSchema = exports.FactCreateMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// FACT MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Fact creation data structure
 */
exports.FactCreateMessageSchema = zod_1.z.object({
    lh_object_uid: zod_1.z.number(),
    rh_object_uid: zod_1.z.number(),
    rel_type_uid: zod_1.z.number(),
}).catchall(zod_1.z.any()); // Allow additional properties
/**
 * Fact update data structure
 */
exports.FactUpdateMessageSchema = zod_1.z.object({
    fact_uid: zod_1.z.number(),
    updates: exports.FactCreateMessageSchema.partial(),
});
/**
 * Fact delete data structure
 */
exports.FactDeleteMessageSchema = zod_1.z.object({
    fact_uid: zod_1.z.number(),
});
/**
 * Fact query data structure
 */
exports.FactQueryMessageSchema = zod_1.z.object({
    uid: zod_1.z.number(),
    includeSubtypes: zod_1.z.boolean().optional(),
    maxDepth: zod_1.z.number().optional(),
});
// =====================================================
// FACT CREATE CONTRACT
// =====================================================
exports.FactCreateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:create'),
    payload: exports.FactCreateMessageSchema,
});
exports.FactCreateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(), // Flexible response from fact service
});
// =====================================================
// FACT UPDATE CONTRACT
// =====================================================
exports.FactUpdateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:update'),
    payload: exports.FactUpdateMessageSchema,
});
exports.FactUpdateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// FACT DELETE CONTRACT
// =====================================================
exports.FactDeleteRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:delete'),
    payload: exports.FactDeleteMessageSchema,
});
exports.FactDeleteResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        fact_uid: zod_1.z.number(),
        success: zod_1.z.boolean(),
    }).optional(),
});
// =====================================================
// FACT GET CONTRACT
// =====================================================
exports.FactGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:get'),
    payload: exports.FactQueryMessageSchema,
});
exports.FactGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// FACT GET SUBTYPES CONTRACT
// =====================================================
exports.FactGetSubtypesRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:getSubtypes'),
    payload: exports.FactQueryMessageSchema,
});
exports.FactGetSubtypesResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// FACT GET SUPERTYPES CONTRACT
// =====================================================
exports.FactGetSupertypesRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:getSupertypes'),
    payload: exports.FactQueryMessageSchema,
});
exports.FactGetSupertypesResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// FACT GET CLASSIFIED CONTRACT
// =====================================================
exports.FactGetClassifiedRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:getClassified'),
    payload: exports.FactQueryMessageSchema,
});
exports.FactGetClassifiedResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// FACT VALIDATE CONTRACT
// =====================================================
exports.FactValidateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('fact:validate'),
    payload: exports.FactCreateMessageSchema,
});
exports.FactValidateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        valid: zod_1.z.boolean(),
        message: zod_1.z.string(),
    }).optional(),
});
// =====================================================
// FACT SERVICE ACTIONS
// =====================================================
exports.FactActions = {
    CREATE: 'fact:create',
    UPDATE: 'fact:update',
    DELETE: 'fact:delete',
    GET: 'fact:get',
    GET_SUBTYPES: 'fact:getSubtypes',
    GET_SUPERTYPES: 'fact:getSupertypes',
    GET_CLASSIFIED: 'fact:getClassified',
    VALIDATE: 'fact:validate',
};
// =====================================================
// FACT EVENTS
// =====================================================
exports.FactEvents = {
    CREATED: 'fact:created',
    UPDATED: 'fact:updated',
    DELETED: 'fact:deleted',
    RETRIEVED: 'fact:retrieved',
    SUBTYPES: 'fact:subtypes',
    SUPERTYPES: 'fact:supertypes',
    CLASSIFIED: 'fact:classified',
    VALIDATED: 'fact:validated',
    ERROR: 'fact:error',
};
//# sourceMappingURL=facts.js.map