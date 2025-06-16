"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractUtils = exports.devValidator = exports.validator = exports.ContractValidator = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const registry_1 = require("./registry");
/**
 * Development mode validator with detailed error reporting
 */
class ContractValidator {
    constructor(isDevelopment = false) {
        this.isDevelopment = isDevelopment;
    }
    /**
     * Validate any message against base message schema
     */
    validateBaseMessage(message) {
        try {
            const schema = zod_1.z.union([base_1.BaseRequestSchema, base_1.BaseResponseSchema, base_1.BaseEventSchema]);
            const result = schema.parse(message);
            if (this.isDevelopment) {
                console.log('✅ Base message validation passed:', result);
            }
            return { success: true, data: result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                if (this.isDevelopment) {
                    console.error('❌ Base message validation failed:', details);
                }
                return {
                    success: false,
                    error: 'Message validation failed',
                    details
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown validation error'
            };
        }
    }
    /**
     * Validate request message against specific contract
     */
    validateRequest(action, message) {
        // First validate base message structure
        const baseValidation = this.validateBaseMessage(message);
        if (!baseValidation.success) {
            return baseValidation;
        }
        // Then validate against specific contract
        const contractValidation = registry_1.MessageRegistryUtils.validateRequest(action, message);
        if (this.isDevelopment) {
            if (contractValidation.success) {
                console.log(`✅ Contract validation passed for action: ${action}`);
            }
            else {
                console.error(`❌ Contract validation failed for action: ${action}`, contractValidation.error);
            }
        }
        return contractValidation;
    }
    /**
     * Validate response message against specific contract
     */
    validateResponse(action, message) {
        const baseValidation = this.validateBaseMessage(message);
        if (!baseValidation.success) {
            return baseValidation;
        }
        const contractValidation = registry_1.MessageRegistryUtils.validateResponse(action, message);
        if (this.isDevelopment) {
            if (contractValidation.success) {
                console.log(`✅ Response validation passed for action: ${action}`);
            }
            else {
                console.error(`❌ Response validation failed for action: ${action}`, contractValidation.error);
            }
        }
        return contractValidation;
    }
    /**
     * Check if action exists in registry
     */
    isValidAction(action) {
        return action in registry_1.MESSAGE_REGISTRY;
    }
    /**
     * Get topic for action (handles the Portal → Service mapping)
     */
    getTopicForAction(action) {
        if (!this.isValidAction(action)) {
            if (this.isDevelopment) {
                console.warn(`⚠️ Unknown action: ${action}`);
            }
            return null;
        }
        return registry_1.MessageRegistryUtils.getTopic(action);
    }
    /**
     * Get action from topic (reverse lookup for Service → Portal)
     */
    getActionFromTopic(topic) {
        const action = registry_1.MessageRegistryUtils.getActionFromTopic(topic);
        if (!action && this.isDevelopment) {
            console.warn(`⚠️ Unknown topic: ${topic}`);
        }
        return action || null;
    }
}
exports.ContractValidator = ContractValidator;
/**
 * Global validator instances
 */
exports.validator = new ContractValidator(false);
exports.devValidator = new ContractValidator(true);
/**
 * Utility functions for quick validation
 */
exports.ContractUtils = {
    /**
     * Quick validation without creating validator instance
     */
    validate: {
        request: (action, message) => exports.validator.validateRequest(action, message),
        response: (action, message) => exports.validator.validateResponse(action, message),
        baseMessage: (message) => exports.validator.validateBaseMessage(message),
    },
    /**
     * Quick topic/action conversion
     */
    convert: {
        actionToTopic: (action) => exports.validator.getTopicForAction(action),
        topicToAction: (topic) => exports.validator.getActionFromTopic(topic),
    },
    /**
     * Development helpers
     */
    dev: {
        validate: {
            request: (action, message) => exports.devValidator.validateRequest(action, message),
            response: (action, message) => exports.devValidator.validateResponse(action, message),
        },
        convert: {
            actionToTopic: (action) => exports.devValidator.getTopicForAction(action),
            topicToAction: (topic) => exports.devValidator.getActionFromTopic(topic),
        },
    },
};
//# sourceMappingURL=validation.js.map