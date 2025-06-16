"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSchema = exports.BaseEventSchema = exports.BaseResponseSchema = exports.BaseRequestSchema = exports.BaseMessageSchema = void 0;
const zod_1 = require("zod");
/**
 * Base WebSocket message structure
 */
exports.BaseMessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['request', 'response', 'event']),
    timestamp: zod_1.z.number().optional(),
    correlationId: zod_1.z.string().optional(),
});
/**
 * Base request message
 */
exports.BaseRequestSchema = exports.BaseMessageSchema.extend({
    type: zod_1.z.literal('request'),
    service: zod_1.z.string(),
    action: zod_1.z.string(),
    payload: zod_1.z.unknown().optional(),
});
/**
 * Base response message
 */
exports.BaseResponseSchema = exports.BaseMessageSchema.extend({
    type: zod_1.z.literal('response'),
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
});
/**
 * Base event message
 */
exports.BaseEventSchema = exports.BaseMessageSchema.extend({
    type: zod_1.z.literal('event'),
    topic: zod_1.z.string(),
    payload: zod_1.z.unknown(),
});
/**
 * Union of all message types
 */
exports.MessageSchema = zod_1.z.union([
    exports.BaseRequestSchema,
    exports.BaseResponseSchema,
    exports.BaseEventSchema,
]);
//# sourceMappingURL=base.js.map