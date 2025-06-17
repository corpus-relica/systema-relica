"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationEvents = exports.ValidationActions = exports.ValidationCollectionResponseSchema = exports.ValidationCollectionRequestSchema = exports.ValidationValidateResponseSchema = exports.ValidationValidateRequestSchema = exports.ValidationCollectionMessageSchema = exports.ValidationMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
const facts_1 = require("./facts");
// =====================================================
// VALIDATION MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Validation message data structure
 */
exports.ValidationMessageSchema = zod_1.z.object({
    fact: facts_1.FactCreateMessageSchema,
    context: zod_1.z.any().optional(),
});
/**
 * Collection validation message data structure
 */
exports.ValidationCollectionMessageSchema = zod_1.z.object({
    facts: zod_1.z.array(facts_1.FactCreateMessageSchema),
});
// =====================================================
// VALIDATION VALIDATE CONTRACT
// =====================================================
exports.ValidationValidateRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('validation:validate'),
    payload: exports.ValidationMessageSchema,
});
exports.ValidationValidateResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// VALIDATION COLLECTION CONTRACT
// =====================================================
exports.ValidationCollectionRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('validation:collection'),
    payload: exports.ValidationCollectionMessageSchema,
});
exports.ValidationCollectionResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// VALIDATION SERVICE ACTIONS
// =====================================================
exports.ValidationActions = {
    VALIDATE: 'validation:validate',
    COLLECTION: 'validation:collection',
};
// =====================================================
// VALIDATION EVENTS
// =====================================================
exports.ValidationEvents = {
    RESULT: 'validation:result',
    COLLECTION_RESULT: 'validation:collection:result',
    ERROR: 'validation:error',
};
//# sourceMappingURL=validation.js.map