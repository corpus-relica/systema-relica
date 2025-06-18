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
/**
 * Fact update data structure
 */
export const FactUpdateMessageSchema = z.object({
    fact_uid: z.number(),
    updates: FactCreateMessageSchema.partial(),
});
/**
 * Fact delete data structure
 */
export const FactDeleteMessageSchema = z.object({
    fact_uid: z.number(),
});
/**
 * Fact query data structure
 */
export const FactQueryMessageSchema = z.object({
    uid: z.number(),
    includeSubtypes: z.boolean().optional(),
    maxDepth: z.number().optional(),
});
// =====================================================
// FACT CREATE CONTRACT
// =====================================================
export const FactCreateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:create'),
    payload: FactCreateMessageSchema,
});
export const FactCreateResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(), // Flexible response from fact service
});
// =====================================================
// FACT UPDATE CONTRACT
// =====================================================
export const FactUpdateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:update'),
    payload: FactUpdateMessageSchema,
});
export const FactUpdateResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// FACT DELETE CONTRACT
// =====================================================
export const FactDeleteRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:delete'),
    payload: FactDeleteMessageSchema,
});
export const FactDeleteResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        fact_uid: z.number(),
        success: z.boolean(),
    }).optional(),
});
// =====================================================
// FACT GET CONTRACT
// =====================================================
export const FactGetRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:get'),
    payload: FactQueryMessageSchema,
});
export const FactGetResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// FACT GET SUBTYPES CONTRACT
// =====================================================
export const FactGetSubtypesRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:getSubtypes'),
    payload: FactQueryMessageSchema,
});
export const FactGetSubtypesResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// FACT GET SUPERTYPES CONTRACT
// =====================================================
export const FactGetSupertypesRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:getSupertypes'),
    payload: FactQueryMessageSchema,
});
export const FactGetSupertypesResponseSchema = BaseResponseSchema.extend({
    data: z.array(z.any()),
});
// =====================================================
// FACT GET CLASSIFIED CONTRACT
// =====================================================
export const FactGetClassifiedRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:getClassified'),
    payload: FactQueryMessageSchema,
});
export const FactGetClassifiedResponseSchema = BaseResponseSchema.extend({
    data: z.any().optional(),
});
// =====================================================
// FACT VALIDATE CONTRACT
// =====================================================
export const FactValidateRequestSchema = BaseRequestSchema.extend({
    service: z.literal('archivist'),
    action: z.literal('fact:validate'),
    payload: FactCreateMessageSchema,
});
export const FactValidateResponseSchema = BaseResponseSchema.extend({
    data: z.object({
        valid: z.boolean(),
        message: z.string(),
    }).optional(),
});
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
};
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
    ERROR: 'fact:error',
};
//# sourceMappingURL=facts.js.map