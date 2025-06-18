import { z } from 'zod';
/**
 * Query message data structure
 */
export declare const QueryMessageSchema: z.ZodObject<{
    query: z.ZodString;
    parameters: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    query: string;
    parameters?: any;
}, {
    query: string;
    parameters?: any;
}>;
export type QueryMessage = z.infer<typeof QueryMessageSchema>;
export declare const QueryExecuteRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"query:execute">;
    payload: z.ZodObject<{
        query: z.ZodString;
        parameters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        parameters?: any;
    }, {
        query: string;
        parameters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:execute";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:execute";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type QueryExecuteRequest = z.infer<typeof QueryExecuteRequestSchema>;
export declare const QueryExecuteResponseSchema: z.ZodObject<{
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
export type QueryExecuteResponse = z.infer<typeof QueryExecuteResponseSchema>;
export declare const QueryValidateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"query:validate">;
    payload: z.ZodObject<{
        query: z.ZodString;
        parameters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        parameters?: any;
    }, {
        query: string;
        parameters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:validate";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:validate";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type QueryValidateRequest = z.infer<typeof QueryValidateRequestSchema>;
export declare const QueryValidateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        valid: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        message: string;
    }, {
        valid: boolean;
        message: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        valid: boolean;
        message: string;
    } | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        valid: boolean;
        message: string;
    } | undefined;
    error?: string | undefined;
}>;
export type QueryValidateResponse = z.infer<typeof QueryValidateResponseSchema>;
export declare const QueryParseRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"query:parse">;
    payload: z.ZodObject<{
        query: z.ZodString;
        parameters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        parameters?: any;
    }, {
        query: string;
        parameters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:parse";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "query:parse";
    payload: {
        query: string;
        parameters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type QueryParseRequest = z.infer<typeof QueryParseRequestSchema>;
export declare const QueryParseResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        parsed: z.ZodNullable<z.ZodAny>;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        parsed?: any;
    }, {
        message: string;
        parsed?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        parsed?: any;
    } | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        parsed?: any;
    } | undefined;
    error?: string | undefined;
}>;
export type QueryParseResponse = z.infer<typeof QueryParseResponseSchema>;
export declare const QueryActions: {
    readonly EXECUTE: "query:execute";
    readonly VALIDATE: "query:validate";
    readonly PARSE: "query:parse";
};
export type QueryActionType = typeof QueryActions[keyof typeof QueryActions];
export declare const QueryEvents: {
    readonly RESULTS: "query:results";
    readonly VALIDATED: "query:validated";
    readonly PARSED: "query:parsed";
    readonly ERROR: "query:error";
};
export type QueryEventType = typeof QueryEvents[keyof typeof QueryEvents];
//# sourceMappingURL=query.d.ts.map