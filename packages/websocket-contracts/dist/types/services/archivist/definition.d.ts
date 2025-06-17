import { z } from 'zod';
/**
 * Definition message data structure
 */
export declare const DefinitionMessageSchema: z.ZodObject<{
    uid: z.ZodNumber;
    definition: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    uid: number;
    definition?: any;
}, {
    uid: number;
    definition?: any;
}>;
export type DefinitionMessage = z.infer<typeof DefinitionMessageSchema>;
export declare const DefinitionGetRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"definition:get">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        definition: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        definition?: any;
    }, {
        uid: number;
        definition?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "definition:get";
    payload: {
        uid: number;
        definition?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "definition:get";
    payload: {
        uid: number;
        definition?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type DefinitionGetRequest = z.infer<typeof DefinitionGetRequestSchema>;
export declare const DefinitionGetResponseSchema: z.ZodObject<{
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
export type DefinitionGetResponse = z.infer<typeof DefinitionGetResponseSchema>;
export declare const DefinitionUpdateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"archivist">;
    action: z.ZodLiteral<"definition:update">;
    payload: z.ZodObject<{
        uid: z.ZodNumber;
        definition: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        uid: number;
        definition?: any;
    }, {
        uid: number;
        definition?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "archivist";
    action: "definition:update";
    payload: {
        uid: number;
        definition?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}, {
    id: string;
    type: "request";
    service: "archivist";
    action: "definition:update";
    payload: {
        uid: number;
        definition?: any;
    };
    timestamp?: number | undefined;
    correlationId?: string | undefined;
}>;
export type DefinitionUpdateRequest = z.infer<typeof DefinitionUpdateRequestSchema>;
export declare const DefinitionUpdateResponseSchema: z.ZodObject<{
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
export type DefinitionUpdateResponse = z.infer<typeof DefinitionUpdateResponseSchema>;
export declare const DefinitionActions: {
    readonly GET: "definition:get";
    readonly UPDATE: "definition:update";
};
export type DefinitionActionType = typeof DefinitionActions[keyof typeof DefinitionActions];
export declare const DefinitionEvents: {
    readonly RETRIEVED: "definition:retrieved";
    readonly UPDATED: "definition:updated";
    readonly ERROR: "definition:error";
};
export type DefinitionEventType = typeof DefinitionEvents[keyof typeof DefinitionEvents];
//# sourceMappingURL=definition.d.ts.map