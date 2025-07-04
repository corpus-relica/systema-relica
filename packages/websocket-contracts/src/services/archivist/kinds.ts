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

export type KindMessage = z.infer<typeof KindMessageSchema>;

// =====================================================
// KIND GET CONTRACT
// =====================================================

export const KindGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('kind:get'),
  payload: KindMessageSchema,
});

export type KindGetRequest = z.infer<typeof KindGetRequestSchema>;

export const KindGetResponseSchema = BaseResponseSchema.extend({
  data: z.any().nullable(),
});

export type KindGetResponse = z.infer<typeof KindGetResponseSchema>;

// =====================================================
// KINDS LIST CONTRACT
// =====================================================

export const KindsListRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('kinds:list'),
  payload: KindMessageSchema,
});

export type KindsListRequest = z.infer<typeof KindsListRequestSchema>;

export const KindsListResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type KindsListResponse = z.infer<typeof KindsListResponseSchema>;

// =====================================================
// KINDS SEARCH CONTRACT
// =====================================================

export const KindsSearchRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('kinds:search'),
  payload: KindMessageSchema,
});

export type KindsSearchRequest = z.infer<typeof KindsSearchRequestSchema>;

export const KindsSearchResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type KindsSearchResponse = z.infer<typeof KindsSearchResponseSchema>;

// =====================================================
// KIND SERVICE ACTIONS
// =====================================================

export const KindActions = {
  GET: 'kind:get',
  LIST: 'kinds:list',
  SEARCH: 'kinds:search',
} as const;

export type KindActionType = typeof KindActions[keyof typeof KindActions];

// =====================================================
// KIND EVENTS
// =====================================================

export const KindEvents = {
  RETRIEVED: 'kind:retrieved',
  LIST: 'kinds:list',
  SEARCH_RESULTS: 'kinds:search:results',
  ERROR: 'kind:error',
} as const;

export type KindEventType = typeof KindEvents[keyof typeof KindEvents];