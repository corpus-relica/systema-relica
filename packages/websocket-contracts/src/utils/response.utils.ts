import { BaseResponse } from '../base';
import { _encodeResponseData } from './binary-serialization.util';

/**
 * Cross-platform UUID generation
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  
  // Use Node.js crypto module if available
  if (typeof require !== 'undefined') {
    try {
      const { randomUUID } = require('crypto');
      return randomUUID();
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback to manual UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Simple utilities for creating contract-compliant WebSocket responses
 */

/**
 * Creates a successful BaseResponse with automatic binary encoding
 */
export function toResponse(data: any, correlationId?: string): any {
  const response: BaseResponse = {
    id: generateUUID(),
    type: 'response',
    success: true,
    data,
    correlationId,
    timestamp: Date.now()
  };
  
  // Automatically encode the entire response for binary transmission
  return _encodeResponseData(response);
}

/**
 * Creates an error BaseResponse with automatic binary encoding
 */
export function toErrorResponse(error: Error | string, correlationId?: string): any {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const response: BaseResponse = {
    id: generateUUID(),
    type: 'response',
    success: false,
    error: errorMessage,
    correlationId,
    timestamp: Date.now()
  };
  
  // Automatically encode the entire response for binary transmission
  return _encodeResponseData(response);
}