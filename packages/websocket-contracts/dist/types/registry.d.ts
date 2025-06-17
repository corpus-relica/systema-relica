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
    readonly "fact:create": {
        readonly action: "fact:create";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Create a new fact in the knowledge graph";
    };
    readonly "fact:update": {
        readonly action: "fact:update";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Update an existing fact";
    };
    readonly "fact:delete": {
        readonly action: "fact:delete";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Delete a fact from the knowledge graph";
    };
    readonly "fact:get": {
        readonly action: "fact:get";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get facts about a specific kind/entity";
    };
    readonly "fact:getSubtypes": {
        readonly action: "fact:getSubtypes";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get subtypes of a specific kind";
    };
    readonly "fact:getSupertypes": {
        readonly action: "fact:getSupertypes";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get supertypes of a specific kind";
    };
    readonly "fact:getClassified": {
        readonly action: "fact:getClassified";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get classified facts for a specific entity";
    };
    readonly "fact:validate": {
        readonly action: "fact:validate";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Validate a fact before creation";
    };
    readonly "search:general": {
        readonly action: "search:general";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"search:general">;
            payload: z.ZodObject<{
                query: z.ZodString;
                page: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodOptional<z.ZodNumber>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:general";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:general";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Perform general text search across all entities";
    };
    readonly "search:individual": {
        readonly action: "search:individual";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"search:individual">;
            payload: z.ZodObject<{
                query: z.ZodString;
                page: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodOptional<z.ZodNumber>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:individual";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:individual";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Search for individual entities";
    };
    readonly "search:kind": {
        readonly action: "search:kind";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"search:kind">;
            payload: z.ZodObject<{
                query: z.ZodString;
                page: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodOptional<z.ZodNumber>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:kind";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:kind";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Search for kinds/types";
    };
    readonly "search:execute": {
        readonly action: "search:execute";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"search:execute">;
            payload: z.ZodObject<{
                query: z.ZodString;
                page: z.ZodOptional<z.ZodNumber>;
                limit: z.ZodOptional<z.ZodNumber>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }, {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:execute";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:execute";
            payload: {
                query: string;
                page?: number | undefined;
                limit?: number | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Execute a complex search query";
    };
    readonly "search:uid": {
        readonly action: "search:uid";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"search:uid">;
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
            action: "search:uid";
            payload: {
                uid: number;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "search:uid";
            payload: {
                uid: number;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Search by specific UID";
    };
    readonly "concept:get": {
        readonly action: "concept:get";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get a concept by UID";
    };
    readonly "concept:create": {
        readonly action: "concept:create";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Create a new concept";
    };
    readonly "concept:update": {
        readonly action: "concept:update";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Update an existing concept";
    };
    readonly "concept:delete": {
        readonly action: "concept:delete";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Delete a concept";
    };
    readonly "query:execute": {
        readonly action: "query:execute";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"query:execute">;
            payload: z.ZodObject<{
                query: z.ZodString;
                parameters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                parameters?: any;
            }, {
                query: string;
                parameters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:execute";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:execute";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Execute a database query";
    };
    readonly "query:validate": {
        readonly action: "query:validate";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"query:validate">;
            payload: z.ZodObject<{
                query: z.ZodString;
                parameters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                parameters?: any;
            }, {
                query: string;
                parameters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:validate";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:validate";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Validate a query before execution";
    };
    readonly "query:parse": {
        readonly action: "query:parse";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"query:parse">;
            payload: z.ZodObject<{
                query: z.ZodString;
                parameters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                parameters?: any;
            }, {
                query: string;
                parameters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:parse";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "query:parse";
            payload: {
                query: string;
                parameters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"response">;
            success: z.ZodBoolean;
            error: z.ZodOptional<z.ZodString>;
        } & {
            data: z.ZodOptional<z.ZodObject<{
                parsed: z.ZodNullable<z.ZodAny>;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
                parsed?: any;
            }, {
                message: string;
                parsed?: any;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "response";
            success: boolean;
            timestamp?: number | undefined;
            correlationId?: string | undefined;
            data?: {
                message: string;
                parsed?: any;
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
                parsed?: any;
            } | undefined;
            error?: string | undefined;
        }>;
        readonly description: "Parse a query string";
    };
    readonly "kind:get": {
        readonly action: "kind:get";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"kind:get">;
            payload: z.ZodObject<{
                uid: z.ZodOptional<z.ZodNumber>;
                query: z.ZodOptional<z.ZodString>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kind:get";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kind:get";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get a specific kind by UID";
    };
    readonly "kinds:list": {
        readonly action: "kinds:list";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"kinds:list">;
            payload: z.ZodObject<{
                uid: z.ZodOptional<z.ZodNumber>;
                query: z.ZodOptional<z.ZodString>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kinds:list";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kinds:list";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "List all kinds with pagination";
    };
    readonly "kinds:search": {
        readonly action: "kinds:search";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"kinds:search">;
            payload: z.ZodObject<{
                uid: z.ZodOptional<z.ZodNumber>;
                query: z.ZodOptional<z.ZodString>;
                filters: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }, {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kinds:search";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "kinds:search";
            payload: {
                uid?: number | undefined;
                query?: string | undefined;
                filters?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Search for kinds by query";
    };
    readonly "uid:generate": {
        readonly action: "uid:generate";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"uid:generate">;
            payload: z.ZodObject<{
                count: z.ZodOptional<z.ZodNumber>;
                type: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type?: string | undefined;
                count?: number | undefined;
            }, {
                type?: string | undefined;
                count?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:generate";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:generate";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Generate a single unique identifier";
    };
    readonly "uid:batch": {
        readonly action: "uid:batch";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"uid:batch">;
            payload: z.ZodObject<{
                count: z.ZodOptional<z.ZodNumber>;
                type: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type?: string | undefined;
                count?: number | undefined;
            }, {
                type?: string | undefined;
                count?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:batch";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:batch";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Generate multiple unique identifiers";
    };
    readonly "uid:reserve": {
        readonly action: "uid:reserve";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"uid:reserve">;
            payload: z.ZodObject<{
                count: z.ZodOptional<z.ZodNumber>;
                type: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type?: string | undefined;
                count?: number | undefined;
            }, {
                type?: string | undefined;
                count?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:reserve";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "uid:reserve";
            payload: {
                type?: string | undefined;
                count?: number | undefined;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Reserve a range of unique identifiers";
    };
    readonly "completion:request": {
        readonly action: "completion:request";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"completion:request">;
            payload: z.ZodObject<{
                query: z.ZodString;
                context: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                context?: any;
            }, {
                query: string;
                context?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:request";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:request";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get text completion suggestions";
    };
    readonly "completion:entities": {
        readonly action: "completion:entities";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"completion:entities">;
            payload: z.ZodObject<{
                query: z.ZodString;
                context: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                context?: any;
            }, {
                query: string;
                context?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:entities";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:entities";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get entity completion suggestions";
    };
    readonly "completion:relations": {
        readonly action: "completion:relations";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
            id: z.ZodString;
            timestamp: z.ZodOptional<z.ZodNumber>;
            correlationId: z.ZodOptional<z.ZodString>;
            type: z.ZodLiteral<"request">;
        } & {
            service: z.ZodLiteral<"archivist">;
            action: z.ZodLiteral<"completion:relations">;
            payload: z.ZodObject<{
                query: z.ZodString;
                context: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                context?: any;
            }, {
                query: string;
                context?: any;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:relations";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }, {
            id: string;
            type: "request";
            service: "archivist";
            action: "completion:relations";
            payload: {
                query: string;
                context?: any;
            };
            timestamp?: number | undefined;
            correlationId?: string | undefined;
        }>;
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get relation completion suggestions";
    };
    readonly "definition:get": {
        readonly action: "definition:get";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get definition for an entity";
    };
    readonly "definition:update": {
        readonly action: "definition:update";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Update definition for an entity";
    };
    readonly "submission:submit": {
        readonly action: "submission:submit";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Submit facts to the knowledge graph";
    };
    readonly "submission:batch": {
        readonly action: "submission:batch";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Submit multiple facts in batch";
    };
    readonly "transaction:start": {
        readonly action: "transaction:start";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Start a new transaction";
    };
    readonly "transaction:commit": {
        readonly action: "transaction:commit";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Commit a transaction";
    };
    readonly "transaction:rollback": {
        readonly action: "transaction:rollback";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Rollback a transaction";
    };
    readonly "transaction:get": {
        readonly action: "transaction:get";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Get transaction status";
    };
    readonly "validation:validate": {
        readonly action: "validation:validate";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Validate a single fact";
    };
    readonly "validation:collection": {
        readonly action: "validation:collection";
        readonly service: "archivist";
        readonly requestSchema: z.ZodObject<{
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
        readonly responseSchema: z.ZodObject<{
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
        readonly description: "Validate a collection of facts";
    };
    readonly "aperture.environment/get": {
        readonly action: "aperture.environment/get";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Get a user environment by ID or default";
    };
    readonly "aperture.environment/list": {
        readonly action: "aperture.environment/list";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
        }, {
            'user-id': number;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "List all environments for a user";
    };
    readonly "aperture.environment/create": {
        readonly action: "aperture.environment/create";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            name: string;
        }, {
            'user-id': number;
            name: string;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Create a new environment for a user";
    };
    readonly "aperture.environment/clear": {
        readonly action: "aperture.environment/clear";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Clear all facts from an environment";
    };
    readonly "aperture.search/load-text": {
        readonly action: "aperture.search/load-text";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            term: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            term: string;
        }, {
            'user-id': number;
            term: string;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load facts into environment based on text search";
    };
    readonly "aperture.search/load-uid": {
        readonly action: "aperture.search/load-uid";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            uid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uid: number;
            'user-id': number;
        }, {
            uid: number;
            'user-id': number;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load facts into environment based on UID search";
    };
    readonly "aperture.specialization/load-fact": {
        readonly action: "aperture.specialization/load-fact";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            uid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load specialization fact for an entity";
    };
    readonly "aperture.specialization/load": {
        readonly action: "aperture.specialization/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            uid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load specialization hierarchy for an entity";
    };
    readonly "aperture.entity/load": {
        readonly action: "aperture.entity/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load an entity and its facts into environment";
    };
    readonly "aperture.entity/unload": {
        readonly action: "aperture.entity/unload";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Unload an entity and its facts from environment";
    };
    readonly "aperture.entity/select": {
        readonly action: "aperture.entity/select";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Select an entity in the environment";
    };
    readonly "aperture.entity/deselect": {
        readonly action: "aperture.entity/deselect";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Deselect the current entity in environment";
    };
    readonly "aperture.entity/load-multiple": {
        readonly action: "aperture.entity/load-multiple";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uids': z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uids': number[];
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uids': number[];
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load multiple entities and their facts into environment";
    };
    readonly "aperture.entity/unload-multiple": {
        readonly action: "aperture.entity/unload-multiple";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uids': z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uids': number[];
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uids': number[];
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Unload multiple entities and their facts from environment";
    };
    readonly "aperture.subtype/load": {
        readonly action: "aperture.subtype/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load subtype facts for an entity";
    };
    readonly "aperture.subtype/load-cone": {
        readonly action: "aperture.subtype/load-cone";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load complete subtype hierarchy cone for an entity";
    };
    readonly "aperture.subtype/unload-cone": {
        readonly action: "aperture.subtype/unload-cone";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Unload complete subtype hierarchy cone for an entity";
    };
    readonly "aperture.classification/load": {
        readonly action: "aperture.classification/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load classification facts for an entity";
    };
    readonly "aperture.classification/load-fact": {
        readonly action: "aperture.classification/load-fact";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load classification fact for an entity";
    };
    readonly "aperture.composition/load": {
        readonly action: "aperture.composition/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load composition relationships for an entity";
    };
    readonly "aperture.composition/load-in": {
        readonly action: "aperture.composition/load-in";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load incoming composition relationships for an entity";
    };
    readonly "aperture.connection/load": {
        readonly action: "aperture.connection/load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load connection relationships for an entity";
    };
    readonly "aperture.connection/load-in": {
        readonly action: "aperture.connection/load-in";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            'entity-uid': z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }, {
            'user-id': number;
            'entity-uid': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load incoming connection relationships for an entity";
    };
    readonly "aperture.relation/required-roles-load": {
        readonly action: "aperture.relation/required-roles-load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            uid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load required roles for a relation type";
    };
    readonly "aperture.relation/role-players-load": {
        readonly action: "aperture.relation/role-players-load";
        readonly service: "aperture";
        readonly requestSchema: z.ZodObject<{
            'user-id': z.ZodNumber;
        } & {
            'environment-id': z.ZodOptional<z.ZodNumber>;
        } & {
            uid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }, {
            uid: number;
            'user-id': number;
            'environment-id'?: number | undefined;
        }>;
        readonly responseSchema: z.ZodUnion<[z.ZodObject<{
            success: z.ZodLiteral<true>;
            environment: z.ZodOptional<z.ZodObject<{
                id: z.ZodNumber;
                user_id: z.ZodNumber;
                name: z.ZodString;
                facts: z.ZodArray<z.ZodObject<{
                    fact_uid: z.ZodNumber;
                    lh_object_uid: z.ZodNumber;
                    lh_object_name: z.ZodString;
                    rel_type_uid: z.ZodNumber;
                    rel_type_name: z.ZodString;
                    rh_object_uid: z.ZodNumber;
                    rh_object_name: z.ZodString;
                    full_definition: z.ZodOptional<z.ZodString>;
                    uom_uid: z.ZodOptional<z.ZodNumber>;
                    uom_name: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }, {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }>, "many">;
                selected_entity_id: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }, {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            }>>;
            facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fact_uid: z.ZodNumber;
                lh_object_uid: z.ZodNumber;
                lh_object_name: z.ZodString;
                rel_type_uid: z.ZodNumber;
                rel_type_name: z.ZodString;
                rh_object_uid: z.ZodNumber;
                rh_object_name: z.ZodString;
                full_definition: z.ZodOptional<z.ZodString>;
                uom_uid: z.ZodOptional<z.ZodNumber>;
                uom_name: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }, {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }>, "many">>;
            'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        }, "strip", z.ZodTypeAny, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }, {
            success: true;
            facts?: {
                lh_object_uid: number;
                rh_object_uid: number;
                rel_type_uid: number;
                fact_uid: number;
                lh_object_name: string;
                rel_type_name: string;
                rh_object_name: string;
                full_definition?: string | undefined;
                uom_uid?: number | undefined;
                uom_name?: string | undefined;
            }[] | undefined;
            environment?: {
                id: number;
                facts: {
                    lh_object_uid: number;
                    rh_object_uid: number;
                    rel_type_uid: number;
                    fact_uid: number;
                    lh_object_name: string;
                    rel_type_name: string;
                    rh_object_name: string;
                    full_definition?: string | undefined;
                    uom_uid?: number | undefined;
                    uom_name?: string | undefined;
                }[];
                name: string;
                user_id: number;
                selected_entity_id?: number | undefined;
            } | undefined;
            'fact-uids-removed'?: number[] | undefined;
            'model-uids-removed'?: number[] | undefined;
        }>, z.ZodObject<{
            success: z.ZodLiteral<false>;
            error: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            success: false;
            error: string;
        }, {
            success: false;
            error: string;
        }>]>;
        readonly description: "Load role players for a relation type";
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