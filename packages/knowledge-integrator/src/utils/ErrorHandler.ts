export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx errors, and specific 4xx errors
    return !error.response || 
           error.response.status >= 500 || 
           error.response.status === 408 || // Request Timeout
           error.response.status === 429;   // Too Many Requests
  }
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt or if retry condition fails
      if (attempt > config.maxRetries || !config.retryCondition!(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const finalDelay = Math.max(delay + jitter, 100);

      console.warn(`Operation failed (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${Math.round(finalDelay)}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError;
}

export function isNetworkError(error: any): boolean {
  return !error.response || 
         error.code === 'NETWORK_ERROR' ||
         error.code === 'ECONNREFUSED' ||
         error.code === 'ENOTFOUND' ||
         error.code === 'TIMEOUT';
}

export function isRetryableError(error: any): boolean {
  if (isNetworkError(error)) return true;
  
  const status = error.response?.status;
  return status >= 500 || status === 408 || status === 429;
}

export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

export class SetupError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly originalError: any;

  constructor(message: string, code: string = 'SETUP_ERROR', retryable: boolean = false, originalError?: any) {
    super(message);
    this.name = 'SetupError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
  }

  static fromError(error: any): SetupError {
    const message = getErrorMessage(error);
    const retryable = isRetryableError(error);
    const code = error.response?.status ? `HTTP_${error.response.status}` : 'NETWORK_ERROR';
    
    return new SetupError(message, code, retryable, error);
  }
}