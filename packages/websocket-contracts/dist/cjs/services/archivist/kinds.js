"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KindEvents = exports.KindActions = exports.KindsSearchResponseSchema = exports.KindsSearchRequestSchema = exports.KindsListResponseSchema = exports.KindsListRequestSchema = exports.KindGetResponseSchema = exports.KindGetRequestSchema = exports.KindMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// KIND MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Kind message data structure
 */
exports.KindMessageSchema = zod_1.z.object({
    uid: zod_1.z.number().optional(),
    query: zod_1.z.string().optional(),
    filters: zod_1.z.any().optional(),
});
// =====================================================
// KIND GET CONTRACT
// =====================================================
exports.KindGetRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('kind:get'),
    payload: exports.KindMessageSchema,
});
exports.KindGetResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().nullable(),
});
// =====================================================
// KINDS LIST CONTRACT
// =====================================================
exports.KindsListRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('kinds:list'),
    payload: exports.KindMessageSchema,
});
exports.KindsListResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// KINDS SEARCH CONTRACT
// =====================================================
exports.KindsSearchRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('kinds:search'),
    payload: exports.KindMessageSchema,
});
exports.KindsSearchResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// KIND SERVICE ACTIONS
// =====================================================
exports.KindActions = {
    GET: 'kind:get',
    LIST: 'kinds:list',
    SEARCH: 'kinds:search',
};
// =====================================================
// KIND EVENTS
// =====================================================
exports.KindEvents = {
    RETRIEVED: 'kind:retrieved',
    LIST: 'kinds:list',
    SEARCH_RESULTS: 'kinds:search:results',
    ERROR: 'kind:error',
};
//# sourceMappingURL=kinds.js.map