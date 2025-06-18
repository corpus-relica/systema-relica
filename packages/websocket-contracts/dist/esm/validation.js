import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema, BaseEventSchema } from './base';
import { MESSAGE_REGISTRY, MessageRegistryUtils } from './registry';
/**
 * Development mode validator with detailed error reporting
 */
export class ContractValidator {
    constructor(isDevelopment = false) {
        this.isDevelopment = isDevelopment;
    }
    /**
     * Validate any message against base message schema
     */
    validateBaseMessage(message) {
        try {
            const schema = z.union([BaseRequestSchema, BaseResponseSchema, BaseEventSchema]);
            const result = schema.parse(message);
            if (this.isDevelopment) {
                console.log('✅ Base message validation passed:', result);
            }
            return { success: true, data: result };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
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
        const contractValidation = MessageRegistryUtils.validateRequest(action, message);
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
        const contractValidation = MessageRegistryUtils.validateResponse(action, message);
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
        return action in MESSAGE_REGISTRY;
    }
    /**
     * Check if action is valid (has a contract)
     */
    hasContract(action) {
        return MessageRegistryUtils.getContract(action) !== undefined;
    }
}
/**
 * Global validator instances
 */
export const validator = new ContractValidator(false);
export const devValidator = new ContractValidator(true);
/**
 * Utility functions for quick validation
 */
export const ContractUtils = {
    /**
     * Quick validation without creating validator instance
     */
    validate: {
        request: (action, message) => validator.validateRequest(action, message),
        response: (action, message) => validator.validateResponse(action, message),
        baseMessage: (message) => validator.validateBaseMessage(message),
    },
    /**
     * Check if action has a contract
     */
    hasContract: (action) => validator.hasContract(action),
    /**
     * Development helpers
     */
    dev: {
        validate: {
            request: (action, message) => devValidator.validateRequest(action, message),
            response: (action, message) => devValidator.validateResponse(action, message),
        },
        hasContract: (action) => devValidator.hasContract(action),
    },
};
//# sourceMappingURL=validation.js.map