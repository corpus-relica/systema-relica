import { z } from 'zod';
/**
 * Submission message data structure
 */
export declare const SubmissionMessageSchema: z.ZodObject<{
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
    metadata: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    facts: z.objectOutputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">[];
    metadata?: any;
}, {
    facts: z.objectInputType<{
        lh_object_uid: z.ZodNumber;
        rh_object_uid: z.ZodNumber;
        rel_type_uid: z.ZodNumber;
    }, z.ZodAny, "strip">[];
    metadata?: any;
}>;
export type SubmissionMessage = z.infer<typeof SubmissionMessageSchema>;
export declare const SubmissionSubmitRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"submission:submit">;
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
        metadata: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    }, {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "submission:submit";
    payload: {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "submission:submit";
    payload: {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SubmissionSubmitRequest = z.infer<typeof SubmissionSubmitRequestSchema>;
export declare const SubmissionSubmitResponseSchema: z.ZodObject<{
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
export type SubmissionSubmitResponse = z.infer<typeof SubmissionSubmitResponseSchema>;
export declare const SubmissionBatchRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"submission:batch">;
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
        metadata: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    }, {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "submission:batch";
    payload: {
        facts: z.objectOutputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "submission:batch";
    payload: {
        facts: z.objectInputType<{
            lh_object_uid: z.ZodNumber;
            rh_object_uid: z.ZodNumber;
            rel_type_uid: z.ZodNumber;
        }, z.ZodAny, "strip">[];
        metadata?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type SubmissionBatchRequest = z.infer<typeof SubmissionBatchRequestSchema>;
export declare const SubmissionBatchResponseSchema: z.ZodObject<{
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
export type SubmissionBatchResponse = z.infer<typeof SubmissionBatchResponseSchema>;
export declare const SubmissionActions: {
    readonly SUBMIT: "submission:submit";
    readonly BATCH: "submission:batch";
};
export type SubmissionActionType = typeof SubmissionActions[keyof typeof SubmissionActions];
export declare const SubmissionEvents: {
    readonly COMPLETED: "submission:completed";
    readonly BATCH_COMPLETED: "submission:batch:completed";
    readonly ERROR: "submission:error";
};
export type SubmissionEventType = typeof SubmissionEvents[keyof typeof SubmissionEvents];
//# sourceMappingURL=submission.d.ts.map