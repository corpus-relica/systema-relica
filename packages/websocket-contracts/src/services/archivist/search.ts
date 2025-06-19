import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// SEARCH MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Search message data structure
 */
export const SearchMessageSchema = z.object({
  searchTerm: z.string(),
  collectionUID: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  filter: z.any().optional(),
});

export type SearchMessage = z.infer<typeof SearchMessageSchema>;

/**
 * UID search message data structure
 */
export const UidSearchMessageSchema = z.object({
  uid: z.number(),
});

export type UidSearchMessage = z.infer<typeof UidSearchMessageSchema>;

// =====================================================
// SEARCH GENERAL CONTRACT
// =====================================================

export const SearchGeneralRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('search:general'),
  payload: SearchMessageSchema,
});

export type SearchGeneralRequest = z.infer<typeof SearchGeneralRequestSchema>;

export const SearchGeneralResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SearchGeneralResponse = z.infer<typeof SearchGeneralResponseSchema>;

// =====================================================
// SEARCH INDIVIDUAL CONTRACT
// =====================================================

export const SearchIndividualRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('search:individual'),
  payload: SearchMessageSchema,
});

export type SearchIndividualRequest = z.infer<typeof SearchIndividualRequestSchema>;

export const SearchIndividualResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type SearchIndividualResponse = z.infer<typeof SearchIndividualResponseSchema>;

// =====================================================
// SEARCH KIND CONTRACT
// =====================================================

export const SearchKindRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('search:kind'),
  payload: SearchMessageSchema,
});

export type SearchKindRequest = z.infer<typeof SearchKindRequestSchema>;

export const SearchKindResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SearchKindResponse = z.infer<typeof SearchKindResponseSchema>;

// =====================================================
// SEARCH EXECUTE CONTRACT
// =====================================================

export const SearchExecuteRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('search:execute'),
  payload: SearchMessageSchema,
});

export type SearchExecuteRequest = z.infer<typeof SearchExecuteRequestSchema>;

export const SearchExecuteResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SearchExecuteResponse = z.infer<typeof SearchExecuteResponseSchema>;

// =====================================================
// SEARCH UID CONTRACT
// =====================================================

export const SearchUidRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('search:uid'),
  payload: UidSearchMessageSchema,
});

export type SearchUidRequest = z.infer<typeof SearchUidRequestSchema>;

export const SearchUidResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type SearchUidResponse = z.infer<typeof SearchUidResponseSchema>;

// =====================================================
// SEARCH SERVICE ACTIONS
// =====================================================

export const SearchActions = {
  GENERAL: 'search:general',
  INDIVIDUAL: 'search:individual',
  KIND: 'search:kind',
  EXECUTE: 'search:execute',
  UID: 'search:uid',
} as const;

export type SearchActionType = typeof SearchActions[keyof typeof SearchActions];

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
} as const;

export type SearchEventType = typeof SearchEvents[keyof typeof SearchEvents];