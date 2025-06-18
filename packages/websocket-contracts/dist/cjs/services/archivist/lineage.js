"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineageEvents = exports.LineageActions = exports.LineageGetResponseSchema = exports.LineageGetRequestSchema = exports.LineageQueryMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// LINEAGE MESSAGE TYPES
// =====================================================
/**
 * Lineage query data structure
 */
exports.LineageQueryMessageSchema = zod_1.z.object({
    uid: zod_1.z.number(),
});
// =====================================================
// LINEAGE GET CONTRACT
// =====================================================
exports.LineageGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('lineage:get'),
    payload: exports.LineageQueryMessageSchema,
});
exports.LineageGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.object({
        data: zod_1.z.array(zod_1.z.number()), // Array of entity UIDs in lineage order
    }),
});
// =====================================================
// LINEAGE SERVICE ACTIONS
// =====================================================
exports.LineageActions = {
    GET: 'lineage:get',
};
// =====================================================
// LINEAGE EVENTS
// =====================================================
exports.LineageEvents = {
    RETRIEVED: 'lineage:retrieved',
    ERROR: 'lineage:error',
};
//# sourceMappingURL=lineage.js.map