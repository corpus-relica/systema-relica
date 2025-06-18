import { z } from 'zod';
/**
 * Concept message data structure
 */
export declare const ConceptMessageSchema: z.ZodObject<{
    uid: z.ZodNumber;
    operation: z.ZodOptional<z.ZodEnum<["get", "create", "update", "delete"]>>;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    uid: number;
    data?: any;
    operation?: "get" | "create" | "update" | "delete" | undefined;
}, {
    uid: number;
    data?: any;
    operation?: "get" | "create" | "update" | "delete" | undefined;
}>;
export type ConceptMessage = z.infer<typeof ConceptMessageSchema>;
export declare const ConceptGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"concept:get">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        operation: z.ZodOptional<z.ZodEnum<["get", "create", "update", "delete"]>>;
        data: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:get";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:get";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ConceptGetRequest = z.infer<typeof ConceptGetRequestSchema>;
export declare const ConceptGetResponseSchema: z.ZodObject<{
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
export type ConceptGetResponse = z.infer<typeof ConceptGetResponseSchema>;
export declare const ConceptCreateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"concept:create">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        operation: z.ZodOptional<z.ZodEnum<["get", "create", "update", "delete"]>>;
        data: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:create";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:create";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ConceptCreateRequest = z.infer<typeof ConceptCreateRequestSchema>;
export declare const ConceptCreateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        success: boolean;
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
        success: boolean;
    } | undefined;
    error?: string | undefined;
}>;
export type ConceptCreateResponse = z.infer<typeof ConceptCreateResponseSchema>;
export declare const ConceptUpdateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"concept:update">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        operation: z.ZodOptional<z.ZodEnum<["get", "create", "update", "delete"]>>;
        data: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:update";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:update";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ConceptUpdateRequest = z.infer<typeof ConceptUpdateRequestSchema>;
export declare const ConceptUpdateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
    }, {
        message: string;
        success: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        success: boolean;
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
        success: boolean;
    } | undefined;
    error?: string | undefined;
}>;
export type ConceptUpdateResponse = z.infer<typeof ConceptUpdateResponseSchema>;
export declare const ConceptDeleteRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"concept:delete">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        operation: z.ZodOptional<z.ZodEnum<["get", "create", "update", "delete"]>>;
        data: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }, {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:delete";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "concept:delete";
    payload: {
        uid: number;
        data?: any;
        operation?: "get" | "create" | "update" | "delete" | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ConceptDeleteRequest = z.infer<typeof ConceptDeleteRequestSchema>;
export declare const ConceptDeleteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        uid: z.ZodNumber;
        success: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        uid: number;
    }, {
        success: boolean;
        uid: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        success: boolean;
        uid: number;
    } | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        success: boolean;
        uid: number;
    } | undefined;
    error?: string | undefined;
}>;
export type ConceptDeleteResponse = z.infer<typeof ConceptDeleteResponseSchema>;
export declare const ConceptActions: {
    readonly GET: "concept:get";
    readonly CREATE: "concept:create";
    readonly UPDATE: "concept:update";
    readonly DELETE: "concept:delete";
};
export type ConceptActionType = typeof ConceptActions[keyof typeof ConceptActions];
export declare const ConceptEvents: {
    readonly RETRIEVED: "concept:retrieved";
    readonly CREATED: "concept:created";
    readonly UPDATED: "concept:updated";
    readonly DELETED: "concept:deleted";
    readonly ERROR: "concept:error";
};
export type ConceptEventType = typeof ConceptEvents[keyof typeof ConceptEvents];
//# sourceMappingURL=concepts.d.ts.map