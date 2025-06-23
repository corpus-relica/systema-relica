import { v4 as uuidv4 } from 'uuid';
import { BaseResponse } from '@relica/websocket-contracts';

/**
 * Simple utilities for creating contract-compliant WebSocket responses
 */

/**
 * Creates a successful BaseResponse
 */
export function toResponse(data: any, correlationId?: string): BaseResponse {
  return {
    id: uuidv4(),
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
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    id: uuidv4(),
    type: 'response',
    success: false,
    error: errorMessage,
    correlationId,
    timestamp: Date.now()
  };
}