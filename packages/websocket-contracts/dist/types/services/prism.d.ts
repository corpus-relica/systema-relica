import { z } from 'zod';
/**
 * Setup status data structure
 */
export declare const SetupStatusSchema: z.ZodObject<{
    status: z.ZodString;
    stage: z.ZodNullable<z.ZodString>;
    message: z.ZodString;
    progress: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    message: string;
    timestamp: string;
    stage: string | null;
    progress: number;
    error?: string | undefined;
}, {
    status: string;
    message: string;
    timestamp: string;
    stage: string | null;
    progress: number;
    error?: string | undefined;
}>;
export type SetupStatus = z.infer<typeof SetupStatusSchema>;
/**
 * Get Setup Status Request
 */
export declare const GetSetupStatusRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"prism">;
    action: z.ZodLiteral<"setup/get-status">;
    payload: z.ZodOptional<z.ZodUndefined>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/get-status";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/get-status";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}>;
export type GetSetupStatusRequest = z.infer<typeof GetSetupStatusRequestSchema>;
/**
 * Get Setup Status Response
 */
export declare const GetSetupStatusResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        status: z.ZodString;
        stage: z.ZodNullable<z.ZodString>;
        message: z.ZodString;
        progress: z.ZodNumber;
        error: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    } | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    } | undefined;
    error?: string | undefined;
}>;
export type GetSetupStatusResponse = z.infer<typeof GetSetupStatusResponseSchema>;
/**
 * Reset System Request
 */
export declare const ResetSystemRequestSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"prism">;
    action: z.ZodLiteral<"setup/reset-system">;
    payload: z.ZodOptional<z.ZodUndefined>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/reset-system";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/reset-system";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}>;
export type ResetSystemRequest = z.infer<typeof ResetSystemRequestSchema>;
/**
 * Reset System Response
 */
export declare const ResetSystemResponseSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        errors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
    }, {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
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
        timestamp: string;
        errors?: string[] | undefined;
    } | undefined;
    error?: string | undefined;
}>;
export type ResetSystemResponse = z.infer<typeof ResetSystemResponseSchema>;
/**
 * Setup Status Broadcast Event - sent to all connected clients when setup state changes
 */
export declare const SetupStatusBroadcastEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"setup-status-update">;
    data: z.ZodObject<{
        status: z.ZodString;
        stage: z.ZodNullable<z.ZodString>;
        message: z.ZodString;
        progress: z.ZodNumber;
        error: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "setup-status-update";
    data: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    };
}, {
    type: "setup-status-update";
    data: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    };
}>;
export type SetupStatusBroadcastEvent = z.infer<typeof SetupStatusBroadcastEventSchema>;
/**
 * All supported Prism WebSocket topics/actions
 * These are the actual topic strings used by both Portal and Prism
 */
export declare const PrismActions: {
    readonly GET_SETUP_STATUS: "setup/get-status";
    readonly START_SETUP: "setup/start";
    readonly CREATE_USER: "setup/create-user";
    readonly IMPORT_DATA: "setup/import-data";
    readonly RESET_SYSTEM: "setup/reset-system";
};
/**
 * Prism broadcast events
 */
export declare const PrismEvents: {
    readonly SETUP_STATUS_UPDATE: "setup-status-update";
};
export type PrismActionType = typeof PrismActions[keyof typeof PrismActions];
/**
 * Prism request message discriminated union
 */
export declare const PrismRequestSchema: z.ZodDiscriminatedUnion<"action", [z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"prism">;
    action: z.ZodLiteral<"setup/get-status">;
    payload: z.ZodOptional<z.ZodUndefined>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/get-status";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/get-status";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"request">;
} & {
    service: z.ZodLiteral<"prism">;
    action: z.ZodLiteral<"setup/reset-system">;
    payload: z.ZodOptional<z.ZodUndefined>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/reset-system";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}, {
    id: string;
    type: "request";
    service: "prism";
    action: "setup/reset-system";
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    payload?: undefined;
}>]>;
export type PrismRequest = z.infer<typeof PrismRequestSchema>;
/**
 * Prism response message discriminated union
 */
export declare const PrismResponseSchema: z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        status: z.ZodString;
        stage: z.ZodNullable<z.ZodString>;
        message: z.ZodString;
        progress: z.ZodNumber;
        error: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }, {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    } | undefined;
    error?: string | undefined;
}, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        status: string;
        message: string;
        timestamp: string;
        stage: string | null;
        progress: number;
        error?: string | undefined;
    } | undefined;
    error?: string | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
    correlationId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"response">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        errors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
    }, {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "response";
    success: boolean;
    timestamp?: number | undefined;
    correlationId?: string | undefined;
    data?: {
        message: string;
        timestamp: string;
        errors?: string[] | undefined;
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
        timestamp: string;
        errors?: string[] | undefined;
    } | undefined;
    error?: string | undefined;
}>]>;
export type PrismResponse = z.infer<typeof PrismResponseSchema>;
export type PrismEventType = typeof PrismEvents[keyof typeof PrismEvents];
//# sourceMappingURL=prism.d.ts.map