import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// KIND MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================
/**
 * Kind message data structure
 */
export const KindMessageSchema = z.object({
    uid: z.number().optional(),
    query: z.string().optional(),
    filters: z.any().optional(),
});
// =====================================================
// KIND GET CONTRACT
// =====================================================
export const KindGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('kind:get'),
    payload: KindMessageSchema,
});
export const KindGetResponseSchema = BaseResponseSchema.extend({
    data: z.any().nullable(),
});
// =====================================================
// KINDS LIST CONTRACT
// =====================================================
export const KindsListRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('kinds:list'),
    payload: KindMessageSchema,
});
export const KindsListResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// KINDS SEARCH CONTRACT
// =====================================================
export const KindsSearchRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('kinds:search'),
    payload: KindMessageSchema,
});
export const KindsSearchResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// KIND SERVICE ACTIONS
// =====================================================
export const KindActions = {
    GET: 'kind:get',
    LIST: 'kinds:list',
    SEARCH: 'kinds:search',
};
// =====================================================
// KIND EVENTS
// =====================================================
export const KindEvents = {
    RETRIEVED: 'kind:retrieved',
    LIST: 'kinds:list',
    SEARCH_RESULTS: 'kinds:search:results',
    ERROR: 'kind:error',
};
//# sourceMappingURL=kinds.js.map