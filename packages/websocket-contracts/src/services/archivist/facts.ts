import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema } from '../../base';

// =====================================================
// FACT MESSAGE TYPES (from archivist websocket.types.ts)
// =====================================================

/**
 * Fact creation data structure
 */
export const FactCreateMessageSchema = z.object({
  lh_object_uid: z.number(),
  rh_object_uid: z.number(),
  rel_type_uid: z.number(),
}).catchall(z.any()); // Allow additional properties

export type FactCreateMessage = z.infer<typeof FactCreateMessageSchema>;

/**
 * Fact update data structure
 */
export const FactUpdateMessageSchema = z.object({
  fact_uid: z.number(),
  updates: FactCreateMessageSchema.partial(),
});

export type FactUpdateMessage = z.infer<typeof FactUpdateMessageSchema>;

/**
 * Fact delete data structure
 */
export const FactDeleteMessageSchema = z.object({
  fact_uid: z.number(),
});

export type FactDeleteMessage = z.infer<typeof FactDeleteMessageSchema>;

/**
 * Fact query data structure
 */
export const FactQueryMessageSchema = z.object({
  uid: z.number(),
  includeSubtypes: z.boolean().optional(),
  maxDepth: z.number().optional(),
});

export type FactQueryMessage = z.infer<typeof FactQueryMessageSchema>;

// =====================================================
// FACT CREATE CONTRACT
// =====================================================

export const FactCreateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:create'),
  payload: FactCreateMessageSchema,
});

export type FactCreateRequest = z.infer<typeof FactCreateRequestSchema>;

export const FactCreateResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(), // Flexible response from fact service
});

export type FactCreateResponse = z.infer<typeof FactCreateResponseSchema>;

// =====================================================
// FACT UPDATE CONTRACT
// =====================================================

export const FactUpdateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:update'),
  payload: FactUpdateMessageSchema,
});

export type FactUpdateRequest = z.infer<typeof FactUpdateRequestSchema>;

export const FactUpdateResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type FactUpdateResponse = z.infer<typeof FactUpdateResponseSchema>;

// =====================================================
// FACT DELETE CONTRACT
// =====================================================

export const FactDeleteRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:delete'),
  payload: FactDeleteMessageSchema,
});

export type FactDeleteRequest = z.infer<typeof FactDeleteRequestSchema>;

export const FactDeleteResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    fact_uid: z.number(),
    success: z.boolean(),
  }).optional(),
});

export type FactDeleteResponse = z.infer<typeof FactDeleteResponseSchema>;

// =====================================================
// FACT GET CONTRACT
// =====================================================

export const FactGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:get'),
  payload: FactQueryMessageSchema,
});

export type FactGetRequest = z.infer<typeof FactGetRequestSchema>;

export const FactGetResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type FactGetResponse = z.infer<typeof FactGetResponseSchema>;

// =====================================================
// FACT GET SUBTYPES CONTRACT
// =====================================================

export const FactGetSubtypesRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:getSubtypes'),
  payload: FactQueryMessageSchema,
});

export type FactGetSubtypesRequest = z.infer<typeof FactGetSubtypesRequestSchema>;

export const FactGetSubtypesResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type FactGetSubtypesResponse = z.infer<typeof FactGetSubtypesResponseSchema>;

// =====================================================
// FACT GET SUPERTYPES CONTRACT
// =====================================================

export const FactGetSupertypesRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:getSupertypes'),
  payload: FactQueryMessageSchema,
});

export type FactGetSupertypesRequest = z.infer<typeof FactGetSupertypesRequestSchema>;

export const FactGetSupertypesResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
});

export type FactGetSupertypesResponse = z.infer<typeof FactGetSupertypesResponseSchema>;

// =====================================================
// FACT GET CLASSIFIED CONTRACT
// =====================================================

export const FactGetClassifiedRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:getClassified'),
  payload: FactQueryMessageSchema,
});

export type FactGetClassifiedRequest = z.infer<typeof FactGetClassifiedRequestSchema>;

export const FactGetClassifiedResponseSchema = BaseResponseSchema.extend({
  data: z.any().optional(),
});

export type FactGetClassifiedResponse = z.infer<typeof FactGetClassifiedResponseSchema>;

// =====================================================
// FACT VALIDATE CONTRACT
// =====================================================

export const FactValidateRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:validate'),
  payload: FactCreateMessageSchema,
});

export type FactValidateRequest = z.infer<typeof FactValidateRequestSchema>;

export const FactValidateResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    valid: z.boolean(),
    message: z.string(),
  }).optional(),
});

export type FactValidateResponse = z.infer<typeof FactValidateResponseSchema>;

// =====================================================
// FACT BATCH GET CONTRACT (for cache building)
// =====================================================

/**
 * Fact batch get data structure
 */
export const FactBatchGetMessageSchema = z.object({
  skip: z.number(),
  range: z.number(),
  relTypeUids: z.array(z.number()).optional(),
});

export type FactBatchGetMessage = z.infer<typeof FactBatchGetMessageSchema>;

export const FactBatchGetRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:batch-get'),
  payload: FactBatchGetMessageSchema,
});

export type FactBatchGetRequest = z.infer<typeof FactBatchGetRequestSchema>;

export const FactBatchGetResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()), // Array of fact objects
});

export type FactBatchGetResponse = z.infer<typeof FactBatchGetResponseSchema>;

// =====================================================
// FACT COUNT CONTRACT (for cache building)
// =====================================================

export const FactCountRequestSchema = BaseRequestSchema.extend({
  service: z.literal('archivist'),
  action: z.literal('fact:count'),
  payload: z.object({}), // Empty payload
});

export type FactCountRequest = z.infer<typeof FactCountRequestSchema>;

export const FactCountResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    count: z.number(),
  }),
});

export type FactCountResponse = z.infer<typeof FactCountResponseSchema>;

// =====================================================
// FACT SERVICE ACTIONS
// =====================================================

export const FactActions = {
  CREATE: 'fact:create',
  UPDATE: 'fact:update',
  DELETE: 'fact:delete',
  GET: 'fact:get',
  GET_SUBTYPES: 'fact:getSubtypes',
  GET_SUPERTYPES: 'fact:getSupertypes',
  GET_CLASSIFIED: 'fact:getClassified',
  VALIDATE: 'fact:validate',
  BATCH_GET: 'fact:batch-get',
  COUNT: 'fact:count',
} as const;

export type FactActionType = typeof FactActions[keyof typeof FactActions];

// =====================================================
// FACT EVENTS
// =====================================================

export const FactEvents = {
  CREATED: 'fact:created',
  UPDATED: 'fact:updated',
  DELETED: 'fact:deleted',
  RETRIEVED: 'fact:retrieved',
  SUBTYPES: 'fact:subtypes',
  SUPERTYPES: 'fact:supertypes',
  CLASSIFIED: 'fact:classified',
  VALIDATED: 'fact:validated',
  BATCH_RETRIEVED: 'fact:batch-retrieved',
  COUNT_RETRIEVED: 'fact:count-retrieved',
  ERROR: 'fact:error',
} as const;

export type FactEventType = typeof FactEvents[keyof typeof FactEvents];