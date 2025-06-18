import { z } from 'zod';

/**
 * Base WebSocket message structure
 */
export const BaseMessageSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['request', 'response', 'event']),
  timestamp: z.number().optional(),
  correlationId: z.string().optional(),
});

export type BaseMessage = z.infer<typeof BaseMessageSchema>;

/**
 * Base request message
 */
export const BaseRequestSchema = BaseMessageSchema.extend({
  type: z.literal('request'),
  service: z.string(),
  action: z.string(),
  payload: z.unknown().optional(),
});

export type BaseRequest = z.infer<typeof BaseRequestSchema>;

/**
 * Base response message
 */
export const BaseResponseSchema = BaseMessageSchema.extend({
  type: z.literal('response'),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;

/**
 * Base event message
 */
export const BaseEventSchema = BaseMessageSchema.extend({
  type: z.literal('event'),
  topic: z.string(),
  payload: z.unknown(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Union of all message types
 */
export const MessageSchema = z.union([
  BaseRequestSchema,
  BaseResponseSchema,
  BaseEventSchema,
]);

export type Message = z.infer<typeof MessageSchema>;