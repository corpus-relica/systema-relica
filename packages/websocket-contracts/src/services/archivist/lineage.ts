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

export type LineageQueryMessage = z.infer<typeof LineageQueryMessageSchema>;

// =====================================================
// LINEAGE GET CONTRACT
// =====================================================

export const LineageGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('lineage:get'),
  payload: LineageQueryMessageSchema,
});

export type LineageGetRequest = z.infer<typeof LineageGetRequestSchema>;

export const LineageGetResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    data: z.array(z.number()), // Array of entity UIDs in lineage order
  }),
});

export type LineageGetResponse = z.infer<typeof LineageGetResponseSchema>;

// =====================================================
// LINEAGE SERVICE ACTIONS
// =====================================================

export const LineageActions = {
  GET: 'lineage:get',
} as const;

export type LineageActionType = typeof LineageActions[keyof typeof LineageActions];

// =====================================================
// LINEAGE EVENTS
// =====================================================

export const LineageEvents = {
  RETRIEVED: 'lineage:retrieved',
  ERROR: 'lineage:error',
} as const;

export type LineageEventType = typeof LineageEvents[keyof typeof LineageEvents];