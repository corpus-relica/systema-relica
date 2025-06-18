import { z } from 'zod';
/**
 * UID message data structure
 */
export declare const UIDMessageSchema: z.ZodObject<{
    count: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    count?: number | undefined;
}, {
    type?: string | undefined;
    count?: number | undefined;
}>;
export type UIDMessage = z.infer<typeof UIDMessageSchema>;
export declare const UIDGenerateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"uid:generate">;
    payload: z.ZodObject<{
        count: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: string | undefined;
        count?: number | undefined;
    }, {
        type?: string | undefined;
        count?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:generate";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:generate";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type UIDGenerateRequest = z.infer<typeof UIDGenerateRequestSchema>;
export declare const UIDGenerateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export type UIDGenerateResponse = z.infer<typeof UIDGenerateResponseSchema>;
export declare const UIDBatchRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"uid:batch">;
    payload: z.ZodObject<{
        count: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: string | undefined;
        count?: number | undefined;
    }, {
        type?: string | undefined;
        count?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:batch";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:batch";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type UIDBatchRequest = z.infer<typeof UIDBatchRequestSchema>;
export declare const UIDBatchResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export type UIDBatchResponse = z.infer<typeof UIDBatchResponseSchema>;
export declare const UIDReserveRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"uid:reserve">;
    payload: z.ZodObject<{
        count: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: string | undefined;
        count?: number | undefined;
    }, {
        type?: string | undefined;
        count?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:reserve";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "uid:reserve";
    payload: {
        type?: string | undefined;
        count?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type UIDReserveRequest = z.infer<typeof UIDReserveRequestSchema>;
export declare const UIDReserveResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export type UIDReserveResponse = z.infer<typeof UIDReserveResponseSchema>;
export declare const UIDActions: {
    readonly GENERATE: "uid:generate";
    readonly BATCH: "uid:batch";
    readonly RESERVE: "uid:reserve";
};
export type UIDActionType = typeof UIDActions[keyof typeof UIDActions];
export declare const UIDEvents: {
    readonly GENERATED: "uid:generated";
    readonly BATCH_GENERATED: "uid:batch:generated";
    readonly RANGE_RESERVED: "uid:range:reserved";
    readonly ERROR: "uid:error";
};
export type UIDEventType = typeof UIDEvents[keyof typeof UIDEvents];
//# sourceMappingURL=uids.d.ts.map