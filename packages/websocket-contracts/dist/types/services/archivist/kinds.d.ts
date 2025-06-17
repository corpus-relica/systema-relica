import { z } from 'zod';
/**
 * Kind message data structure
 */
export declare const KindMessageSchema: z.ZodObject<{
    uid: z.ZodOptional<z.ZodNumber>;
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    uid?: number | undefined;
    query?: string | undefined;
    filters?: any;
}, {
    uid?: number | undefined;
    query?: string | undefined;
    filters?: any;
}>;
export type KindMessage = z.infer<typeof KindMessageSchema>;
export declare const KindGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"kind:get">;
    payload: z.ZodObject<{
        uid: z.ZodOptional<z.ZodNumber>;
        query: z.ZodOptional<z.ZodString>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kind:get";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kind:get";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type KindGetRequest = z.infer<typeof KindGetRequestSchema>;
export declare const KindGetResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodNullable<z.ZodAny>;
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
export type KindGetResponse = z.infer<typeof KindGetResponseSchema>;
export declare const KindsListRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"kinds:list">;
    payload: z.ZodObject<{
        uid: z.ZodOptional<z.ZodNumber>;
        query: z.ZodOptional<z.ZodString>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kinds:list";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kinds:list";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type KindsListRequest = z.infer<typeof KindsListRequestSchema>;
export declare const KindsListResponseSchema: z.ZodObject<{
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
export type KindsListResponse = z.infer<typeof KindsListResponseSchema>;
export declare const KindsSearchRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"kinds:search">;
    payload: z.ZodObject<{
        uid: z.ZodOptional<z.ZodNumber>;
        query: z.ZodOptional<z.ZodString>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }, {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kinds:search";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "kinds:search";
    payload: {
        uid?: number | undefined;
        query?: string | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type KindsSearchRequest = z.infer<typeof KindsSearchRequestSchema>;
export declare const KindsSearchResponseSchema: z.ZodObject<{
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
export type KindsSearchResponse = z.infer<typeof KindsSearchResponseSchema>;
export declare const KindActions: {
    readonly GET: "kind:get";
    readonly LIST: "kinds:list";
    readonly SEARCH: "kinds:search";
};
export type KindActionType = typeof KindActions[keyof typeof KindActions];
export declare const KindEvents: {
    readonly RETRIEVED: "kind:retrieved";
    readonly LIST: "kinds:list";
    readonly SEARCH_RESULTS: "kinds:search:results";
    readonly ERROR: "kind:error";
};
export type KindEventType = typeof KindEvents[keyof typeof KindEvents];
//# sourceMappingURL=kinds.d.ts.map