import { z } from 'zod';
/**
 * Search message data structure
 */
export declare const SearchMessageSchema: z.ZodObject<{
    query: z.ZodString;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    filters: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    query: string;
    page?: number | undefined;
    limit?: number | undefined;
    filters?: any;
}, {
    query: string;
    page?: number | undefined;
    limit?: number | undefined;
    filters?: any;
}>;
export type SearchMessage = z.infer<typeof SearchMessageSchema>;
/**
 * UID search message data structure
 */
export declare const UidSearchMessageSchema: z.ZodObject<{
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
}, {
    uid: number;
}>;
export type UidSearchMessage = z.infer<typeof UidSearchMessageSchema>;
export declare const SearchGeneralRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"search:general">;
    payload: z.ZodObject<{
        query: z.ZodString;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:general";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:general";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SearchGeneralRequest = z.infer<typeof SearchGeneralRequestSchema>;
export declare const SearchGeneralResponseSchema: z.ZodObject<{
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
export type SearchGeneralResponse = z.infer<typeof SearchGeneralResponseSchema>;
export declare const SearchIndividualRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"search:individual">;
    payload: z.ZodObject<{
        query: z.ZodString;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:individual";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:individual";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SearchIndividualRequest = z.infer<typeof SearchIndividualRequestSchema>;
export declare const SearchIndividualResponseSchema: z.ZodObject<{
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
export type SearchIndividualResponse = z.infer<typeof SearchIndividualResponseSchema>;
export declare const SearchKindRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"search:kind">;
    payload: z.ZodObject<{
        query: z.ZodString;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:kind";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:kind";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SearchKindRequest = z.infer<typeof SearchKindRequestSchema>;
export declare const SearchKindResponseSchema: z.ZodObject<{
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
export type SearchKindResponse = z.infer<typeof SearchKindResponseSchema>;
export declare const SearchExecuteRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"search:execute">;
    payload: z.ZodObject<{
        query: z.ZodString;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }, {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:execute";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:execute";
    payload: {
        query: string;
        page?: number | undefined;
        limit?: number | undefined;
        filters?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SearchExecuteRequest = z.infer<typeof SearchExecuteRequestSchema>;
export declare const SearchExecuteResponseSchema: z.ZodObject<{
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
export type SearchExecuteResponse = z.infer<typeof SearchExecuteResponseSchema>;
export declare const SearchUidRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"search:uid">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        uid: number;
    }, {
        uid: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:uid";
    payload: {
        uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "search:uid";
    payload: {
        uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SearchUidRequest = z.infer<typeof SearchUidRequestSchema>;
export declare const SearchUidResponseSchema: z.ZodObject<{
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
export type SearchUidResponse = z.infer<typeof SearchUidResponseSchema>;
export declare const SearchActions: {
    readonly GENERAL: "search:general";
    readonly INDIVIDUAL: "search:individual";
    readonly KIND: "search:kind";
    readonly EXECUTE: "search:execute";
    readonly UID: "search:uid";
};
export type SearchActionType = typeof SearchActions[keyof typeof SearchActions];
export declare const SearchEvents: {
    readonly GENERAL_RESULTS: "search:general:results";
    readonly INDIVIDUAL_RESULTS: "search:individual:results";
    readonly KIND_RESULTS: "search:kind:results";
    readonly EXECUTE_RESULTS: "search:execute:results";
    readonly UID_RESULTS: "search:uid:results";
    readonly ERROR: "search:error";
};
export type SearchEventType = typeof SearchEvents[keyof typeof SearchEvents];
//# sourceMappingURL=search.d.ts.map