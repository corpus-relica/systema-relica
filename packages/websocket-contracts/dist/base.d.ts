import { z } from 'zod';
/**
 * Base WebSocket message structure
 */
export declare const BaseMessageSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["request", "response", "event"]>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request" | "response" | "event";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request" | "response" | "event";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type BaseMessage = z.infer<typeof BaseMessageSchema>;
/**
 * Base request message
 */
export declare const BaseRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"request">;
    service: z.ZodString;
    action: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: string;
    action: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}, {
    id: string;
    type: "request";
    service: string;
    action: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}>;
export type BaseRequest = z.infer<typeof BaseRequestSchema>;
/**
 * Base response message
 */
export declare const BaseResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: unknown;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: unknown;
    error?: string | undefined;
}>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
/**
 * Base event message
 */
export declare const BaseEventSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"event">;
    topic: z.ZodString;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "event";
    topic: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}, {
    id: string;
    type: "event";
    topic: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}>;
export type BaseEvent = z.infer<typeof BaseEventSchema>;
/**
 * Union of all message types
 */
export declare const MessageSchema: z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"request">;
    service: z.ZodString;
    action: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: string;
    action: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}, {
    id: string;
    type: "request";
    service: string;
    action: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}>, z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: unknown;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: unknown;
    error?: string | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"event">;
    topic: z.ZodString;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "event";
    topic: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}, {
    id: string;
    type: "event";
    topic: string;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: unknown;
}>]>;
export type Message = z.infer<typeof MessageSchema>;
//# sourceMappingURL=base.d.ts.map