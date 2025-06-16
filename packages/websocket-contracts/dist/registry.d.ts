import { z } from 'zod';
/**
 * Contract definition for a single WebSocket operation
 * Simplified approach: actions ARE the topics
 */
export interface MessageContract<TRequest = any, TResponse = any> {
    /** The action/topic string used by both Portal and Service */
    action: string;
    /** The service that handles this message */
    service: string;
    /** Zod schema for request validation */
    requestSchema: z.ZodSchema<TRequest>;
    /** Zod schema for response validation */
    responseSchema: z.ZodSchema<TResponse>;
    /** Human-readable description */
    description: string;
}
/**
 * Simplified registry for development validation only
 * Actions are now the actual topics - no mapping needed
 */
export declare const MESSAGE_REGISTRY: {
    readonly "setup/get-status": {
        readonly action: "setup/get-status";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"setup/get-status">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "setup/get-status";
        }, {
            service: "prism";
            action: "setup/get-status";
        }>;
        readonly responseSchema: z.ZodObject<{
            success: z.ZodBoolean;
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
            success: boolean;
            data?: {
                status: string;
                message: string;
                timestamp: string;
                stage: string | null;
                progress: number;
                error?: string | undefined;
            } | undefined;
        }, {
            success: boolean;
            data?: {
                status: string;
                message: string;
                timestamp: string;
                stage: string | null;
                progress: number;
                error?: string | undefined;
            } | undefined;
        }>;
        readonly description: "Get current setup status from Prism service";
    };
    readonly "setup/reset-system": {
        readonly action: "setup/reset-system";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"setup/reset-system">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "setup/reset-system";
        }, {
            service: "prism";
            action: "setup/reset-system";
        }>;
        readonly responseSchema: z.ZodObject<{
            success: z.ZodBoolean;
            message: z.ZodOptional<z.ZodString>;
            errors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timestamp: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            message?: string | undefined;
            timestamp?: string | undefined;
            errors?: string[] | undefined;
        }, {
            success: boolean;
            message?: string | undefined;
            timestamp?: string | undefined;
            errors?: string[] | undefined;
        }>;
        readonly description: "Reset system state (clear databases)";
    };
    readonly "setup/start": {
        readonly action: "setup/start";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"setup/start">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "setup/start";
        }, {
            service: "prism";
            action: "setup/start";
        }>;
        readonly responseSchema: z.ZodObject<{
            success: z.ZodBoolean;
            message: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            message?: string | undefined;
        }, {
            success: boolean;
            message?: string | undefined;
        }>;
        readonly description: "Start the setup process";
    };
    readonly "setup/create-user": {
        readonly action: "setup/create-user";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"setup/create-user">;
            payload: z.ZodObject<{
                username: z.ZodString;
                password: z.ZodString;
                confirmPassword: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                username: string;
                password: string;
                confirmPassword: string;
            }, {
                username: string;
                password: string;
                confirmPassword: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "setup/create-user";
            payload: {
                username: string;
                password: string;
                confirmPassword: string;
            };
        }, {
            service: "prism";
            action: "setup/create-user";
            payload: {
                username: string;
                password: string;
                confirmPassword: string;
            };
        }>;
        readonly responseSchema: z.ZodObject<{
            success: z.ZodBoolean;
            data: z.ZodOptional<z.ZodObject<{
                message: z.ZodString;
                user: z.ZodObject<{
                    username: z.ZodString;
                    role: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    username: string;
                    role: string;
                }, {
                    username: string;
                    role: string;
                }>;
            }, "strip", z.ZodTypeAny, {
                message: string;
                user: {
                    username: string;
                    role: string;
                };
            }, {
                message: string;
                user: {
                    username: string;
                    role: string;
                };
            }>>;
            error: z.ZodOptional<z.ZodObject<{
                code: z.ZodString;
                type: z.ZodString;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: string;
                code: string;
                message: string;
            }, {
                type: string;
                code: string;
                message: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            success: boolean;
            data?: {
                message: string;
                user: {
                    username: string;
                    role: string;
                };
            } | undefined;
            error?: {
                type: string;
                code: string;
                message: string;
            } | undefined;
        }, {
            success: boolean;
            data?: {
                message: string;
                user: {
                    username: string;
                    role: string;
                };
            } | undefined;
            error?: {
                type: string;
                code: string;
                message: string;
            } | undefined;
        }>;
        readonly description: "Create admin user during setup";
    };
};
/**
 * Simplified utility functions
 */
export declare const MessageRegistryUtils: {
    /**
     * Get contract by action (mainly for validation)
     */
    getContract(action: string): MessageContract | undefined;
    /**
     * Validate request message against contract
     */
    validateRequest(action: string, message: unknown): {
        success: true;
        data: any;
    } | {
        success: false;
        error: string;
    };
    /**
     * Validate response message against contract
     */
    validateResponse(action: string, message: unknown): {
        success: true;
        data: any;
    } | {
        success: false;
        error: string;
    };
    /**
     * Get all contracts for a specific service
     */
    getServiceContracts(serviceName: string): MessageContract[];
};
//# sourceMappingURL=registry.d.ts.map