import { z } from 'zod';
import { PrismActions } from './services/prism';

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
export const MESSAGE_REGISTRY = {
  // =====================================================
  // PRISM SERVICE CONTRACTS
  // =====================================================
  
  [PrismActions.GET_SETUP_STATUS]: {
    action: PrismActions.GET_SETUP_STATUS,
    topic: 'setup/get-status',
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
    action: PrismActions.RESET_SYSTEM,
    topic: 'setup/reset-system',
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
    action: PrismActions.START_SETUP,
    topic: 'setup/start',
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
    action: PrismActions.CREATE_USER,
    topic: 'setup/create-user',
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
  // [ArchivistActions.SEARCH]: { ... },
  // [ClarityActions.MODEL]: { ... },
  
} as const satisfies Record<string, MessageContract>;

/**
 * Type-safe registry access
 */
export type MessageRegistryKey = keyof typeof MESSAGE_REGISTRY;
export type MessageRegistryContract<K extends MessageRegistryKey> = typeof MESSAGE_REGISTRY[K];

/**
 * Utility functions for working with the registry
 */
export const MessageRegistryUtils = {
  /**
   * Get contract by action name
   */
  getContract<K extends MessageRegistryKey>(action: K): MessageRegistryContract<K> {
    return MESSAGE_REGISTRY[action];
  },

  /**
   * Get WebSocket topic for an action
   */
  getTopic(action: MessageRegistryKey): string {
    return MESSAGE_REGISTRY[action].topic;
  },

  /**
   * Get action name from WebSocket topic (reverse lookup)
   */
  getActionFromTopic(topic: string): MessageRegistryKey | undefined {
    return Object.keys(MESSAGE_REGISTRY).find(
      action => MESSAGE_REGISTRY[action as MessageRegistryKey].topic === topic
    ) as MessageRegistryKey | undefined;
  },

  /**
   * Validate request message against contract
   */
  validateRequest<K extends MessageRegistryKey>(
    action: K,
    message: unknown
  ): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action];
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
  validateResponse<K extends MessageRegistryKey>(
    action: K,
    message: unknown
  ): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action];
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