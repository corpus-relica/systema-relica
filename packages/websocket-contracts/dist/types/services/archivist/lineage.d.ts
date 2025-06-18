import { z } from 'zod';
/**
 * Lineage query data structure
 */
export declare const LineageQueryMessageSchema: z.ZodObject<{
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
}, {
    uid: number;
}>;
export type LineageQueryMessage = z.infer<typeof LineageQueryMessageSchema>;
export declare const LineageGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"lineage:get">;
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
    action: "lineage:get";
    payload: {
        uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "lineage:get";
    payload: {
        uid: number;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type LineageGetRequest = z.infer<typeof LineageGetRequestSchema>;
export declare const LineageGetResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodObject<{
        data: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        data: number[];
    }, {
        data: number[];
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    data: {
        data: number[];
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    data: {
        data: number[];
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    error?: string | undefined;
}>;
export type LineageGetResponse = z.infer<typeof LineageGetResponseSchema>;
export declare const LineageActions: {
    readonly GET: "lineage:get";
};
export type LineageActionType = typeof LineageActions[keyof typeof LineageActions];
export declare const LineageEvents: {
    readonly RETRIEVED: "lineage:retrieved";
    readonly ERROR: "lineage:error";
};
export type LineageEventType = typeof LineageEvents[keyof typeof LineageEvents];
//# sourceMappingURL=lineage.d.ts.map