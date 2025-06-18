import { z } from 'zod';
/**
 * Completion message data structure
 */
export declare const CompletionMessageSchema: z.ZodObject<{
    query: z.ZodString;
    context: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    query: string;
    context?: any;
}, {
    query: string;
    context?: any;
}>;
export type CompletionMessage = z.infer<typeof CompletionMessageSchema>;
export declare const CompletionRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"completion:request">;
    payload: z.ZodObject<{
        query: z.ZodString;
        context: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        context?: any;
    }, {
        query: string;
        context?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:request";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:request";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;
export declare const CompletionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}>;
export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;
export declare const CompletionEntitiesRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"completion:entities">;
    payload: z.ZodObject<{
        query: z.ZodString;
        context: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        context?: any;
    }, {
        query: string;
        context?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:entities";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:entities";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type CompletionEntitiesRequest = z.infer<typeof CompletionEntitiesRequestSchema>;
export declare const CompletionEntitiesResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}>;
export type CompletionEntitiesResponse = z.infer<typeof CompletionEntitiesResponseSchema>;
export declare const CompletionRelationsRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"completion:relations">;
    payload: z.ZodObject<{
        query: z.ZodString;
        context: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        context?: any;
    }, {
        query: string;
        context?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:relations";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "completion:relations";
    payload: {
        query: string;
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type CompletionRelationsRequest = z.infer<typeof CompletionRelationsRequestSchema>;
export declare const CompletionRelationsResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    data: any[];
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}>;
export type CompletionRelationsResponse = z.infer<typeof CompletionRelationsResponseSchema>;
export declare const CompletionActions: {
    readonly REQUEST: "completion:request";
    readonly ENTITIES: "completion:entities";
    readonly RELATIONS: "completion:relations";
};
export type CompletionActionType = typeof CompletionActions[keyof typeof CompletionActions];
export declare const CompletionEvents: {
    readonly RESULTS: "completion:results";
    readonly ENTITIES_RESULTS: "completion:entities:results";
    readonly RELATIONS_RESULTS: "completion:relations:results";
    readonly ERROR: "completion:error";
};
export type CompletionEventType = typeof CompletionEvents[keyof typeof CompletionEvents];
//# sourceMappingURL=completion.d.ts.map