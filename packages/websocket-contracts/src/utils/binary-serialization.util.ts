import { pack, unpack } from 'msgpackr';

/**
 * Centralized binary serialization utilities for WebSocket communication.
 * 
 * This module provides consistent binary encoding/decoding across all services
 * using MessagePack for optimal performance and bandwidth reduction.
 */

/**
 * Encodes a payload using binary serialization (MessagePack).
 * Used by WebSocket clients for outgoing request payloads.
 * 
 * @param payload - The payload to encode
 * @returns Object with 'data' property containing the serialized payload as byte array, or original payload if encoding fails
 */
export function encodePayload(payload: any): any {
  if (!payload) return payload;
  
  try {
    const packed = pack(payload);
    return { data: Array.from(packed) };
  } catch (error) {
    console.warn(`Failed to encode payload, sending as JSON:`, error);
    return payload;
  }
}

/**
 * Decodes a binary payload from WebSocket response.
 * Used by WebSocket clients for incoming response payloads.
 * 
 * @param payload - The binary payload to decode  
 * @returns The decoded payload object, or original payload if decoding fails
 */
export function decodePayload(payload: any): any {
  // If it's not a binary payload structure, return as-is
  if (!payload || !payload.data || !Array.isArray(payload.data)) {
    return payload;
  }
  
  try {
    const buffer = new Uint8Array(payload.data);
    return unpack(buffer);
  } catch (error) {
    console.warn(`Failed to decode binary payload, returning as-is:`, error);
    return payload;
  }
}

/**
 * Decodes a request message from WebSocket.
 * Used by gateways for incoming request messages.
 * Handles both binary and non-binary message formats.
 * 
 * @param message - The message object containing the payload
 * @returns The message with decoded payload
 */
export function decodeRequest(message: any): any {
  if (!message) return message;
  
  const { payload } = message;
  if (!payload || !payload.data || !Array.isArray(payload.data)) {
    return message;
  }
  
  try {
    const buffer = new Uint8Array(payload.data);
    const decodedPayload = unpack(buffer);
    return { ...message, payload: decodedPayload };
  } catch (error) {
    console.warn(`Failed to decode binary request payload, returning as-is:`, error);
    return message;
  }
}

/**
 * Internal function to encode response data for WebSocket transmission.
 * This is used internally by toResponse and toErrorResponse functions.
 * 
 * @param data - The response data to encode
 * @returns The encoded response ready for WebSocket transmission
 */
export function _encodeResponseData(data: any): any {
  if (!data) return data;
  
  try {
    const packed = pack(data);
    return { data: Array.from(packed) };
  } catch (error) {
    console.warn(`Failed to encode response, sending as JSON:`, error);
    return data;
  }
}

/**
 * Configuration and constants for binary serialization
 */
export const BinarySerializationConfig = {
  // Enable/disable binary serialization (for debugging)
  enabled: true,
  
  // Maximum payload size for binary encoding (in bytes)
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Type guard to check if a response contains binary data
 */
export function isBinaryResponse(response: any): boolean {
  return response && 
         response.data && 
         Array.isArray(response.data) && 
         response.data.length > 0 &&
         typeof response.data[0] === 'number';
}