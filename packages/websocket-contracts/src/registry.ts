import { z } from 'zod';
import { PrismActions } from './services/prism';

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
export const MESSAGE_REGISTRY = {
  // =====================================================
  // PRISM SERVICE CONTRACTS
  // =====================================================
  
  [PrismActions.GET_SETUP_STATUS]: {
    action: PrismActions.GET_SETUP_STATUS, // 'setup/get-status'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.GET_SETUP_STATUS),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        status: z.string(),
        stage: z.string().nullable(),
        message: z.string(),
        progress: z.number(),
        error: z.string().optional(),
        timestamp: z.string(),
      }).optional(),
    }),
    description: 'Get current setup status from Prism service',
  },

  [PrismActions.RESET_SYSTEM]: {
    action: PrismActions.RESET_SYSTEM, // 'setup/reset-system'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.RESET_SYSTEM),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      errors: z.array(z.string()).optional(),
      timestamp: z.string().optional(),
    }),
    description: 'Reset system state (clear databases)',
  },

  [PrismActions.START_SETUP]: {
    action: PrismActions.START_SETUP, // 'setup/start'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.START_SETUP),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
    }),
    description: 'Start the setup process',
  },

  [PrismActions.CREATE_USER]: {
    action: PrismActions.CREATE_USER, // 'setup/create-user'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.CREATE_USER),
      payload: z.object({
        username: z.string(),
        password: z.string(),
        confirmPassword: z.string(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        message: z.string(),
        user: z.object({
          username: z.string(),
          role: z.string(),
        }),
      }).optional(),
      error: z.object({
        code: z.string(),
        type: z.string(),
        message: z.string(),
      }).optional(),
    }),
    description: 'Create admin user during setup',
  },

  // Add more service contracts here...
  
} as const satisfies Record<string, MessageContract>;

/**
 * Simplified utility functions
 */
export const MessageRegistryUtils = {
  /**
   * Get contract by action (mainly for validation)
   */
  getContract(action: string): MessageContract | undefined {
    return MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
  },

  /**
   * Validate request message against contract
   */
  validateRequest(action: string, message: unknown): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
      if (!contract) {
        return { success: false, error: `Unknown action: ${action}` };
      }
      const result = contract.requestSchema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  },

  /**
   * Validate response message against contract
   */
  validateResponse(action: string, message: unknown): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
      if (!contract) {
        return { success: false, error: `Unknown action: ${action}` };
      }
      const result = contract.responseSchema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  },

  /**
   * Get all contracts for a specific service
   */
  getServiceContracts(serviceName: string): MessageContract[] {
    return Object.values(MESSAGE_REGISTRY).filter(
      contract => contract.service === serviceName
    );
  },
};