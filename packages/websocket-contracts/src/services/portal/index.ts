/**
 * @fileoverview Portal Service WebSocket Contracts
 * 
 * Complete WebSocket API contracts for the Portal service, which handles
 * client communication, user actions, and system event broadcasting.
 */

// User actions (knowledge-integrator → portal)
export * from './user-actions';

// System events (portal → knowledge-integrator)  
export * from './system-events';

// Import action constants for combined export
import { PortalUserActions, type PortalUserActionType } from './user-actions';
import { PortalSystemEvents, type PortalSystemEventType } from './system-events';

// Re-export action constants
export { PortalUserActions, type PortalUserActionType };
export { PortalSystemEvents, type PortalSystemEventType };

// All Portal actions and events combined
export const PortalActions = {
  // User actions
  ...PortalUserActions,
  // System events (for reference)
  ...PortalSystemEvents,
} as const;

// Combined type for all portal communication
export type PortalCommunicationType = PortalUserActionType | PortalSystemEventType;