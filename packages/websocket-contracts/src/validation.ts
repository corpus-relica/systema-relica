import { z } from 'zod';
import { BaseRequestSchema, BaseResponseSchema, BaseEventSchema } from './base';

/**
 * Simple validation result type
 */
export type ValidationResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Optional validation helpers for development debugging
 * Simplified approach - no complex validation system needed
 */
export const ValidationUtils = {
  /**
   * Validate message against base message schema
   */
  validateBaseMessage(message: unknown): ValidationResult {
    try {
      const schema = z.union([BaseRequestSchema, BaseResponseSchema, BaseEventSchema]);
      const result = schema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          : error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  },

  /**
   * Validate message against a specific Zod schema
   */
  validateWithSchema<T>(schema: z.ZodSchema<T>, message: unknown): ValidationResult<T> {
    try {
      const result = schema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof z.ZodError 
          ? `Schema validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          : error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  },
};

/**
 * Simple debug validator for development
 * Logs validation results to console when enabled
 */
export const createDebugValidator = (enabled = false) => ({
  validateMessage(schema: z.ZodSchema, message: unknown, actionName?: string): ValidationResult {
    const result = ValidationUtils.validateWithSchema(schema, message);
    
    if (enabled) {
      if (result.success) {
        console.log(`✅ Validation passed${actionName ? ` for ${actionName}` : ''}`);
      } else {
        console.error(`❌ Validation failed${actionName ? ` for ${actionName}` : ''}:`, result.error);
      }
    }
    
    return result;
  },
});
