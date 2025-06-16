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
     * Check if action is valid (has a contract)
     */
    hasContract(action: string): boolean;
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
     * Check if action has a contract
     */
    hasContract: (action: string) => boolean;
    /**
     * Development helpers
     */
    dev: {
        validate: {
            request: (action: string, message: unknown) => ValidationResult<any>;
            response: (action: string, message: unknown) => ValidationResult<any>;
        };
        hasContract: (action: string) => boolean;
    };
};
//# sourceMappingURL=validation.d.ts.map