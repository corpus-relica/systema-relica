"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRegistryUtils = exports.MESSAGE_REGISTRY = void 0;
const zod_1 = require("zod");
const prism_1 = require("./services/prism");
/**
 * Central registry of all WebSocket message contracts
 * This solves the Portal action → Service topic mapping problem
 */
exports.MESSAGE_REGISTRY = {
    // =====================================================
    // PRISM SERVICE CONTRACTS
    // =====================================================
    [prism_1.PrismActions.GET_SETUP_STATUS]: {
        action: prism_1.PrismActions.GET_SETUP_STATUS,
        topic: 'setup/get-status',
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.GET_SETUP_STATUS),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            data: zod_1.z.object({
                status: zod_1.z.string(),
                stage: zod_1.z.string().nullable(),
                message: zod_1.z.string(),
                progress: zod_1.z.number(),
                error: zod_1.z.string().optional(),
                timestamp: zod_1.z.string(),
            }).optional(),
        }),
        description: 'Get current setup status from Prism service',
    },
    [prism_1.PrismActions.RESET_SYSTEM]: {
        action: prism_1.PrismActions.RESET_SYSTEM,
        topic: 'setup/reset-system',
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.RESET_SYSTEM),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            message: zod_1.z.string().optional(),
            errors: zod_1.z.array(zod_1.z.string()).optional(),
            timestamp: zod_1.z.string().optional(),
        }),
        description: 'Reset system state (clear databases)',
    },
    [prism_1.PrismActions.START_SETUP]: {
        action: prism_1.PrismActions.START_SETUP,
        topic: 'setup/start',
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.START_SETUP),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            message: zod_1.z.string().optional(),
        }),
        description: 'Start the setup process',
    },
    [prism_1.PrismActions.CREATE_USER]: {
        action: prism_1.PrismActions.CREATE_USER,
        topic: 'setup/create-user',
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.CREATE_USER),
            payload: zod_1.z.object({
                username: zod_1.z.string(),
                password: zod_1.z.string(),
                confirmPassword: zod_1.z.string(),
            }),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            data: zod_1.z.object({
                message: zod_1.z.string(),
                user: zod_1.z.object({
                    username: zod_1.z.string(),
                    role: zod_1.z.string(),
                }),
            }).optional(),
            error: zod_1.z.object({
                code: zod_1.z.string(),
                type: zod_1.z.string(),
                message: zod_1.z.string(),
            }).optional(),
        }),
        description: 'Create admin user during setup',
    },
    // Add more service contracts here...
    // [ArchivistActions.SEARCH]: { ... },
    // [ClarityActions.MODEL]: { ... },
};
/**
 * Utility functions for working with the registry
 */
exports.MessageRegistryUtils = {
    /**
     * Get contract by action name
     */
    getContract(action) {
        return exports.MESSAGE_REGISTRY[action];
    },
    /**
     * Get WebSocket topic for an action
     */
    getTopic(action) {
        return exports.MESSAGE_REGISTRY[action].topic;
    },
    /**
     * Get action name from WebSocket topic (reverse lookup)
     */
    getActionFromTopic(topic) {
        return Object.keys(exports.MESSAGE_REGISTRY).find(action => exports.MESSAGE_REGISTRY[action].topic === topic);
    },
    /**
     * Validate request message against contract
     */
    validateRequest(action, message) {
        try {
            const contract = exports.MESSAGE_REGISTRY[action];
            const result = contract.requestSchema.parse(message);
            return { success: true, data: result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    },
    /**
     * Validate response message against contract
     */
    validateResponse(action, message) {
        try {
            const contract = exports.MESSAGE_REGISTRY[action];
            const result = contract.responseSchema.parse(message);
            return { success: true, data: result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    },
    /**
     * Get all contracts for a specific service
     */
    getServiceContracts(serviceName) {
        return Object.values(exports.MESSAGE_REGISTRY).filter(contract => contract.service === serviceName);
    },
};
//# sourceMappingURL=registry.js.map