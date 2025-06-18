import { z } from 'zod';
/**
 * Validation message data structure
 */
export declare const ValidationMessageSchema: z.ZodObject<{
    fact: z.ZodObject<{
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
    context: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    fact: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    context?: any;
}, {
    fact: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
    } & {
        [k: string]: any;
    };
    context?: any;
}>;
export type ValidationMessage = z.infer<typeof ValidationMessageSchema>;
/**
 * Collection validation message data structure
 */
export declare const ValidationCollectionMessageSchema: z.ZodObject<{
    facts: z.ZodArray<z.ZodObject<{
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
    }, z.ZodAny, "strip">>, "many">;
}, "strip", z.ZodTypeAny, {
    facts: z.objectOutputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">[];
}, {
    facts: z.objectInputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">[];
}>;
export type ValidationCollectionMessage = z.infer<typeof ValidationCollectionMessageSchema>;
export declare const ValidationValidateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"validation:validate">;
    payload: z.ZodObject<{
        fact: z.ZodObject<{
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
        context: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        fact: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
        } & {
            [k: string]: any;
        };
        context?: any;
    }, {
        fact: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
        } & {
            [k: string]: any;
        };
        context?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "validation:validate";
    payload: {
        fact: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
        } & {
            [k: string]: any;
        };
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "validation:validate";
    payload: {
        fact: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
        } & {
            [k: string]: any;
        };
        context?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ValidationValidateRequest = z.infer<typeof ValidationValidateRequestSchema>;
export declare const ValidationValidateResponseSchema: z.ZodObject<{
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
export type ValidationValidateResponse = z.infer<typeof ValidationValidateResponseSchema>;
export declare const ValidationCollectionRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"validation:collection">;
    payload: z.ZodObject<{
        facts: z.ZodArray<z.ZodObject<{
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
        }, z.ZodAny, "strip">>, "many">;
    }, "strip", z.ZodTypeAny, {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
    }, {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "validation:collection";
    payload: {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "validation:collection";
    payload: {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type ValidationCollectionRequest = z.infer<typeof ValidationCollectionRequestSchema>;
export declare const ValidationCollectionResponseSchema: z.ZodObject<{
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
export type ValidationCollectionResponse = z.infer<typeof ValidationCollectionResponseSchema>;
export declare const ValidationActions: {
    readonly VALIDATE: "validation:validate";
    readonly COLLECTION: "validation:collection";
};
export type ValidationActionType = typeof ValidationActions[keyof typeof ValidationActions];
export declare const ValidationEvents: {
    readonly RESULT: "validation:result";
    readonly COLLECTION_RESULT: "validation:collection:result";
    readonly ERROR: "validation:error";
};
export type ValidationEventType = typeof ValidationEvents[keyof typeof ValidationEvents];
//# sourceMappingURL=validation.d.ts.map