import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// SEARCH MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Search message data structure
 */
export const SearchMessageSchema = z.object({
    query: z.string(),
    page: z.number().optional(),
    limit: z.number().optional(),
    filters: z.any().optional(),
});
/**
 * UID search message data structure
 */
export const UidSearchMessageSchema = z.object({
    uid: z.number(),
});
// =====================================================
// SEARCH GENERAL CONTRACT
// =====================================================
export const SearchGeneralRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('search:general'),
    payload: SearchMessageSchema,
});
export const SearchGeneralResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SEARCH INDIVIDUAL CONTRACT
// =====================================================
export const SearchIndividualRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('search:individual'),
    payload: SearchMessageSchema,
});
export const SearchIndividualResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// SEARCH KIND CONTRACT
// =====================================================
export const SearchKindRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('search:kind'),
    payload: SearchMessageSchema,
});
export const SearchKindResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SEARCH EXECUTE CONTRACT
// =====================================================
export const SearchExecuteRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('search:execute'),
    payload: SearchMessageSchema,
});
export const SearchExecuteResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SEARCH UID CONTRACT
// =====================================================
export const SearchUidRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('search:uid'),
    payload: UidSearchMessageSchema,
});
export const SearchUidResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// SEARCH SERVICE ACTIONS
// =====================================================
export const SearchActions = {
    GENERAL: 'search:general',
    INDIVIDUAL: 'search:individual',
    KIND: 'search:kind',
    EXECUTE: 'search:execute',
    UID: 'search:uid',
};
// =====================================================
// SEARCH EVENTS
// =====================================================
export const SearchEvents = {
    GENERAL_RESULTS: 'search:general:results',
    INDIVIDUAL_RESULTS: 'search:individual:results',
    KIND_RESULTS: 'search:kind:results',
    EXECUTE_RESULTS: 'search:execute:results',
    UID_RESULTS: 'search:uid:results',
    ERROR: 'search:error',
};
//# sourceMappingURL=search.js.map