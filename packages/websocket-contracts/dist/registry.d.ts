import { z } from 'zod';
/**
 * Contract definition for a single WebSocket operation
 */
export interface MessageContract<TRequest = any, TResponse = any> {
    /** The action name used in Portal client messages */
    action: string;
    /** The WebSocket topic/event name used by the receiving service */
    topic: string;
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
 * Central registry of all WebSocket message contracts
 * This solves the Portal action → Service topic mapping problem
 */
export declare const MESSAGE_REGISTRY: {
    readonly "get-setup-status": {
        readonly action: "get-setup-status";
        readonly topic: "setup/get-status";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"get-setup-status">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "get-setup-status";
        }, {
            service: "prism";
            action: "get-setup-status";
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
    readonly "reset-system": {
        readonly action: "reset-system";
        readonly topic: "setup/reset-system";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"reset-system">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "reset-system";
        }, {
            service: "prism";
            action: "reset-system";
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
    readonly "start-setup": {
        readonly action: "start-setup";
        readonly topic: "setup/start";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"start-setup">;
        }, "strip", z.ZodTypeAny, {
            service: "prism";
            action: "start-setup";
        }, {
            service: "prism";
            action: "start-setup";
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
    readonly "create-user": {
        readonly action: "create-user";
        readonly topic: "setup/create-user";
        readonly service: "prism";
        readonly requestSchema: z.ZodObject<{
            service: z.ZodLiteral<"prism">;
            action: z.ZodLiteral<"create-user">;
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
            action: "create-user";
            payload: {
                username: string;
                password: string;
                confirmPassword: string;
            };
        }, {
            service: "prism";
            action: "create-user";
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
 * Type-safe registry access
 */
export type MessageRegistryKey = keyof typeof MESSAGE_REGISTRY;
export type MessageRegistryContract<K extends MessageRegistryKey> = typeof MESSAGE_REGISTRY[K];
/**
 * Utility functions for working with the registry
 */
export declare const MessageRegistryUtils: {
    /**
     * Get contract by action name
     */
    getContract<K extends MessageRegistryKey>(action: K): MessageRegistryContract<K>;
    /**
     * Get WebSocket topic for an action
     */
    getTopic(action: MessageRegistryKey): string;
    /**
     * Get action name from WebSocket topic (reverse lookup)
     */
    getActionFromTopic(topic: string): MessageRegistryKey | undefined;
    /**
     * Validate request message against contract
     */
    validateRequest<K extends MessageRegistryKey>(action: K, message: unknown): {
        success: true;
        data: any;
    } | {
        success: false;
        error: string;
    };
    /**
     * Validate response message against contract
     */
    validateResponse<K extends MessageRegistryKey>(action: K, message: unknown): {
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