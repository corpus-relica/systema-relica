import { z } from 'zod';
/**
 * Transaction message data structure
 */
export declare const TransactionMessageSchema: z.ZodObject<{
    transaction_id: z.ZodOptional<z.ZodString>;
    operations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    transaction_id?: string | undefined;
    operations?: any[] | undefined;
}, {
    transaction_id?: string | undefined;
    operations?: any[] | undefined;
}>;
export type TransactionMessage = z.infer<typeof TransactionMessageSchema>;
export declare const TransactionStartRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"transaction:start">;
    payload: z.ZodObject<{
        transaction_id: z.ZodOptional<z.ZodString>;
        operations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:start";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:start";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type TransactionStartRequest = z.infer<typeof TransactionStartRequestSchema>;
export declare const TransactionStartResponseSchema: z.ZodObject<{
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
export type TransactionStartResponse = z.infer<typeof TransactionStartResponseSchema>;
export declare const TransactionCommitRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"transaction:commit">;
    payload: z.ZodObject<{
        transaction_id: z.ZodOptional<z.ZodString>;
        operations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:commit";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:commit";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type TransactionCommitRequest = z.infer<typeof TransactionCommitRequestSchema>;
export declare const TransactionCommitResponseSchema: z.ZodObject<{
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
export type TransactionCommitResponse = z.infer<typeof TransactionCommitResponseSchema>;
export declare const TransactionRollbackRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"transaction:rollback">;
    payload: z.ZodObject<{
        transaction_id: z.ZodOptional<z.ZodString>;
        operations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:rollback";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:rollback";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type TransactionRollbackRequest = z.infer<typeof TransactionRollbackRequestSchema>;
export declare const TransactionRollbackResponseSchema: z.ZodObject<{
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
export type TransactionRollbackResponse = z.infer<typeof TransactionRollbackResponseSchema>;
export declare const TransactionGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"transaction:get">;
    payload: z.ZodObject<{
        transaction_id: z.ZodOptional<z.ZodString>;
        operations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }, {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:get";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "transaction:get";
    payload: {
        transaction_id?: string | undefined;
        operations?: any[] | undefined;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type TransactionGetRequest = z.infer<typeof TransactionGetRequestSchema>;
export declare const TransactionGetResponseSchema: z.ZodObject<{
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
export type TransactionGetResponse = z.infer<typeof TransactionGetResponseSchema>;
export declare const TransactionActions: {
    readonly START: "transaction:start";
    readonly COMMIT: "transaction:commit";
    readonly ROLLBACK: "transaction:rollback";
    readonly GET: "transaction:get";
};
export type TransactionActionType = typeof TransactionActions[keyof typeof TransactionActions];
export declare const TransactionEvents: {
    readonly STARTED: "transaction:started";
    readonly COMMITTED: "transaction:committed";
    readonly ROLLED_BACK: "transaction:rolledback";
    readonly RETRIEVED: "transaction:retrieved";
    readonly ERROR: "transaction:error";
};
export type TransactionEventType = typeof TransactionEvents[keyof typeof TransactionEvents];
//# sourceMappingURL=transaction.d.ts.map