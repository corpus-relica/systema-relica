import { z } from 'zod';
/**
 * Fact creation data structure
 */
export declare const FactCreateMessageSchema: z.ZodObject<{
    lh_object_uid: z.ZodNumber;
    rh_object_uid: z.ZodNumber;
    rel_type_uid: z.ZodNumber;
}, "strip", z.ZodAny, z.objectOutputType<{
    lh_object_uid: z.ZodNumber;
    rh_object_uid: z.ZodNumber;
    rel_type_uid: z.ZodNumber;
}, z.ZodAny, "strip">, z.objectInputType<{
    lh_object_uid: z.ZodNumber;
    rh_object_uid: z.ZodNumber;
    rel_type_uid: z.ZodNumber;
}, z.ZodAny, "strip">>;
export type FactCreateMessage = z.infer<typeof FactCreateMessageSchema>;
/**
 * Fact update data structure
 */
export declare const FactUpdateMessageSchema: z.ZodObject<{
    fact_uid: z.ZodNumber;
    updates: z.ZodObject<{
        lh_object_uid: z.ZodOptional<z.ZodNumber>;
        rh_object_uid: z.ZodOptional<z.ZodNumber>;
        rel_type_uid: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodAny, z.objectOutputType<{
        lh_object_uid: z.ZodOptional<z.ZodNumber>;
        rh_object_uid: z.ZodOptional<z.ZodNumber>;
        rel_type_uid: z.ZodOptional<z.ZodNumber>;
    }, z.ZodAny, "strip">, z.objectInputType<{
        lh_object_uid: z.ZodOptional<z.ZodNumber>;
        rh_object_uid: z.ZodOptional<z.ZodNumber>;
        rel_type_uid: z.ZodOptional<z.ZodNumber>;
    }, z.ZodAny, "strip">>;
}, "strip", z.ZodTypeAny, {
    fact_uid: number;
    updates: {
        lh_object_uid?: number | undefined;
        rh_object_uid?: number | undefined;
        rel_type_uid?: number | undefined;
    } & {
        [k: string]: any;
    };
}, {
    fact_uid: number;
    updates: {
        lh_object_uid?: number | undefined;
        rh_object_uid?: number | undefined;
        rel_type_uid?: number | undefined;
    } & {
        [k: string]: any;
    };
}>;
export type FactUpdateMessage = z.infer<typeof FactUpdateMessageSchema>;
/**
 * Fact delete data structure
 */
export declare const FactDeleteMessageSchema: z.ZodObject<{
    fact_uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    fact_uid: number;
}, {
    fact_uid: number;
}>;
export type FactDeleteMessage = z.infer<typeof FactDeleteMessageSchema>;
/**
 * Fact query data structure
 */
export declare const FactQueryMessageSchema: z.ZodObject<{
    uid: z.ZodNumber;
    includeSubtypes: z.ZodOptional<z.ZodBoolean>;
    maxDepth: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    uid: number;
    includeSubtypes?: boolean | undefined;
    maxDepth?: number | undefined;
}, {
    uid: number;
    includeSubtypes?: boolean | undefined;
    maxDepth?: number | undefined;
}>;
export type FactQueryMessage = z.infer<typeof FactQueryMessageSchema>;
export declare const FactCreateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:create">;
    payload: z.ZodObject<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, "strip", z.ZodAny, z.objectOutputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">, z.objectInputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:create";
    payload: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:create";
    payload: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactCreateRequest = z.infer<typeof FactCreateRequestSchema>;
export declare const FactCreateResponseSchema: z.ZodObject<{
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
export type FactCreateResponse = z.infer<typeof FactCreateResponseSchema>;
export declare const FactUpdateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:update">;
    payload: z.ZodObject<{
        fact_uid: z.ZodNumber;
        updates: z.ZodObject<{
            lh_object_uid: z.ZodOptional<z.ZodNumber>;
            rh_object_uid: z.ZodOptional<z.ZodNumber>;
            rel_type_uid: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodAny, z.objectOutputType<{
            lh_object_uid: z.ZodOptional<z.ZodNumber>;
            rh_object_uid: z.ZodOptional<z.ZodNumber>;
            rel_type_uid: z.ZodOptional<z.ZodNumber>;
        }, z.ZodAny, "strip">, z.objectInputType<{
            lh_object_uid: z.ZodOptional<z.ZodNumber>;
            rh_object_uid: z.ZodOptional<z.ZodNumber>;
            rel_type_uid: z.ZodOptional<z.ZodNumber>;
        }, z.ZodAny, "strip">>;
    }, "strip", z.ZodTypeAny, {
        fact_uid: number;
        updates: {
            lh_object_uid?: number | undefined;
            rh_object_uid?: number | undefined;
            rel_type_uid?: number | undefined;
        } & {
            [k: string]: any;
        };
    }, {
        fact_uid: number;
        updates: {
            lh_object_uid?: number | undefined;
            rh_object_uid?: number | undefined;
            rel_type_uid?: number | undefined;
        } & {
            [k: string]: any;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:update";
    payload: {
        fact_uid: number;
        updates: {
            lh_object_uid?: number | undefined;
            rh_object_uid?: number | undefined;
            rel_type_uid?: number | undefined;
        } & {
            [k: string]: any;
        };
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:update";
    payload: {
        fact_uid: number;
        updates: {
            lh_object_uid?: number | undefined;
            rh_object_uid?: number | undefined;
            rel_type_uid?: number | undefined;
        } & {
            [k: string]: any;
        };
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactUpdateRequest = z.infer<typeof FactUpdateRequestSchema>;
export declare const FactUpdateResponseSchema: z.ZodObject<{
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
export type FactUpdateResponse = z.infer<typeof FactUpdateResponseSchema>;
export declare const FactDeleteRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:delete">;
    payload: z.ZodObject<{
        fact_uid: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        fact_uid: number;
    }, {
        fact_uid: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:delete";
    payload: {
        fact_uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:delete";
    payload: {
        fact_uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactDeleteRequest = z.infer<typeof FactDeleteRequestSchema>;
export declare const FactDeleteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        fact_uid: z.ZodNumber;
        success: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        fact_uid: number;
    }, {
        success: boolean;
        fact_uid: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        success: boolean;
        fact_uid: number;
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
        fact_uid: number;
    } | undefined;
    error?: string | undefined;
}>;
export type FactDeleteResponse = z.infer<typeof FactDeleteResponseSchema>;
export declare const FactGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:get">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        includeSubtypes: z.ZodOptional<z.ZodBoolean>;
        maxDepth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:get";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:get";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactGetRequest = z.infer<typeof FactGetRequestSchema>;
export declare const FactGetResponseSchema: z.ZodObject<{
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
export type FactGetResponse = z.infer<typeof FactGetResponseSchema>;
export declare const FactGetSubtypesRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:getSubtypes">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        includeSubtypes: z.ZodOptional<z.ZodBoolean>;
        maxDepth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getSubtypes";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getSubtypes";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactGetSubtypesRequest = z.infer<typeof FactGetSubtypesRequestSchema>;
export declare const FactGetSubtypesResponseSchema: z.ZodObject<{
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
export type FactGetSubtypesResponse = z.infer<typeof FactGetSubtypesResponseSchema>;
export declare const FactGetSupertypesRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:getSupertypes">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        includeSubtypes: z.ZodOptional<z.ZodBoolean>;
        maxDepth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getSupertypes";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getSupertypes";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactGetSupertypesRequest = z.infer<typeof FactGetSupertypesRequestSchema>;
export declare const FactGetSupertypesResponseSchema: z.ZodObject<{
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
export type FactGetSupertypesResponse = z.infer<typeof FactGetSupertypesResponseSchema>;
export declare const FactGetClassifiedRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:getClassified">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        includeSubtypes: z.ZodOptional<z.ZodBoolean>;
        maxDepth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }, {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getClassified";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:getClassified";
    payload: {
        uid: number;
        includeSubtypes?: boolean | undefined;
        maxDepth?: number | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactGetClassifiedRequest = z.infer<typeof FactGetClassifiedRequestSchema>;
export declare const FactGetClassifiedResponseSchema: z.ZodObject<{
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
export type FactGetClassifiedResponse = z.infer<typeof FactGetClassifiedResponseSchema>;
export declare const FactValidateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:validate">;
    payload: z.ZodObject<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, "strip", z.ZodAny, z.objectOutputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">, z.objectInputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:validate";
    payload: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:validate";
    payload: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactValidateRequest = z.infer<typeof FactValidateRequestSchema>;
export declare const FactValidateResponseSchema: z.ZodObject<{
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
export type FactValidateResponse = z.infer<typeof FactValidateResponseSchema>;
/**
 * Fact batch get data structure
 */
export declare const FactBatchGetMessageSchema: z.ZodObject<{
    skip: z.ZodNumber;
    range: z.ZodNumber;
    relTypeUids: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    skip: number;
    range: number;
    relTypeUids?: number[] | undefined;
}, {
    skip: number;
    range: number;
    relTypeUids?: number[] | undefined;
}>;
export type FactBatchGetMessage = z.infer<typeof FactBatchGetMessageSchema>;
export declare const FactBatchGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:batch-get">;
    payload: z.ZodObject<{
        skip: z.ZodNumber;
        range: z.ZodNumber;
        relTypeUids: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        skip: number;
        range: number;
        relTypeUids?: number[] | undefined;
    }, {
        skip: number;
        range: number;
        relTypeUids?: number[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:batch-get";
    payload: {
        skip: number;
        range: number;
        relTypeUids?: number[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:batch-get";
    payload: {
        skip: number;
        range: number;
        relTypeUids?: number[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactBatchGetRequest = z.infer<typeof FactBatchGetRequestSchema>;
export declare const FactBatchGetResponseSchema: z.ZodObject<{
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
export type FactBatchGetResponse = z.infer<typeof FactBatchGetResponseSchema>;
export declare const FactCountRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"fact:count">;
    payload: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:count";
    payload: {};
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "fact:count";
    payload: {};
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type FactCountRequest = z.infer<typeof FactCountRequestSchema>;
export declare const FactCountResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        count: number;
    }, {
        count: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    data: {
        count: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    data: {
        count: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}>;
export type FactCountResponse = z.infer<typeof FactCountResponseSchema>;
export declare const FactActions: {
    readonly CREATE: "fact:create";
    readonly UPDATE: "fact:update";
    readonly DELETE: "fact:delete";
    readonly GET: "fact:get";
    readonly GET_SUBTYPES: "fact:getSubtypes";
    readonly GET_SUPERTYPES: "fact:getSupertypes";
    readonly GET_CLASSIFIED: "fact:getClassified";
    readonly VALIDATE: "fact:validate";
    readonly BATCH_GET: "fact:batch-get";
    readonly COUNT: "fact:count";
};
export type FactActionType = typeof FactActions[keyof typeof FactActions];
export declare const FactEvents: {
    readonly CREATED: "fact:created";
    readonly UPDATED: "fact:updated";
    readonly DELETED: "fact:deleted";
    readonly RETRIEVED: "fact:retrieved";
    readonly SUBTYPES: "fact:subtypes";
    readonly SUPERTYPES: "fact:supertypes";
    readonly CLASSIFIED: "fact:classified";
    readonly VALIDATED: "fact:validated";
    readonly BATCH_RETRIEVED: "fact:batch-retrieved";
    readonly COUNT_RETRIEVED: "fact:count-retrieved";
    readonly ERROR: "fact:error";
};
export type FactEventType = typeof FactEvents[keyof typeof FactEvents];
//# sourceMappingURL=facts.d.ts.map