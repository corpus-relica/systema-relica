import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema, BaseEventSchema } from './base';
import { MESSAGE_REGISTRY, MessageRegistryUtils } from './registry';

/**
 * Contract validation result
 */
export type ValidationResult<T = any> = 
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: string; details?: any };

/**
 * Development mode validator with detailed error reporting
 */
export class ContractValidator {
  private isDevelopment: boolean;

  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
  }

  /**
   * Validate any message against base message schema
   */
  validateBaseMessage(message: unknown): ValidationResult {
    try {
      const schema = z.union([BaseRequestSchema, BaseResponseSchema, BaseEventSchema]);
      const result = schema.parse(message);
      
      if (this.isDevelopment) {
        console.log('✅ Base message validation passed:', result);
      }
      
      return { success: true, data: result };
    } catch (error) {
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
  validateRequest(action: string, message: unknown): ValidationResult {
    // First validate base message structure
    const baseValidation = this.validateBaseMessage(message);
    if (!baseValidation.success) {
      return baseValidation;
    }

    // Then validate against specific contract
    const contractValidation = MessageRegistryUtils.validateRequest(action as any, message);
    
    if (this.isDevelopment) {
      if (contractValidation.success) {
        console.log(`✅ Contract validation passed for action: ${action}`);
      } else {
        console.error(`❌ Contract validation failed for action: ${action}`, contractValidation.error);
      }
    }

    return contractValidation;
  }

  /**
   * Validate response message against specific contract
   */
  validateResponse(action: string, message: unknown): ValidationResult {
    const baseValidation = this.validateBaseMessage(message);
    if (!baseValidation.success) {
      return baseValidation;
    }

    const contractValidation = MessageRegistryUtils.validateResponse(action as any, message);
    
    if (this.isDevelopment) {
      if (contractValidation.success) {
        console.log(`✅ Response validation passed for action: ${action}`);
      } else {
        console.error(`❌ Response validation failed for action: ${action}`, contractValidation.error);
      }
    }

    return contractValidation;
  }

  /**
   * Check if action exists in registry
   */
  isValidAction(action: string): boolean {
    return action in MESSAGE_REGISTRY;
  }

  /**
   * Get topic for action (handles the Portal → Service mapping)
   */
  getTopicForAction(action: string): string | null {
    if (!this.isValidAction(action)) {
      if (this.isDevelopment) {
        console.warn(`⚠️ Unknown action: ${action}`);
      }
      return null;
    }
    
    return MessageRegistryUtils.getTopic(action as any);
  }

  /**
   * Get action from topic (reverse lookup for Service → Portal)
   */
  getActionFromTopic(topic: string): string | null {
    const action = MessageRegistryUtils.getActionFromTopic(topic);
    
    if (!action && this.isDevelopment) {
      console.warn(`⚠️ Unknown topic: ${topic}`);
    }
    
    return action || null;
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
    request: (action: string, message: unknown) => validator.validateRequest(action, message),
    response: (action: string, message: unknown) => validator.validateResponse(action, message),
    baseMessage: (message: unknown) => validator.validateBaseMessage(message),
  },

  /**
   * Quick topic/action conversion
   */
  convert: {
    actionToTopic: (action: string) => validator.getTopicForAction(action),
    topicToAction: (topic: string) => validator.getActionFromTopic(topic),
  },

  /**
   * Development helpers
   */
  dev: {
    validate: {
      request: (action: string, message: unknown) => devValidator.validateRequest(action, message),
      response: (action: string, message: unknown) => devValidator.validateResponse(action, message),
    },
    convert: {
      actionToTopic: (action: string) => devValidator.getTopicForAction(action),
      topicToAction: (topic: string) => devValidator.getActionFromTopic(topic),
    },
  },
};