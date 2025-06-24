import { randomUUID } from 'crypto';
import { BaseResponse } from '../base';

/**
 * Simple utilities for creating contract-compliant WebSocket responses
 */

/**
 * Creates a successful BaseResponse
 */
export function toResponse(data: any, correlationId?: string): BaseResponse {
  return {
    id: randomUUID(),
    type: 'response',
    success: true,
    data,
    correlationId,
    timestamp: Date.now()
  };
}

/**
 * Creates an error BaseResponse
 */
export function toErrorResponse(error: Error | string, correlationId?: string): BaseResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return {
    id: randomUUID(),
    type: 'response',
    success: false,
    error: errorMessage,
    correlationId,
    timestamp: Date.now()
  };
}