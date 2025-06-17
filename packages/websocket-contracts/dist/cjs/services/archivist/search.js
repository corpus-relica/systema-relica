"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEvents = exports.SearchActions = exports.SearchUidResponseSchema = exports.SearchUidRequestSchema = exports.SearchExecuteResponseSchema = exports.SearchExecuteRequestSchema = exports.SearchKindResponseSchema = exports.SearchKindRequestSchema = exports.SearchIndividualResponseSchema = exports.SearchIndividualRequestSchema = exports.SearchGeneralResponseSchema = exports.SearchGeneralRequestSchema = exports.UidSearchMessageSchema = exports.SearchMessageSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("../../base");
// =====================================================
// SEARCH MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Search message data structure
 */
exports.SearchMessageSchema = zod_1.z.object({
    query: zod_1.z.string(),
    page: zod_1.z.number().optional(),
    limit: zod_1.z.number().optional(),
    filters: zod_1.z.any().optional(),
});
/**
 * UID search message data structure
 */
exports.UidSearchMessageSchema = zod_1.z.object({
    uid: zod_1.z.number(),
});
// =====================================================
// SEARCH GENERAL CONTRACT
// =====================================================
exports.SearchGeneralRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('search:general'),
    payload: exports.SearchMessageSchema,
});
exports.SearchGeneralResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SEARCH INDIVIDUAL CONTRACT
// =====================================================
exports.SearchIndividualRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('search:individual'),
    payload: exports.SearchMessageSchema,
});
exports.SearchIndividualResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.array(zod_1.z.any()),
});
// =====================================================
// SEARCH KIND CONTRACT
// =====================================================
exports.SearchKindRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('search:kind'),
    payload: exports.SearchMessageSchema,
});
exports.SearchKindResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SEARCH EXECUTE CONTRACT
// =====================================================
exports.SearchExecuteRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('search:execute'),
    payload: exports.SearchMessageSchema,
});
exports.SearchExecuteResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SEARCH UID CONTRACT
// =====================================================
exports.SearchUidRequestSchema = base_1.BaseRequestSchema.extend({
    service: zod_1.z.literal('archivist'),
    action: zod_1.z.literal('search:uid'),
    payload: exports.UidSearchMessageSchema,
});
exports.SearchUidResponseSchema = base_1.BaseResponseSchema.extend({
    data: zod_1.z.any().optional(),
});
// =====================================================
// SEARCH SERVICE ACTIONS
// =====================================================
exports.SearchActions = {
    GENERAL: 'search:general',
    INDIVIDUAL: 'search:individual',
    KIND: 'search:kind',
    EXECUTE: 'search:execute',
    UID: 'search:uid',
};
// =====================================================
// SEARCH EVENTS
// =====================================================
exports.SearchEvents = {
    GENERAL_RESULTS: 'search:general:results',
    INDIVIDUAL_RESULTS: 'search:individual:results',
    KIND_RESULTS: 'search:kind:results',
    EXECUTE_RESULTS: 'search:execute:results',
    UID_RESULTS: 'search:uid:results',
    ERROR: 'search:error',
};
//# sourceMappingURL=search.js.map