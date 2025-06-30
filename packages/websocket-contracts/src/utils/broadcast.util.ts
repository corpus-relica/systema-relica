import { _encodeResponseData } from './binary-serialization.util';
import { Server, Socket } from 'socket.io';

/**
 * Centralized broadcasting utilities for WebSocket communication.
 * 
 * This module provides consistent broadcasting across all services with proper
 * binary encoding for backend services and JSON for frontend communication.
 */

/**
 * Creates a binary-encoded broadcast event for backend service-to-service communication.
 * Uses the existing binary serialization infrastructure for performance.
 * 
 * @param type - Event type identifier
 * @param data - Event payload data
 * @returns Binary-encoded broadcast event
 */
export function toBinaryBroadcastEvent(type: string, data: any): any {
  const event = {
    type,
    data,
    timestamp: Date.now(),
    source: 'backend'
  };
  return _encodeResponseData(event);
}

/**
 * Creates a JSON broadcast event for Portal-to-frontend communication.
 * No binary encoding to maintain browser compatibility.
 * 
 * @param type - Event type identifier  
 * @param data - Event payload data
 * @returns Plain JSON broadcast event
 */
export function toJsonBroadcastEvent(type: string, data: any): any {
  return {
    type,
    data,
    timestamp: Date.now(),
    source: 'portal'
  };
}

/**
 * Broadcasts a binary-encoded event to all connected clients on a server.
 * For backend service global broadcasts.
 * 
 * @param server - Socket.IO server instance
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 */
export function createServiceBroadcast(server: Server, eventType: string, data: any): void {
  const event = toBinaryBroadcastEvent(eventType, data);
  server.emit(eventType, event);
}

/**
 * Broadcasts a binary-encoded event to specific connected clients.
 * For backend service targeted broadcasts.
 * 
 * @param clients - Array of Socket instances to target
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 */
export function createTargetedServiceBroadcast(clients: Socket[], eventType: string, data: any): void {
  const event = toBinaryBroadcastEvent(eventType, data);
  clients.forEach(client => {
    if (client.connected) {
      client.emit(eventType, event);
    }
  });
}

/**
 * Broadcasts a JSON event to all connected clients on a server.
 * For Portal-to-frontend global broadcasts.
 * 
 * @param server - Socket.IO server instance
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 */
export function createPortalBroadcast(server: Server, eventType: string, data: any): void {
  const event = toJsonBroadcastEvent(eventType, data);
  server.emit(eventType, event);
}

/**
 * Broadcasts a JSON event to specific connected clients.
 * For Portal-to-frontend targeted broadcasts.
 * 
 * @param clients - Array of Socket instances to target
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 */
export function createTargetedPortalBroadcast(clients: Socket[], eventType: string, data: any): void {
  const event = toJsonBroadcastEvent(eventType, data);
  clients.forEach(client => {
    if (client.connected) {
      client.emit(eventType, event);
    }
  });
}

/**
 * Configuration for broadcasting system
 */
export const BroadcastConfig = {
  // Enable/disable broadcasting (for debugging)
  enabled: true,
  
  // Default timestamp precision
  timestampPrecision: 'milliseconds' as const,
  
  // Maximum broadcast payload size (in bytes)
  maxPayloadSize: 5 * 1024 * 1024, // 5MB
} as const;