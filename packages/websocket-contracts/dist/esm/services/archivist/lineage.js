import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';
// =====================================================
// LINEAGE MESSAGE TYPES
// =====================================================
/**
 * Lineage query data structure
 */
export const LineageQueryMessageSchema = z.object({
    uid: z.number(),
});
// =====================================================
// LINEAGE GET CONTRACT
// =====================================================
export const LineageGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('lineage:get'),
    payload: LineageQueryMessageSchema,
});
export const LineageGetResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        data: z.array(z.number()), // Array of entity UIDs in lineage order
    }),
});
// =====================================================
// LINEAGE SERVICE ACTIONS
// =====================================================
export const LineageActions = {
    GET: 'lineage:get',
};
// =====================================================
// LINEAGE EVENTS
// =====================================================
export const LineageEvents = {
    RETRIEVED: 'lineage:retrieved',
    ERROR: 'lineage:error',
};
//# sourceMappingURL=lineage.js.map