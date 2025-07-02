import { Server, Socket } from 'socket.io';

/**
 * Centralized broadcasting utilities for WebSocket communication.
 * 
 * This module provides consistent broadcasting across all services using
 * JSON for optimal compatibility and performance.
 */

/**
 * Creates a broadcast event for service communication.
 * 
 * @param type - Event type identifier
 * @param data - Event payload data
 * @param source - Source of the event (backend/portal)
 * @returns JSON broadcast event
 */
export function createBroadcastEvent(type: string, data: any, source: string = 'backend'): any {
  return {
    type,
    data,
    timestamp: Date.now(),
    source
  };
}

/**
 * Broadcasts an event to all connected clients on a server.
 * 
 * @param server - Socket.IO server instance
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 * @param source - Source of the event (optional)
 */
export function createBroadcast(server: Server, eventType: string, data: any, source?: string): void {
  const event = createBroadcastEvent(eventType, data, source);
  server.emit(eventType, event);
}

/**
 * Broadcasts an event to specific connected clients.
 * 
 * @param clients - Array of Socket instances to target
 * @param eventType - Event type to emit
 * @param data - Event data to broadcast
 * @param source - Source of the event (optional)
 */
export function createTargetedBroadcast(clients: Socket[], eventType: string, data: any, source?: string): void {
  const event = createBroadcastEvent(eventType, data, source);
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