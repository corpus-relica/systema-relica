/**
 * Contract validation result
 */
export type ValidationResult<T = any> = {
    success: true;
    data: T;
    warnings?: string[];
} | {
    success: false;
    error: string;
    details?: any;
};
/**
 * Development mode validator with detailed error reporting
 */
export declare class ContractValidator {
    private isDevelopment;
    constructor(isDevelopment?: boolean);
    /**
     * Validate any message against base message schema
     */
    validateBaseMessage(message: unknown): ValidationResult;
    /**
     * Validate request message against specific contract
     */
    validateRequest(action: string, message: unknown): ValidationResult;
    /**
     * Validate response message against specific contract
     */
    validateResponse(action: string, message: unknown): ValidationResult;
    /**
     * Check if action exists in registry
     */
    isValidAction(action: string): boolean;
    /**
     * Get topic for action (handles the Portal → Service mapping)
     */
    getTopicForAction(action: string): string | null;
    /**
     * Get action from topic (reverse lookup for Service → Portal)
     */
    getActionFromTopic(topic: string): string | null;
}
/**
 * Global validator instances
 */
export declare const validator: ContractValidator;
export declare const devValidator: ContractValidator;
/**
 * Utility functions for quick validation
 */
export declare const ContractUtils: {
    /**
     * Quick validation without creating validator instance
     */
    validate: {
        request: (action: string, message: unknown) => ValidationResult<any>;
        response: (action: string, message: unknown) => ValidationResult<any>;
        baseMessage: (message: unknown) => ValidationResult<any>;
    };
    /**
     * Quick topic/action conversion
     */
    convert: {
        actionToTopic: (action: string) => string | null;
        topicToAction: (topic: string) => string | null;
    };
    /**
     * Development helpers
     */
    dev: {
        validate: {
            request: (action: string, message: unknown) => ValidationResult<any>;
            response: (action: string, message: unknown) => ValidationResult<any>;
        };
        convert: {
            actionToTopic: (action: string) => string | null;
            topicToAction: (topic: string) => string | null;
        };
    };
};
//# sourceMappingURL=validation.d.ts.map